import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract Video ID
    let videoId = "";
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes("youtube.com")) {
            videoId = urlObj.searchParams.get("v") || "";
        } else if (urlObj.hostname.includes("youtu.be")) {
            videoId = urlObj.pathname.slice(1);
        }
    } catch (e) {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!videoId) {
        return NextResponse.json({ error: "Could not extract video ID" }, { status: 400 });
    }

    // Fetch Transcript
    let transcriptText = "";
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcript.map((item) => item.text).join(" ");
    } catch (error) {
      console.error("Transcript Error:", error);
      return NextResponse.json(
        { error: "Could not fetch transcript. The video might not have captions enabled." },
        { status: 404 }
      );
    }

    // Truncate if too long (basic safety, though Gemini 1.5 has large context)
    const maxLength = 30000; 
    if (transcriptText.length > maxLength) {
        transcriptText = transcriptText.substring(0, maxLength) + "...[truncated]";
    }

    // Generate Summary
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ 
            error: "Server configuration error: API Key missing",
            mock: true,
            summary: "This is a mock summary because the API key is missing. The video discusses [Topic] and covers key points such as [Point 1], [Point 2], and [Point 3]." 
        }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Summarize the following YouTube video transcript into a concise and engaging summary. Use bullet points for key takeaways. \n\nTranscript: ${transcriptText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({ summary });

  } catch (error) {
    console.error("General Error:", error);
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 });
  }
}
