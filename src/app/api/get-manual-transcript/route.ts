import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoID = searchParams.get('videoID');
  const lang = searchParams.get('lang') || 'en'; // Default to English if not specified

  if (!videoID) {
    return NextResponse.json({ error: 'videoID query parameter is required' }, { status: 400 });
  }

  try {
    const subtitles = await getSubtitles({ videoID, lang });
    return NextResponse.json(subtitles);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Error: Unexpected any. Specify a different type.
  } catch (error: any) {
    console.error('Failed to fetch subtitles using youtube-caption-extractor:', error);
    // Check if the error object has a message property
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subtitles';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}