"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Clock, Search, RefreshCw, FileText, Newspaper, BookOpen, ChevronRight, Users, Quote, Loader2 } from "lucide-react";
import { researchApi, newsApi } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ResearchItem {
  id: string; source: string; title: string; abstract?: string;
  authors: { name: string }[]; publication_date?: string;
  journal?: string; publisher?: string; doi?: string; arxiv_id?: string;
  url?: string; pdf_url?: string; citation_count: number;
  topics: string[]; categories: string[];
}
interface NewsItem {
  id: string; title: string; description?: string; url: string;
  image_url?: string; publisher?: string; published_at?: string; topics: string[];
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const TOPIC_TABS = [
  { id: "quantum computing",         label: "All"             },
  { id: "quantum algorithms",        label: "Algorithms"      },
  { id: "quantum error correction",  label: "Error Correction"},
  { id: "quantum hardware",          label: "Hardware"        },
  { id: "quantum machine learning",  label: "QML"             },
  { id: "quantum cryptography",      label: "Cryptography"    },
];

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  openalex:  { label: "OpenAlex",  color: "#4f46e5" },
  arxiv:     { label: "arXiv",     color: "#b45309" },
  crossref:  { label: "Crossref",  color: "#0891b2" },
  gnews:     { label: "News",      color: "#059669" },
};

function formatDate(d?: string) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d.slice(0, 10); }
}

/* ─── Research card ──────────────────────────────────────────────────────── */
function PaperCard({ item, delay = 0 }: { item: ResearchItem; delay?: number }) {
  const badge = SOURCE_BADGES[item.source] ?? { label: item.source, color: "#6366f1" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04 }}
      className="group flex flex-col gap-3 px-5 py-4 border-b border-[#f0f0f2] hover:bg-[#fafafa] transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Source colour strip */}
        <div className="w-1 shrink-0 rounded-full mt-1" style={{ background: badge.color, minHeight: 44 }} />
        <div className="flex-1 min-w-0">
          <a href={item.url ?? "#"} target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold text-[#111118] hover:text-[#4f46e5] transition-colors leading-snug line-clamp-2 flex items-start gap-1.5">
            {item.title}
            <ExternalLink size={11} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Authors */}
          {item.authors.length > 0 && (
            <p className="text-[11px] text-[#71717a] mt-1 flex items-center gap-1">
              <Users size={10} />
              {item.authors.slice(0, 3).map(a => a.name).join(", ")}
              {item.authors.length > 3 && ` +${item.authors.length - 3}`}
            </p>
          )}

          {/* Abstract */}
          {item.abstract && (
            <p className="text-xs text-[#52525b] mt-1.5 leading-relaxed line-clamp-2">{item.abstract}</p>
          )}

          {/* Footer row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: `${badge.color}12`, color: badge.color, border: `1px solid ${badge.color}25` }}>
              {badge.label}
            </span>
            {item.publication_date && (
              <span className="text-[10px] text-[#a1a1aa] flex items-center gap-0.5">
                <Clock size={9} />{formatDate(item.publication_date)}
              </span>
            )}
            {item.journal && <span className="text-[10px] text-[#a1a1aa] truncate max-w-[180px]">{item.journal}</span>}
            {item.citation_count > 0 && (
              <span className="text-[10px] text-[#a1a1aa] flex items-center gap-0.5">
                <Quote size={9} />{item.citation_count.toLocaleString()} citations
              </span>
            )}
            {(item.doi || item.arxiv_id) && (
              <div className="flex gap-2">
                {item.doi && (
                  <a href={`https://doi.org/${item.doi}`} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-[#4f46e5] hover:underline">DOI</a>
                )}
                {item.arxiv_id && (
                  <a href={`https://arxiv.org/abs/${item.arxiv_id}`} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-[#b45309] hover:underline">arXiv</a>
                )}
                {item.pdf_url && (
                  <a href={item.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-[#059669] hover:underline flex items-center gap-0.5">
                    <FileText size={9} />PDF
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── News card ──────────────────────────────────────────────────────────── */
function NewsCard({ item, delay = 0 }: { item: NewsItem; delay?: number }) {
  return (
    <motion.a
      href={item.url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04 }}
      className="group flex gap-4 p-4 rounded-xl border border-[#e4e4e7] bg-white hover:border-[#059669] hover:shadow-sm transition-all"
    >
      {item.image_url && (
        <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-[#f0f0f2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111118] leading-snug line-clamp-2 group-hover:text-[#059669] transition-colors">
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-[#71717a] mt-1 leading-relaxed line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          {item.publisher && <span className="text-[10px] text-[#a1a1aa]">{item.publisher}</span>}
          {item.published_at && (
            <span className="text-[10px] text-[#a1a1aa] flex items-center gap-0.5">
              <Clock size={9} />{formatDate(item.published_at)}
            </span>
          )}
        </div>
      </div>
      <ExternalLink size={12} className="text-[#d4d4d8] group-hover:text-[#059669] shrink-0 mt-0.5 transition-colors" />
    </motion.a>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function DiscoverPage() {
  const [activeTab,   setActiveTab]   = useState("quantum computing");
  const [activeView,  setActiveView]  = useState<"papers" | "news">("papers");
  const [search,      setSearch]      = useState("");
  const [searching,   setSearching]   = useState(false);

  const [papers,      setPapers]      = useState<ResearchItem[]>([]);
  const [news,        setNews]        = useState<NewsItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Load papers for the active topic
  const loadPapers = useCallback(async (topic: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await researchApi.latest({ topic, per_page: 12 });
      setPapers(res.data.results ?? []);
    } catch {
      setError("Could not load research papers. Backend may be unavailable.");
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load news
  const loadNews = useCallback(async (topic: string) => {
    setNewsLoading(true);
    try {
      const res = await newsApi.latest({ topic, max_results: 10 });
      setNews(res.data.results ?? []);
    } catch {
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapers(activeTab);
    loadNews(activeTab);
  }, [activeTab, loadPapers, loadNews]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setLoading(true);
    setError(null);
    try {
      const res = await researchApi.search({ q: search.trim(), per_page: 12 });
      setPapers(res.data.results ?? []);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    loadPapers(activeTab);
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f8]">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e4e4e7]">
        <div className="max-w-5xl mx-auto px-8 py-7">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-1.5">
                QUBIT · Learner
              </p>
              <h1 className="text-2xl font-bold text-[#111118]">Discover</h1>
              <p className="text-sm text-[#52525b] mt-1">
                Research papers, preprints, and quantum computing news — powered by OpenAlex, arXiv, and GNews.
              </p>
            </div>
            {/* Search */}
            <form onSubmit={handleSearch} className="relative shrink-0 flex gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search papers…"
                  className="pl-8 pr-3 h-8 rounded border border-[#d4d4d8] text-sm bg-white text-[#111118] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#4f46e5] w-48"
                />
              </div>
              <button type="submit" disabled={searching || !search.trim()}
                className="px-3 h-8 rounded bg-[#4f46e5] text-white text-xs font-semibold disabled:opacity-40 hover:bg-[#4338ca] transition-colors flex items-center gap-1">
                {searching ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
                Search
              </button>
              {search && (
                <button type="button" onClick={handleClearSearch}
                  className="px-2 h-8 rounded border border-[#e4e4e7] text-xs text-[#71717a] hover:bg-[#f7f7f8] transition-colors">
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* View toggle + topic tabs */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <div className="flex rounded-lg border border-[#e4e4e7] overflow-hidden shrink-0">
              <button onClick={() => setActiveView("papers")}
                className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium transition-colors"
                style={{ background: activeView === "papers" ? "#111118" : "white", color: activeView === "papers" ? "white" : "#52525b" }}>
                <BookOpen size={11} />Papers
              </button>
              <button onClick={() => setActiveView("news")}
                className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium transition-colors border-l border-[#e4e4e7]"
                style={{ background: activeView === "news" ? "#111118" : "white", color: activeView === "news" ? "white" : "#52525b" }}>
                <Newspaper size={11} />News
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto">
              {TOPIC_TABS.map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                  className="px-3 h-7 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                  style={{
                    background: activeTab === tab.id && !search ? "#111118" : "transparent",
                    color:      activeTab === tab.id && !search ? "#fff" : "#52525b",
                    border:     `1px solid ${activeTab === tab.id && !search ? "#111118" : "#e4e4e7"}`,
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Papers */}
        {activeView === "papers" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-[#a1a1aa]">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading research papers…</span>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-[#a1a1aa]">
                <p className="text-sm text-[#dc2626]">{error}</p>
                <button onClick={() => loadPapers(activeTab)}
                  className="mt-3 text-xs text-[#4f46e5] hover:underline flex items-center gap-1 mx-auto">
                  <RefreshCw size={11} />Retry
                </button>
              </div>
            ) : papers.length === 0 ? (
              <div className="text-center py-16 text-[#a1a1aa]">
                <p className="text-sm">No papers found{search ? ` for "${search}"` : ""}.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#e4e4e7] overflow-hidden">
                {papers.map((p, i) => <PaperCard key={p.id} item={p} delay={i} />)}
              </div>
            )}

            <p className="text-[10px] text-[#a1a1aa] mt-5 text-center">
              Data from <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenAlex</a>
              {" · "}<a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className="hover:underline">arXiv</a>
              {" · "}<a href="https://www.crossref.org" target="_blank" rel="noopener noreferrer" className="hover:underline">Crossref</a>
            </p>
          </>
        )}

        {/* News */}
        {activeView === "news" && (
          <>
            {newsLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-[#a1a1aa]">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading news…</span>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-[#e4e4e7]">
                <Newspaper size={32} className="mx-auto mb-3 text-[#d4d4d8]" />
                <p className="text-sm text-[#71717a] font-medium">News feed unavailable</p>
                <p className="text-xs text-[#a1a1aa] mt-1 max-w-xs mx-auto">
                  A GNews API key is required. Add <code className="font-mono bg-[#f7f7f8] px-1 rounded">GNEWS_API_KEY</code> to the backend <code className="font-mono bg-[#f7f7f8] px-1 rounded">.env</code> file.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {news.map((n, i) => <NewsCard key={n.id} item={n} delay={i} />)}
              </div>
            )}
            {news.length > 0 && (
              <p className="text-[10px] text-[#a1a1aa] mt-5 text-center">
                News powered by <a href="https://gnews.io" target="_blank" rel="noopener noreferrer" className="hover:underline">GNews</a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
