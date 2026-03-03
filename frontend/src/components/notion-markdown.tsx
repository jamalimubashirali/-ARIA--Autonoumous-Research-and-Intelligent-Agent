"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Quote, AlertTriangle, Info } from "lucide-react";
import type { Components } from "react-markdown";

interface NotionMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Notion-style Markdown renderer.
 *
 * Renders headings, paragraphs, lists, tables, links, blockquotes,
 * and code blocks with clean spacing, soft borders, and subtle colors
 * that mimic the Notion reading experience.
 */
export default function NotionMarkdown({
  content,
  className = "",
}: NotionMarkdownProps) {
  const components: Components = {
    // -------- Headings --------
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-10 mb-5 first:mt-0 pb-3 border-b border-border/40">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl sm:text-[1.65rem] font-bold tracking-tight text-foreground mt-10 mb-4 pb-2.5 border-b border-border/30">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold text-foreground/90 mt-6 mb-2">
        {children}
      </h4>
    ),

    // -------- Paragraphs --------
    p: ({ children }) => (
      <p className="text-[15px] leading-[1.8] text-foreground/85 mb-4 [&:last-child]:mb-0">
        {children}
      </p>
    ),

    // -------- Lists --------
    ul: ({ children }) => (
      <ul className="my-4 ml-1 space-y-2 text-[15px]">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 ml-1 space-y-2 text-[15px] list-decimal list-inside">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="flex items-start gap-2.5 text-foreground/85 leading-[1.75]">
        <span className="mt-[10px] h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
        <span className="flex-1">{children}</span>
      </li>
    ),

    // -------- Links --------
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 underline underline-offset-[3px] decoration-primary/30 hover:decoration-primary/60 transition-colors inline-flex items-center gap-1 font-medium"
      >
        {children}
        <ExternalLink className="w-3 h-3 inline-block opacity-50" />
      </a>
    ),

    // -------- Strong / Emphasis --------
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-foreground/80">{children}</em>
    ),

    // -------- Blockquote --------
    blockquote: ({ children }) => (
      <blockquote className="my-5 border-l-[3px] border-primary/40 bg-primary/[0.04] rounded-r-lg pl-5 pr-4 py-3.5 text-foreground/80 italic">
        {children}
      </blockquote>
    ),

    // -------- Code --------
    code: ({ children, className: codeClassName }) => {
      const isInline = !codeClassName;
      if (isInline) {
        return (
          <code className="bg-muted/80 text-foreground/90 text-[13px] px-1.5 py-0.5 rounded-md font-mono border border-border/30">
            {children}
          </code>
        );
      }
      return (
        <code className="block bg-[#0d1117] text-slate-300 text-[13px] p-5 rounded-xl font-mono overflow-x-auto border border-border/20 my-5 leading-relaxed">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <pre className="not-prose">{children}</pre>,

    // -------- Tables --------
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-[14px]">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted/50 border-b border-border/40">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-foreground/80 border-t border-border/20">
        {children}
      </td>
    ),

    // -------- Horizontal Rule --------
    hr: () => <hr className="my-8 border-border/30" />,

    // -------- Images --------
    img: ({ src, alt }) => (
      <figure className="my-6">
        <img
          src={src}
          alt={alt || ""}
          className="rounded-xl border border-border/30 shadow-sm w-full"
        />
        {alt && (
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
  };

  return (
    <article className={`notion-markdown ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
