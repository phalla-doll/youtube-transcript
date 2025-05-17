import {
    YoutubeTranscript,
    YoutubeTranscriptError,
    YoutubeTranscriptTooManyRequestError,
    YoutubeTranscriptVideoUnavailableError,
    YoutubeTranscriptDisabledError,
    YoutubeTranscriptNotAvailableError,
    YoutubeTranscriptNotAvailableLanguageError
} from 'youtube-transcript';
import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Simple in-memory cache (Consider Redis or a similar solution for production)
interface CacheEntry {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transcript: any[]; // Adjust 'any' to the actual transcript item type if known
    timestamp: number;
}
const transcriptCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 15 * 60 * 1000; // Cache for 15 minutes

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const youtubeLink = searchParams.get('url');

    if (!youtubeLink) {
        return NextResponse.json({ error: 'YouTube link is required' }, { status: 400 });
    }

    // --- Proxy Configuration ---
    const proxyUrl = process.env.PROXY_URL; // e.g., 'http://username:password@your-proxy-server.com:port'
    let agent;
    if (proxyUrl) {
        try {
            agent = new HttpsProxyAgent(proxyUrl);
            console.log(`Using proxy: ${proxyUrl.split('@').pop()}`); // Log proxy host, hide credentials
        } catch (e) {
            console.error("Failed to create HttpsProxyAgent:", e);
            // Decide if you want to proceed without a proxy or return an error
        }
    }
    // --- End Proxy Configuration ---


    // Check cache first
    const cachedEntry = transcriptCache.get(youtubeLink);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
        console.log(`[CACHE HIT] Serving transcript for ${youtubeLink}`);
        return NextResponse.json({ title: cachedEntry.title, transcript: cachedEntry.transcript });
    }
    console.log(`[CACHE MISS] Fetching transcript for ${youtubeLink}`);

    let videoTitle = "Title not found";
    try {
        // Fetch video title using oEmbed
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeLink)}&format=json`;
        const fetchOptions: RequestInit = {
            headers: { // Add common browser headers
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        };
        if (agent) {
            // @ts-expect-error // HttpsProxyAgent is compatible with fetch's agent option
            fetchOptions.agent = agent;
        }
        const oembedResponse = await fetch(oembedUrl, fetchOptions);
        if (oembedResponse.ok) {
            const oembedData = await oembedResponse.json();
            videoTitle = oembedData.title;
        } else {
            console.warn(`Failed to fetch video title from oEmbed API for ${youtubeLink}. Status: ${oembedResponse.status}, Body: ${await oembedResponse.text()}`);
        }
    } catch (oembedError) {
        console.warn(`Error fetching video title from oEmbed API for ${youtubeLink}:`, oembedError);
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transcriptConfig: any = {};
        if (agent) {
            transcriptConfig.axiosRequestConfig = {
                httpsAgent: agent,
                // proxy: false, // Already commented, good.
                headers: { // Add common browser headers
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            };
        } else {
            transcriptConfig.axiosRequestConfig = {
                headers: { // Add common browser headers even if not using proxy
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            };
        }
        const transcript = await YoutubeTranscript.fetchTranscript(youtubeLink, transcriptConfig);
        // Cache the successful response
        transcriptCache.set(youtubeLink, { title: videoTitle, transcript, timestamp: Date.now() });
        console.log(`[CACHE SET] Cached transcript for ${youtubeLink}`);
        return NextResponse.json({ title: videoTitle, transcript });
    } catch (err) {
        // Log the full error for server-side debugging, especially in production
        console.error(`Error fetching transcript for YouTube link "${youtubeLink}":`, err);

        let errorMessage = "Failed to fetch transcript. The server encountered an issue.";
        let statusCode = 500;
        const errorDetails = err instanceof Error ? err.message : "An unknown error occurred.";

        if (err instanceof YoutubeTranscriptTooManyRequestError) {
            errorMessage = "Could not process the request due to too many requests to YouTube. Please try again later.";
            statusCode = 429; // Too Many Requests
        } else if (err instanceof YoutubeTranscriptVideoUnavailableError) {
            errorMessage = "The video is unavailable or does not exist.";
            statusCode = 404; // Not Found
        } else if (err instanceof YoutubeTranscriptDisabledError) {
            errorMessage = "Transcripts are disabled for this video.";
            statusCode = 400; 
        } else if (err instanceof YoutubeTranscriptNotAvailableError) {
            errorMessage = "No transcripts are available for this video.";
            statusCode = 404; // Not Found
        } else if (err instanceof YoutubeTranscriptNotAvailableLanguageError) {
            errorMessage = `Transcripts are not available in the requested language. Available: ${err.message}`;
            statusCode = 404;
        } else if (err instanceof YoutubeTranscriptError) {
            errorMessage = `A problem occurred while fetching the transcript: ${errorDetails}`;
            if (errorDetails.includes("Impossible to retrieve Youtube video ID")) {
                statusCode = 400; // Bad Request
                errorMessage = "Invalid YouTube link provided.";
            }
        }
        
        return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: statusCode });
    }
}