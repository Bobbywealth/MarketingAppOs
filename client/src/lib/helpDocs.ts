export type HelpDoc = {
  id: string; // relative path key (stable)
  title: string;
  summary: string;
  markdown: string;
};

function extractTitle(markdown: string): string {
  const lines = (markdown || "").split("\n");
  for (const line of lines) {
    const m = /^\s*#\s+(.+?)\s*$/.exec(line);
    if (m?.[1]) return m[1].trim();
  }
  return "Help article";
}

function extractSummary(markdown: string): string {
  const lines = (markdown || "").split("\n");
  const paragraphs: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    const p = buf.join(" ").trim();
    buf = [];
    if (p) paragraphs.push(p);
  };

  for (const raw of lines) {
    const line = raw.trim();
    // Skip headings and separators
    if (line.startsWith("#")) {
      flush();
      continue;
    }
    if (!line) {
      flush();
      continue;
    }
    if (/^[-*_]{3,}$/.test(line)) continue;
    // Avoid link-only paragraphs in summary
    buf.push(line.replace(/\[(.+?)\]\(.+?\)/g, "$1"));
    if (buf.join(" ").length > 220) break;
  }
  flush();
  return (paragraphs[0] || "").slice(0, 220);
}

// Import internal knowledge base markdown as raw strings.
// Note: This relies on Vite dev server fs.allow including repo root/docs.
const kbModules = import.meta.glob("../../docs/knowledge-base/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const HELP_DOCS: HelpDoc[] = Object.entries(kbModules)
  .map(([path, markdown]) => {
    const rel = path.replace(/^.*\/docs\//, "docs/"); // e.g. docs/knowledge-base/...
    return {
      id: rel,
      title: extractTitle(markdown),
      summary: extractSummary(markdown),
      markdown,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export function getHelpDocById(id: string | null | undefined): HelpDoc | null {
  if (!id) return null;
  return HELP_DOCS.find((d) => d.id === id) || null;
}

