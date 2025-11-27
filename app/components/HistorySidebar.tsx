"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, X, Trash2, Clock } from "lucide-react";

interface HistoryItem {
    id: string;
    url: string;
    videoId: string;
    summary: string;
    timestamp: number;
}

interface HistorySidebarProps {
    onSelect: (item: HistoryItem) => void;
    currentSummary?: string;
    currentUrl?: string;
    currentVideoId?: string;
}

export default function HistorySidebar({ onSelect, currentSummary, currentUrl, currentVideoId }: HistorySidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("yt_summary_history");
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    // Save to history when a new summary is generated
    useEffect(() => {
        if (currentSummary && currentUrl && currentVideoId) {
            setHistory((prev) => {
                // Avoid duplicates (check by videoId)
                if (prev.some((item) => item.videoId === currentVideoId)) {
                    return prev;
                }

                const newItem: HistoryItem = {
                    id: Date.now().toString(),
                    url: currentUrl,
                    videoId: currentVideoId,
                    summary: currentSummary,
                    timestamp: Date.now(),
                };

                const newHistory = [newItem, ...prev].slice(0, 20); // Keep last 20
                localStorage.setItem("yt_summary_history", JSON.stringify(newHistory));
                return newHistory;
            });
        }
    }, [currentSummary, currentUrl, currentVideoId]);

    const deleteItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newHistory = history.filter((item) => item.id !== id);
        setHistory(newHistory);
        localStorage.setItem("yt_summary_history", JSON.stringify(newHistory));
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed left-4 top-4 z-50 p-3 bg-white/80 backdrop-blur-md border border-neutral-200 rounded-full shadow-lg hover:shadow-xl transition-all text-neutral-600 hover:text-indigo-600"
                title="View History"
            >
                <History className="w-6 h-6" />
            </button>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col border-r border-neutral-200"
                        >
                            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                                <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                                    <History className="w-5 h-5" />
                                    <span>History</span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-neutral-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {history.length === 0 ? (
                                    <div className="text-center text-neutral-400 mt-10">
                                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p>No history yet</p>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                onSelect(item);
                                                setIsOpen(false);
                                            }}
                                            className="group relative p-3 rounded-xl border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer bg-white shadow-sm"
                                        >
                                            <div className="flex gap-3">
                                                <img
                                                    src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`}
                                                    alt="Thumbnail"
                                                    className="w-20 h-14 object-cover rounded-lg bg-neutral-200"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-neutral-800 line-clamp-2 leading-snug">
                                                        {item.url}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        {new Date(item.timestamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => deleteItem(e, item.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
