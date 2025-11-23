"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Youtube, Sparkles, AlertCircle } from "lucide-react";

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
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 ring-1 ring-indigo-500/20">
            <Youtube className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
            Video Summarizer
          </h1>
          <p className="text-neutral-400 text-lg">
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
          <div className="relative flex items-center bg-neutral-900 rounded-xl border border-neutral-800 p-2 shadow-2xl">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 px-4 py-3 text-lg outline-none"
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
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3"
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
            className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm"
          >
            <h2 className="text-xl font-semibold mb-4 text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Summary
            </h2>
            <div className="prose prose-invert prose-indigo max-w-none leading-relaxed text-neutral-300">
              <div className="whitespace-pre-line">
                {summary}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  );
}
