"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Youtube, Sparkles, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export default function Home() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary("");

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.mock) {
          setSummary(data.summary);
          setError(data.error + " (Showing mock data)");
          return;
        }
        throw new Error(data.error || "Something went wrong");
      }

      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-indigo-500/30 transition-colors">
      <div className="w-full max-w-4xl space-y-8">


        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 mb-4 ring-1 ring-indigo-500/20">
            <Youtube className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
            Video Summarizer
          </h1>
          <p className="text-neutral-600 text-lg">
            Paste a YouTube link and get the key takeaways in seconds.
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-neutral-100 rounded-xl border border-neutral-300 p-2 shadow-2xl">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent border-none text-neutral-900 placeholder-neutral-500 focus:ring-0 px-4 py-3 text-lg outline-none"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Summarize <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Summary Result */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-300">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-indigo-700">
                Summary
              </h2>
            </div>

            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold text-neutral-900 mb-4 mt-6 first:mt-0" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-3 mt-5 first:mt-0" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-semibold text-neutral-700 mb-2 mt-4 first:mt-0" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-neutral-700 leading-relaxed mb-4" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-none space-y-2 mb-4 ml-0" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 ml-2 text-neutral-700" {...props} />
                  ),
                  li: ({ node, children, ...props }) => (
                    <li className="text-neutral-700 flex items-start gap-3" {...props}>
                      <span className="text-indigo-600 mt-1.5 flex-shrink-0">•</span>
                      <span className="flex-1">{children}</span>
                    </li>
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="text-neutral-900 font-semibold" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="text-indigo-700 italic" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code className="bg-neutral-200 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                    ) : (
                      <code className="block bg-neutral-200 text-neutral-800 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4" {...props} />
                    ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-neutral-600 my-4" {...props} />
                  )
                }}
              >{summary}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}

      </div>
    </main >
  );
}
