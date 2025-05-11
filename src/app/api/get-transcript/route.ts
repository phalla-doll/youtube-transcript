import { YoutubeTranscript } from 'youtube-transcript';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const youtubeLink = searchParams.get('url');

    if (!youtubeLink) {
        return NextResponse.json({ error: 'YouTube link is required' }, { status: 400 });
    }

    try {
        // Fetch video title using oEmbed
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeLink)}&format=json`;
        let videoTitle = "Title not found";
        try {
            const oembedResponse = await fetch(oembedUrl);
            if (oembedResponse.ok) {
                const oembedData = await oembedResponse.json();
                videoTitle = oembedData.title;
            } else {
                console.warn("Failed to fetch video title from oEmbed API, status:", oembedResponse.status);
            }
        } catch (oembedError) {
            console.warn("Error fetching video title from oEmbed API:", oembedError);
        }

        const transcript = await YoutubeTranscript.fetchTranscript(youtubeLink);
        return NextResponse.json({ title: videoTitle, transcript });
    } catch (err) {
        console.error("Error fetching transcript in API route:", err);
        let errorMessage = "Failed to fetch transcript.";
        if (err instanceof Error) {
            // Check for common error messages from the library if needed
            if (err.message.includes("subtitles not found")) {
                errorMessage = "No transcript found for this video, or transcripts are disabled.";
            } else if (err.message.includes("Invalid video ID")) {
                errorMessage = "Invalid YouTube link provided.";
            }
        }
        return NextResponse.json({ error: errorMessage, details: (err as Error).message }, { status: 500 });
    }
}