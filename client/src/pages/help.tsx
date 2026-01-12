import { useMemo } from "react";
import { useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HELP_DOCS, getHelpDocById } from "@/lib/helpDocs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function getDocParam(location: string): string | null {
  try {
    const url = new URL(location, window.location.origin);
    return url.searchParams.get("doc");
  } catch {
    return null;
  }
}

export default function HelpPage() {
  const [location, setLocation] = useLocation();
  const [filter, setFilter] = useState("");
  const selectedId = getDocParam(location);
  const selected = getHelpDocById(selectedId) || HELP_DOCS[0] || null;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return HELP_DOCS;
    return HELP_DOCS.filter((d) => {
      return (
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    });
  }, [filter]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Help Center</h1>
          <p className="text-muted-foreground">Search the knowledge base and SOPs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Articles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Filter articles…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="max-h-[65vh] overflow-auto rounded-md border">
              <div className="divide-y">
                {filtered.map((d) => {
                  const isActive = selected?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                        isActive ? "bg-accent" : ""
                      }`}
                      onClick={() => setLocation(`/help?doc=${encodeURIComponent(d.id)}`)}
                    >
                      <div className="font-medium text-sm">{d.title}</div>
                      {d.summary ? (
                        <div className="text-xs text-muted-foreground line-clamp-2">{d.summary}</div>
                      ) : null}
                    </button>
                  );
                })}
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground">No matches.</div>
                ) : null}
              </div>
            </div>
            {selected ? (
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    void navigator.clipboard.writeText(selected.id);
                  } catch {}
                }}
              >
                Copy doc id
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected?.title || "Help"}</CardTitle>
            {selected?.id ? <div className="text-xs text-muted-foreground">{selected.id}</div> : null}
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            {selected?.markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.markdown}</ReactMarkdown>
            ) : (
              <div className="text-sm text-muted-foreground">No article selected.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

