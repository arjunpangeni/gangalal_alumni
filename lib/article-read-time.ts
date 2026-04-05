type BlockNode = {
  type?: string;
  children?: { text?: string }[];
  url?: string;
};

/** ~180 words/min for mixed Nepali (Devanagari) + English body text */
const WORDS_PER_MINUTE = 180;

function blockPlainText(node: BlockNode): string {
  if (node.type === "img") return "";
  return node.children?.map((c) => c.text ?? "").join("") ?? "";
}

export function estimateArticleReadMinutes(
  title: string,
  content: Record<string, unknown> | null | undefined
): number {
  const raw = content?.children;
  const blocks = Array.isArray(raw) ? (raw as BlockNode[]) : [];
  const body = blocks.map(blockPlainText).join(" ");
  const words = `${title} ${body}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
