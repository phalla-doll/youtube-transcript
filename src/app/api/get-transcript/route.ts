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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const youtubeLink = searchParams.get('url');

    if (!youtubeLink) {
        return NextResponse.json({ error: 'YouTube link is required' }, { status: 400 });
    }

    let videoTitle = "Title not found";
    try {
        // Fetch video title using oEmbed
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeLink)}&format=json`;
        const oembedResponse = await fetch(oembedUrl);
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
        const transcript = await YoutubeTranscript.fetchTranscript(youtubeLink);
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
            statusCode = 400; // Bad Request (as it's a characteristic of the video)
        } else if (err instanceof YoutubeTranscriptNotAvailableError) {
            errorMessage = "No transcripts are available for this video.";
            statusCode = 404; // Not Found
        } else if (err instanceof YoutubeTranscriptNotAvailableLanguageError) {
            // This error is for when a specific language is requested and not found.
            // If you're not specifying a language, it might be less common.
            errorMessage = `Transcripts are not available in the requested language. Available: ${err.message}`;
            statusCode = 404;
        } else if (err instanceof YoutubeTranscriptError) {
            // Catch other specific library errors
            errorMessage = `A problem occurred while fetching the transcript: ${errorDetails}`;
            // statusCode remains 500 or could be 400 if it implies a bad video ID
            if (errorDetails.includes("Impossible to retrieve Youtube video ID")) {
                statusCode = 400; // Bad Request
                errorMessage = "Invalid YouTube link provided.";
            }
        }
        // For any other errors, it defaults to a generic 500 error.

        return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: statusCode });
    }
}