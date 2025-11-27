"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
    videoId: string;
    isSticky?: boolean;
    seekTime?: number | null;
}

export default function VideoPlayer({ videoId, isSticky = false, seekTime }: VideoPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (seekTime !== null && seekTime !== undefined && iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({
                    event: "command",
                    func: "seekTo",
                    args: [seekTime, true],
                }),
                "*"
            );
        }
    }, [seekTime]);

    return (
        <motion.div
            layout
            className={`space-y-4 ${isSticky ? "lg:sticky lg:top-8" : "w-full"}`}
        >
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-neutral-300 bg-black">
                <iframe
                    ref={iframeRef}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            </div>
        </motion.div>
    );
}
