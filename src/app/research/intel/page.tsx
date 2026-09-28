"use client";
import { useEffect, useState, useCallback } from "react";
import ResearchPage from "@/components/researcher/ResearchPage";
import { researchApi, newsApi } from "@/lib/api";
import {
  ExternalLink, Clock, Search, RefreshCw, FileText, BookOpen,
  Users, Quote, Loader2, ChevronRight, Newspaper, Database,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ResearchItem {
  id: string; source: string; title: string; abstract?: string;
  authors: { name: string }[]; publication_date?: string;
  journal?: string; doi?: string; arxiv_id?: string;
  url?: string; pdf_url?: string; citation_count: number;
  topics: string[];
}
interface NewsItem {
  id: string; title: string; description?: string; url: string;
  image_url?: string; publisher?: string; published_at?: string;
}

const C = {
  bg: "#0d1117", surface: "#161b22", border: "#21262d",
  text: "#e6edf3", muted: "#7d8590", muted2: "#484f58",
};

const SOURCE_COLORS: Record<string, string> = {
  openalex: "#4f46e5", arxiv: "#b45309", crossref: "#0891b2",
};

const SEARCH_DEFAULTS = [
  "quantum computing", "quantum error correction",
  "quantum algorithms", "quantum hardware",
  "quantum machine learning", "quantum cryptography",
  "Grover algorithm", "Shor algorithm", "QAOA", "VQE",
];

function fmt(d?: string) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d.slice(0, 10); }
}

/* ─── Paper row ──────────────────────────────────────────────────────────── */
function PaperRow({ item }: { item: ResearchItem }) {
  const color = SOURCE_COLORS[item.source] ?? "#6366f1";
  return (
    <div className="group border-b last:border-0 px-4 py-3.5" style={{ borderColor: C.border }}>
      <div className="flex items-start gap-3">
        <div className="w-0.5 rounded-full shrink-0 mt-1" style={{ background: color, minHeight: 40 }} />
        <div className="flex-1 min-w-0">
          <a href={item.url ?? "#"} target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium leading-snug line-clamp-2 flex items-start gap-1"
            style={{ color: C.text }}>
            <span className="hover:underline">{item.title}</span>
            <ExternalLink size={10} className="shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity" />
          </a>

          {item.authors.length > 0 && (
            <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.muted }}>
              <Users size={9} />
              {item.authors.slice(0, 3).map(a => a.name).join(", ")}
              {item.authors.length > 3 && ` +${item.authors.length - 3}`}
            </p>
          )}

          {item.abstract && (
            <p className="text-[11px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: C.muted }}>{item.abstract}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ background: `${color}22`, color, border: `1px solid ${color}40` }}>
              {item.source}
            </span>
            {item.publication_date && (
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: C.muted2 }}>
                <Clock size={9} />{fmt(item.publication_date)}
              </span>
            )}
            {item.journal && (
              <span className="text-[10px] truncate max-w-[160px]" style={{ color: C.muted2 }}>{item.journal}</span>
            )}
            {item.citation_count > 0 && (
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: C.muted2 }}>
                <Quote size={9} />{item.citation_count.toLocaleString()}
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              {item.doi && (
                <a href={`https://doi.org/${item.doi}`} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] hover:underline" style={{ color: "#4f46e5" }}>DOI</a>
              )}
              {item.arxiv_id && (
                <a href={`https://arxiv.org/abs/${item.arxiv_id}`} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] hover:underline" style={{ color: "#b45309" }}>arXiv</a>
              )}
              {item.pdf_url && (
                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] flex items-center gap-0.5 hover:underline" style={{ color: "#059669" }}>
                  <FileText size={9} />PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── News row ───────────────────────────────────────────────────────────── */
function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className="group flex items-start gap-3 border-b last:border-0 px-4 py-3.5 hover:bg-[#161b22] transition-colors"
      style={{ borderColor: C.border }}>
      <Newspaper size={14} className="mt-0.5 shrink-0" style={{ color: "#059669" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2 group-hover:underline" style={{ color: C.text }}>{item.title}</p>
        {item.description && (
          <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: C.muted }}>{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {item.publisher && <span className="text-[10px]" style={{ color: C.muted2 }}>{item.publisher}</span>}
          {item.published_at && (
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: C.muted2 }}>
              <Clock size={9} />{fmt(item.published_at)}
            </span>
          )}
        </div>
      </div>
      <ExternalLink size={10} className="shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: C.muted }} />
    </a>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function ResearchIntel() {
  const [activePanel, setActivePanel] = useState<"papers" | "news">("papers");
  const [query,       setQuery]       = useState("quantum computing");
  const [searchInput, setSearchInput] = useState("");
  const [searching,   setSearching]   = useState(false);

  const [papers,   setPapers]   = useState<ResearchItem[]>([]);
  const [news,     setNews]     = useState<NewsItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [nLoading, setNLoading] = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const loadPapers = useCallback(async (q: string) => {
    setLoading(true); setError(null);
    try {
      const res = await researchApi.latest({ topic: q, per_page: 15 });
      setPapers(res.data.results ?? []);
    } catch {
      setError("Backend unavailable — start the FastAPI server.");
      setPapers([]);
    } finally { setLoading(false); }
  }, []);

  const loadNews = useCallback(async (q: string) => {
    setNLoading(true);
    try {
      const res = await newsApi.latest({ topic: q, max_results: 10 });
      setNews(res.data.results ?? []);
    } catch { setNews([]); }
    finally { setNLoading(false); }
  }, []);

  useEffect(() => {
    loadPapers(query);
    loadNews(query);
  }, [query, loadPapers, loadNews]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true); setLoading(true); setError(null);
    try {
      const res = await researchApi.search({ q: searchInput.trim(), per_page: 15 });
      setPapers(res.data.results ?? []);
    } catch { setError("Search failed."); }
    finally { setLoading(false); setSearching(false); }
  };

  return (
    <ResearchPage title="Research Intelligence" subtitle="Papers · Preprints · News">
      <div className="flex gap-5 h-full min-h-0">

        {/* ── Left: search + topics ──────────────────────────────────── */}
        <div className="w-52 shrink-0 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search papers…"
                className="w-full pl-7 pr-2 h-7 rounded text-xs bg-[#0d1117] border focus:outline-none"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>
            <button type="submit" disabled={searching || !searchInput.trim()}
              className="px-2 h-7 rounded text-xs font-semibold text-white disabled:opacity-40 transition-colors"
              style={{ background: "#238636" }}>
              {searching ? <Loader2 size={10} className="animate-spin" /> : "Go"}
            </button>
          </form>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted2 }}>Topics</p>
            <div className="flex flex-col gap-0.5">
              {SEARCH_DEFAULTS.map(t => (
                <button key={t} onClick={() => { setQuery(t); setSearchInput(""); }}
                  className="text-left text-xs px-2 py-1.5 rounded flex items-center justify-between transition-colors"
                  style={{
                    background: query === t && !searchInput ? "#21262d" : "transparent",
                    color: query === t && !searchInput ? C.text : C.muted,
                  }}>
                  <span>{t}</span>
                  {query === t && !searchInput && <ChevronRight size={10} />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: C.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted2 }}>Sources</p>
            <div className="space-y-1.5 text-[10px]" style={{ color: C.muted }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#4f46e5" }} />OpenAlex
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#b45309" }} />arXiv
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#0891b2" }} />Crossref
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#059669" }} />GNews
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: results ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Panel toggle */}
          <div className="flex gap-1 mb-3">
            {([["papers", BookOpen, "Papers"], ["news", Newspaper, "News"]] as const).map(([id, Icon, label]) => (
              <button key={id} onClick={() => setActivePanel(id as any)}
                className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium transition-colors"
                style={{
                  background: activePanel === id ? "#21262d" : "transparent",
                  color: activePanel === id ? C.text : C.muted,
                  border: `1px solid ${activePanel === id ? "#30363d" : "transparent"}`,
                }}>
                <Icon size={11} />{label}
              </button>
            ))}
            <button onClick={() => { loadPapers(query); loadNews(query); }}
              className="ml-auto text-xs flex items-center gap-1 px-2 h-7 rounded transition-colors hover:bg-[#21262d]"
              style={{ color: C.muted }}>
              <RefreshCw size={10} />Refresh
            </button>
          </div>

          {/* Papers panel */}
          {activePanel === "papers" && (
            <div className="flex-1 rounded-lg border overflow-auto" style={{ borderColor: C.border, background: C.bg }}>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-2" style={{ color: C.muted }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : error ? (
                <div className="text-center py-16" style={{ color: C.muted }}>
                  <p className="text-sm text-[#f85149]">{error}</p>
                </div>
              ) : papers.length === 0 ? (
                <div className="text-center py-16" style={{ color: C.muted }}>
                  <Database size={28} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No papers found.</p>
                </div>
              ) : (
                papers.map(p => <PaperRow key={p.id} item={p} />)
              )}
            </div>
          )}

          {/* News panel */}
          {activePanel === "news" && (
            <div className="flex-1 rounded-lg border overflow-auto" style={{ borderColor: C.border, background: C.bg }}>
              {nLoading ? (
                <div className="flex items-center justify-center py-20 gap-2" style={{ color: C.muted }}>
                  <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading news…</span>
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-16" style={{ color: C.muted }}>
                  <Newspaper size={28} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">News unavailable</p>
                  <p className="text-[11px] mt-1">Add GNEWS_API_KEY to backend .env</p>
                </div>
              ) : (
                news.map(n => <NewsRow key={n.id} item={n} />)
              )}
            </div>
          )}
        </div>
      </div>
    </ResearchPage>
  );
}
