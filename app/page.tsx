"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Youtube, Sparkles, AlertCircle, Moon, Sun } from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";
import SummaryView from "./components/SummaryView";
import HistorySidebar from "./components/HistorySidebar";


const extractVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [seekTime, setSeekTime] = useState<number | null>(null);

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const videoId = extractVideoId(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary("");
    setSeekTime(null);

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

  const handleHistorySelect = (item: any) => {
    setUrl(item.url);
    setSummary(item.summary);
    setError("");
    setSeekTime(null);
  };

  const handleSeek = (time: number) => {
    setSeekTime(time);
  };

  return (
    <main className={`min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 font-sans transition-colors duration-300 ${theme === "dark" ? "bg-neutral-900 text-neutral-100 selection:bg-indigo-500/50" : "bg-white text-neutral-900 selection:bg-indigo-500/30"
      }`}>
      <HistorySidebar
        onSelect={handleHistorySelect}
        currentSummary={summary}
        currentUrl={url}
        currentVideoId={videoId || undefined}
      />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed right-4 top-4 z-50 p-3 rounded-full shadow-lg transition-all ${theme === "dark"
          ? "bg-neutral-800 text-yellow-400 border border-neutral-700 hover:bg-neutral-700"
          : "bg-white text-neutral-600 border border-neutral-200 hover:text-indigo-600 hover:bg-neutral-50"
          }`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      <div className="w-full max-w-[95%] space-y-6">


        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className={`inline-flex items-center justify-center p-2 rounded-xl mb-2 ring-1 ${theme === "dark"
            ? "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30"
            : "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
            }`}>
            <Youtube className="w-6 h-6" />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent ${theme === "dark"
            ? "bg-gradient-to-br from-white to-neutral-400"
            : "bg-gradient-to-br from-neutral-900 to-neutral-600"
            }`}>
            Video Summarizer
          </h1>
        </motion.div>

        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="relative group max-w-2xl mx-auto w-full"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className={`relative flex items-center rounded-xl border p-1.5 shadow-lg ${theme === "dark"
            ? "bg-neutral-800 border-neutral-700"
            : "bg-neutral-100 border-neutral-300"
            }`}>
            <input
              type="text"
              placeholder="Paste YouTube URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-base outline-none ${theme === "dark"
                ? "text-white placeholder-neutral-400"
                : "text-neutral-900 placeholder-neutral-500"
                }`}
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Summarize <Sparkles className="w-3 h-3" />
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
            className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-center gap-3 max-w-2xl mx-auto"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Video Embed & Summary Result */}
        {(summary || (url && videoId) || loading) && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`grid gap-6 items-start w-full transition-all duration-500 ${(summary || loading) ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-4xl mx-auto"
              }`}
          >
            {/* Video Player */}
            {videoId && (
              <VideoPlayer videoId={videoId} isSticky={!!summary || loading} seekTime={seekTime} />
            )}

            {/* Summary */}
            {(summary || loading) && (
              <SummaryView
                summary={summary}
                loading={loading}
                theme={theme}
                onSeek={handleSeek}
              />
            )}
          </motion.div>
        )}

      </div>
    </main >
  );
}
