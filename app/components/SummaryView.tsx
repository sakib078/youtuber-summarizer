"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Play, Copy, Check, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryViewProps {
    summary: string;
    loading?: boolean;
    theme?: "light" | "dark";
    onSeek?: (time: number) => void;
}

export default function SummaryView({ summary, loading, theme = "light", onSeek }: SummaryViewProps) {
    const isDark = theme === "dark";
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([summary], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "summary.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const parseTime = (timeStr: string) => {
        const parts = timeStr.split(":").map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const renderWithTimestamps = (text: string) => {
        if (!text) return text;
        const regex = /(\d{1,2}:\d{2}(?::\d{2})?)/g;
        const parts = text.split(regex);

        return parts.map((part, i) => {
            if (regex.test(part)) {
                const seconds = parseTime(part);
                return (
                    <button
                        key={i}
                        onClick={() => onSeek?.(seconds)}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-1 rounded text-xs font-medium transition-colors ${isDark
                            ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            }`}
                        title={`Seek to ${part}`}
                    >
                        <Play className="w-2 h-2 fill-current" />
                        {part}
                    </button>
                );
            }
            return part;
        });
    };

    const TextRenderer = ({ children }: { children: React.ReactNode }) => {
        if (typeof children === 'string') {
            return <>{renderWithTimestamps(children)}</>;
        }
        // Handle arrays of children (e.g. bold text mixed with plain text)
        if (Array.isArray(children)) {
            return (
                <>
                    {children.map((child, i) => (
                        <TextRenderer key={i}>{child}</TextRenderer>
                    ))}
                </>
            );
        }
        return <>{children}</>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`border rounded-2xl shadow-2xl backdrop-blur-sm h-[70vh] overflow-y-auto custom-scrollbar relative transition-colors duration-300 ${isDark
                ? "bg-neutral-800/50 border-neutral-700"
                : "bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-300"
                }`}
        >
            <div className={`flex items-center justify-between p-6 pb-4 border-b sticky top-0 backdrop-blur-md z-20 rounded-t-2xl transition-colors duration-300 ${isDark
                ? "border-neutral-700 bg-neutral-900/95"
                : "border-neutral-300 bg-neutral-50/95"
                }`}>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h2 className={`text-2xl font-semibold ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                        Summary
                    </h2>
                </div>

                {!loading && summary && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                ? "hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
                                : "hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700"
                                }`}
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleDownload}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                ? "hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
                                : "hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700"
                                }`}
                            title="Download Markdown"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="markdown-content p-6 pt-4">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className={`h-8 w-3/4 rounded ${isDark ? "bg-neutral-700" : "bg-neutral-300"}`}></div>
                        <div className="space-y-2">
                            <div className={`h-4 w-full rounded ${isDark ? "bg-neutral-700" : "bg-neutral-200"}`}></div>
                            <div className={`h-4 w-5/6 rounded ${isDark ? "bg-neutral-700" : "bg-neutral-200"}`}></div>
                            <div className={`h-4 w-4/6 rounded ${isDark ? "bg-neutral-700" : "bg-neutral-200"}`}></div>
                        </div>
                        <div className={`h-8 w-1/2 rounded mt-6 ${isDark ? "bg-neutral-700" : "bg-neutral-300"}`}></div>
                        <div className="space-y-2">
                            <div className={`h-4 w-full rounded ${isDark ? "bg-neutral-700" : "bg-neutral-200"}`}></div>
                            <div className={`h-4 w-11/12 rounded ${isDark ? "bg-neutral-700" : "bg-neutral-200"}`}></div>
                            <div className={`h-4 w-3/4 rounded ${isDark ? "bg-neutral-700" : "bg-neutral-200"}`}></div>
                        </div>
                    </div>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ node, ...props }) => (
                                <h1 className={`text-3xl font-bold mb-4 mt-6 first:mt-0 ${isDark ? "text-neutral-100" : "text-neutral-900"}`} {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                                <h2 className={`text-2xl font-semibold mb-3 mt-5 first:mt-0 ${isDark ? "text-neutral-200" : "text-neutral-800"}`} {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                                <h3 className={`text-xl font-semibold mb-2 mt-4 first:mt-0 ${isDark ? "text-neutral-300" : "text-neutral-700"}`} {...props} />
                            ),
                            p: ({ node, children, ...props }) => (
                                <p className={`leading-relaxed mb-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`} {...props}>
                                    <TextRenderer>{children}</TextRenderer>
                                </p>
                            ),
                            ul: ({ node, ...props }) => (
                                <ul className="list-none space-y-2 mb-4 ml-0" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol className={`list-decimal list-inside space-y-2 mb-4 ml-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`} {...props} />
                            ),
                            li: ({ node, children, ...props }) => (
                                <li className={`flex items-start gap-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`} {...props}>
                                    <span className="text-indigo-600 mt-1.5 flex-shrink-0">•</span>
                                    <span className="flex-1"><TextRenderer>{children}</TextRenderer></span>
                                </li>
                            ),
                            strong: ({ node, ...props }) => (
                                <strong className={`font-semibold ${isDark ? "text-neutral-100" : "text-neutral-900"}`} {...props} />
                            ),
                            em: ({ node, ...props }) => (
                                <em className="text-indigo-700 italic" {...props} />
                            ),
                            code: ({ node, inline, ...props }: any) =>
                                inline ? (
                                    <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${isDark ? "bg-neutral-700 text-indigo-300" : "bg-neutral-200 text-indigo-700"}`} {...props} />
                                ) : (
                                    <code className={`block p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4 ${isDark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-200 text-neutral-800"}`} {...props} />
                                ),
                            blockquote: ({ node, ...props }) => (
                                <blockquote className={`border-l-4 border-indigo-500 pl-4 italic my-4 ${isDark ? "text-neutral-400" : "text-neutral-600"}`} {...props} />
                            )
                        }}
                    >{summary}
                    </ReactMarkdown>
                )}
            </div>
        </motion.div>
    );
}
