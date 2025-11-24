# Setup Instructions for Groq API

## Get Your Free API Key

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign in or create a free account
3. Click "Create API Key"
4. Give it a name (e.g., "YouTube Summarizer")
5. Copy the generated API key

## Configure Your Application

1. Open or create `.env` file in your project root: `c:\Users\sakib\.gemini\antigravity\scratch\youtube_summarizer\.env`
2. Add the following line with your actual API key:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```
3. Save the file
4. Restart your dev server (Ctrl+C, then `npm run dev`)

## Model Details

- **Model**: `llama-3.1-70b-versatile`
- **Provider**: Groq (ultra-fast inference)
- **Free Tier**: Very generous rate limits
- **Speed**: Extremely fast (one of the fastest inference platforms)

## Important Notes

- **Fallback**: If the API key is not configured or the AI fails, the app automatically falls back to extractive summarization
- **Security**: Never commit your `.env` file to version control (it's already in `.gitignore`)
- **Performance**: Groq is known for extremely fast inference speeds

## Testing

Once configured:
1. Make sure dev server is running (`npm run dev`)
2. Open the app in your browser
3. Paste any YouTube URL
4. Click "Summarize"
5. You should get a detailed, AI-generated summary in seconds!

The response will include a `method` field showing whether "ai" or "extractive" summarization was used.
