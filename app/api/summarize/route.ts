import { YoutubeTranscript } from "youtube-transcript-plus";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";


// Initialize Groq AI
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Advanced extractive summarization with stopword filtering (FALLBACK)
function extractiveSummary(text: string, sentenceCount: number = 5): string {
  // Common stopwords and filler phrases to ignore
  const stopwords = new Set([
    'yeah', 'yes', 'no', 'okay', 'ok', 'um', 'uh', 'like', 'just', 'really',
    'very', 'actually', 'basically', 'literally', 'right', 'well', 'so',
    'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'thing', 'stuff', 'things',
    'that', 'this', 'these', 'those', 'what', 'when', 'where', 'which', 'who',
    'the', 'and', 'but', 'for', 'with', 'from', 'have', 'has', 'had', 'will',
    'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall'
  ]);

  // Split into sentences
  const sentences = text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => {
      // Filter out very short sentences and filler-only sentences
      if (s.length < 30) return false;

      const words = s.toLowerCase().split(/\s+/);
      const meaningfulWords = words.filter(w => {
        const cleaned = w.replace(/[^a-z0-9]/g, '');
        return cleaned.length > 3 && !stopwords.has(cleaned);
      });

      // Require at least 40% meaningful words
      return meaningfulWords.length / words.length > 0.4;
    });

  if (sentences.length === 0) {
    return "Unable to generate a meaningful summary. The transcript may contain mostly casual conversation or filler words.";
  }

  // Calculate word frequencies (excluding stopwords)
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: { [key: string]: number } = {};

  words.forEach(word => {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length > 3 && !stopwords.has(cleaned)) {
      wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
    }
  });

  // Get top keywords (most frequent meaningful words)
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  // Score each sentence
  const sentenceScores = sentences.map((sentence, index) => {
    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    let score = 0;
    let keywordCount = 0;

    sentenceWords.forEach(word => {
      const cleaned = word.replace(/[^a-z0-9]/g, '');
      if (topKeywords.includes(cleaned)) {
        score += wordFreq[cleaned] || 0;
        keywordCount++;
      }
    });

    // Normalize by sentence length and boost keyword density
    const normalizedScore = (score / sentenceWords.length) * (1 + keywordCount * 0.1);

    // Slight boost for sentences near the beginning (often contain intro/context)
    const positionBoost = index < sentences.length * 0.2 ? 1.2 : 1.0;

    return {
      sentence,
      score: normalizedScore * positionBoost,
      index
    };
  });

  // Get top sentences
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(sentenceCount, sentences.length))
    .sort((a, b) => a.index - b.index) // Re-order by original position
    .map(s => s.sentence);

  if (topSentences.length === 0) {
    return "Unable to extract meaningful content from this video.";
  }

  // Format with better structure
  const summary = topSentences.map((s, i) => `${i + 1}. ${s}.`).join('\n\n');

  return `## Summary\n\n${summary}`;
}

// Generate AI-powered summary using Groq
async function generateAISummary(transcriptText: string): Promise<string> {
  if (!groq) {
    throw new Error("Groq API key not configured");
  }

  const prompt = `You are an expert at creating detailed, structured video summaries. 

Given the following YouTube video transcript, create a comprehensive summary that:
1. Starts with a brief overview of what the video is about
2. Lists the main topics and key points in a clear, structured format
3. Includes important details, examples, and explanations
4. Is written as if explaining the content to someone who hasn't watched the video
5. Uses proper markdown formatting with headings, bullet points, and numbered lists where appropriate

Make the summary detailed enough to be valuable, but concise enough to be easily readable. Focus on the actual content and insights, not on filler words or casual conversation.

Transcript:
${transcriptText}

Please provide the summary now:`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // Latest fast and high-quality model
      temperature: 0.5,
      max_tokens: 2048,
    });

    const summary = chatCompletion.choices[0]?.message?.content || "";

    if (!summary || summary.trim().length === 0) {
      throw new Error("Empty response from AI");
    }

    return summary;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

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

    // Fetch Transcript using youtube-transcript-plus
    let transcriptText = "";
    try {
      console.log("Fetching transcript for video ID:", videoId);
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      console.log("Transcript data received:", transcriptData.length, "segments");

      if (Array.isArray(transcriptData) && transcriptData.length > 0) {
        // Combine all transcript segments into one text
        transcriptText = transcriptData.map((item: any) => item.text).join(" ");
      }

      console.log("Transcript text length:", transcriptText.length);
    } catch (error: any) {
      console.error("Transcript Error:", error);
      return NextResponse.json(
        {
          error: "Could not fetch transcript. The video might not have captions enabled or may be restricted.",
          details: error.message
        },
        { status: 404 }
      );
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      console.error("Transcript is empty after fetching");
      return NextResponse.json(
        { error: "Transcript is empty. This video may not have captions available." },
        { status: 404 }
      );
    }

    // Generate summary using AI or fallback to extractive method
    let summary = "";
    let usedAI = false;

    try {
      if (groq) {
        console.log("Generating AI-powered summary with Groq...");
        summary = await generateAISummary(transcriptText);
        usedAI = true;
        console.log("AI summary generated successfully");
      } else {
        throw new Error("Groq API not configured");
      }
    } catch (aiError: any) {
      console.warn("AI summarization failed, falling back to extractive method:", aiError.message);
      summary = extractiveSummary(transcriptText, 7);
      usedAI = false;
    }

    return NextResponse.json({
      summary,
      method: usedAI ? "ai" : "extractive"
    });

  } catch (error: any) {
    console.error("General Error:", error);
    return NextResponse.json({
      error: "Failed to process video",
      details: error.message
    }, { status: 500 });
  }
}
