"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Heading2,
  Heading3,
  Quote,
  Code,
  Image as ImageIcon,
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload-client";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";

interface Props {
  value: object;
  onChange: (val: object) => void;
}

type BlockNode = {
  type: string;
  children: { text: string }[];
  url?: string;
};

function replaceNodeChildren(nodes: BlockNode[], index: number, text: string): BlockNode[] {
  const next = [...nodes];
  const cur = next[index];
  if (!cur) return nodes;
  next[index] = { ...cur, children: [{ text }] };
  return next;
}

function removeNodeAt(nodes: BlockNode[], index: number): BlockNode[] {
  return nodes.filter((_, i) => i !== index);
}

export function ArticleEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const nodes = ((value as { children?: BlockNode[] }).children ?? []) as BlockNode[];

  const pushNodes = useCallback(
    (next: BlockNode[]) => {
      onChange({ children: next });
    },
    [onChange]
  );

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      setUploadProgress(0);
      try {
        const secureUrl = await uploadImageToCloudinary(file, "articles", (pct) => setUploadProgress(pct));
        pushNodes([
          ...nodes,
          { type: "img", url: secureUrl, children: [{ text: "" }] },
        ]);
        toast.success("Image uploaded successfully.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload image.");
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    };
    input.click();
  }, [nodes, pushNodes]);

  const addBlock = (type: string) => {
    const initial =
      type === "blockquote" ? "Quote text…" : type === "code_block" ? "// code" : "";
    pushNodes([...nodes, { type, children: [{ text: initial }] }]);
  };

  const moveBlock = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= nodes.length) return;
    const next = [...nodes];
    [next[from], next[to]] = [next[to], next[from]];
    pushNodes(next);
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-muted/30">
        <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => addBlock("p")}>
          Paragraph
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => addBlock("h2")} title="Heading 2">
          <Heading2 className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => addBlock("h3")} title="Heading 3">
          <Heading3 className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => addBlock("blockquote")} title="Quote">
          <Quote className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => addBlock("code_block")} title="Code block">
          <Code className="size-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleImageUpload}
          disabled={uploading}
          title="Insert image"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
        </Button>
      </div>
      {uploading && uploadProgress !== null ? (
        <div className="border-b px-3 py-2.5 bg-muted/20">
          <UploadProgressBar value={uploadProgress} label="Uploading image…" />
        </div>
      ) : null}

      <div className="min-h-64 p-4 space-y-4">
        {nodes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add blocks with the toolbar (paragraph, headings, quote, code, image), then type in each field below.
          </p>
        ) : (
          nodes.map((node, i) => {
            const text = node.children?.map((c) => c.text).join("") ?? "";
            const label =
              node.type === "h2"
                ? "Heading 2"
                : node.type === "h3"
                  ? "Heading 3"
                  : node.type === "blockquote"
                    ? "Quote"
                    : node.type === "code_block"
                      ? "Code"
                      : node.type === "img"
                        ? "Image"
                        : "Paragraph";

            return (
              <div key={i} className="rounded-lg border bg-background p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      title="Move up"
                      onClick={() => moveBlock(i, -1)}
                      disabled={i === 0}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      title="Move down"
                      onClick={() => moveBlock(i, 1)}
                      disabled={i === nodes.length - 1}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      title="Remove block"
                      onClick={() => pushNodes(removeNodeAt(nodes, i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {node.type === "img" ? (
                  <div className="space-y-2">
                    {(node as BlockNode).url ? (
                      <img src={(node as BlockNode).url} alt="" className="max-w-full max-h-48 rounded-md border object-contain" />
                    ) : null}
                    <Textarea
                      className="min-h-[72px] text-sm font-mono"
                      placeholder="Image URL"
                      value={(node as BlockNode).url ?? ""}
                      onChange={(e) => {
                        const next = [...nodes];
                        const cur = next[i] as BlockNode;
                        next[i] = { ...cur, type: "img", url: e.target.value, children: [{ text: "" }] };
                        pushNodes(next);
                      }}
                    />
                  </div>
                ) : (
                  <Textarea
                    className="min-h-[88px] text-sm"
                    value={text}
                    onChange={(e) => {
                      pushNodes(replaceNodeChildren(nodes, i, e.target.value));
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
