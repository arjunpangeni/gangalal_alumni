type BlockNode = {
  type?: string;
  children?: { text?: string }[];
  url?: string;
};

function blockText(node: BlockNode): string {
  return node.children?.map((c) => c.text ?? "").join("") ?? "";
}

export function ArticleContent({ content }: { content: Record<string, unknown> | null | undefined }) {
  const raw = content?.children;
  const blocks = Array.isArray(raw) ? (raw as BlockNode[]) : [];

  if (blocks.length === 0) {
    return <p className="text-muted-foreground">No article body yet.</p>;
  }

  return (
    <div className="article-body space-y-8 text-[1.0625rem] leading-[1.8] text-foreground sm:text-lg sm:leading-[1.75] sm:space-y-9">
      {blocks.map((node, i) => {
        const text = blockText(node);
        const trimmed = text.trim();

        switch (node.type) {
          case "h2":
            return trimmed ? (
              <h2
                key={i}
                className="scroll-mt-24 text-2xl font-bold leading-snug tracking-tight text-foreground first:mt-0 sm:text-[1.75rem]"
              >
                {text}
              </h2>
            ) : null;
          case "h3":
            return trimmed ? (
              <h3
                key={i}
                className="scroll-mt-24 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-[1.4rem]"
              >
                {text}
              </h3>
            ) : null;
          case "blockquote":
            return trimmed ? (
              <blockquote
                key={i}
                className="border-l-[3px] border-primary/45 py-1 pl-5 text-[0.98em] leading-[1.75] text-muted-foreground [&>p]:m-0 whitespace-pre-wrap sm:text-[1.02em]"
              >
                {text}
              </blockquote>
            ) : null;
          case "code_block":
            return trimmed ? (
              <pre
                key={i}
                className="overflow-x-auto rounded-lg border border-border/80 bg-muted/50 p-4 text-[0.875em] leading-normal"
              >
                <code className="whitespace-pre font-mono text-foreground">{text}</code>
              </pre>
            ) : null;
          case "img":
            return node.url ? (
              <figure key={i} className="my-2">
                <img
                  src={node.url}
                  alt=""
                  className="max-h-[32rem] w-full rounded-lg border border-border/60 bg-muted/20 object-contain"
                />
              </figure>
            ) : null;
          case "p":
          default:
            if (!trimmed) return null;
            return (
              <p key={i} className="text-pretty whitespace-pre-wrap">
                {text}
              </p>
            );
        }
      })}
    </div>
  );
}
