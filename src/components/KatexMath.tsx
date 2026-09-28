"use client";
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Renders markdown-like text with inline and block LaTeX math.
 * Supports **bold**, *italic*, `inline code`, ```code blocks```,
 * and $$block math$$ / $inline math$.
 */
export default function KatexMath({ content }: { content: string }) {
  const html = useMemo(() => renderContent(content), [content]);
  return (
    <div
      className="lesson-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderContent(text: string): string {
  // Process block math first: $$...$$
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<span class="text-red-500">[math error]</span>`;
    }
  });

  // Code blocks ```...```
  result = result.replace(/```(\w+)?\n?([\s\S]+?)```/g, (_, lang, code) => {
    return `<pre class="bg-slate-900 text-slate-100 rounded-lg p-4 my-3 overflow-x-auto text-xs font-mono leading-relaxed"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline math $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<code>${math}</code>`;
    }
  });

  // Inline code `...`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **...**
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *...*
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Newlines → paragraphs
  result = result
    .split(/\n\n+/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<div") || trimmed.startsWith("<pre")) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return result;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
