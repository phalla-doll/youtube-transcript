"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function YoutubeTranscriptComponent() {
    const [showCard, setShowCard] = useState(false);
    const [youtubeLink, setYoutubeLink] = useState("");
    // Update transcript state to match the youtube-caption-extractor output structure more closely
    // or adapt the fetched data. For now, let's adapt the fetched data.
    // The API returns: { text: string, start: string, dur: string }
    // We need: { text: string, duration: number, offset: number }
    const [transcript, setTranscript] = useState<Array<{ text: string; duration: number; offset: number }>>([]);
    const [videoTitle, setVideoTitle] = useState<string>(""); // Add state for video title
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // const handleGetTranscript = async () => {
    //     if (!youtubeLink) {
    //         setError("Please paste a YouTube link.");
    //         setShowCard(true);
    //         setTranscript([]);
    //         setVideoTitle(""); // Reset video title
    //         return;
    //     }
    //     setIsLoading(true);
    //     setError(null);
    //     setTranscript([]);
    //     setVideoTitle(""); // Reset video title on new fetch
    //     setShowCard(true);

    //     try {
    //         // Make a request to your new API route
    //         const response = await fetch(`/api/get-transcript?url=${encodeURIComponent(youtubeLink)}`);
    //         const data = await response.json();

    //         if (!response.ok) {
    //             throw new Error(data.error || `HTTP error! status: ${response.status}`);
    //         }
    //         console.log("Transcript data:", data);
    //         setTranscript(data.transcript);
    //         // Assuming your API response includes videoTitle, e.g., data.videoTitle
    //         if (data.title && typeof data.title === 'string') {
    //             setVideoTitle(data.title);
    //         } else {
    //             setVideoTitle(""); // Set to empty if not available or not a string
    //         }
    //     } catch (err) {
    //         console.error("Error fetching transcript from API:", err);
    //         setError((err as Error).message || "Failed to fetch transcript. Please check the link or try again.");
    //         setTranscript([]);
    //         setVideoTitle(""); // Reset video title on error
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // Helper function to extract video ID from YouTube URL
    const extractVideoID = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleGetManualTranscript = async () => {
        if (!youtubeLink) {
            setError("Please paste a YouTube link.");
            setShowCard(true);
            setTranscript([]);
            setVideoTitle("");
            return;
        }

        const videoID = extractVideoID(youtubeLink);
        if (!videoID) {
            setError("Invalid YouTube link. Could not extract video ID.");
            setShowCard(true);
            setTranscript([]);
            setVideoTitle("");
            return;
        }

        setIsLoading(true);
        setError(null);
        setTranscript([]);
        // Video title is not fetched by getSubtitles, so we might need another way or remove it for this function
        setVideoTitle(""); 
        setShowCard(true);

        try {
            // Using videoID for the API call
            const response = await fetch(`/api/get-manual-transcript?videoID=${videoID}`); // lang can be added if needed
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            console.log("Manual Transcript API Response (youtube-caption-extractor):", data);

            // The data is expected to be an array of { text: string, start: string, dur: string }
            if (Array.isArray(data)) {
                const formattedTranscript = data.map(item => ({
                    text: item.text,
                    offset: parseFloat(item.start), // 'start' is string in seconds
                    duration: parseFloat(item.dur)  // 'dur' is string in seconds
                }));
                setTranscript(formattedTranscript);
            } else {
                // Handle cases where data might not be an array (e.g., an error object not caught by !response.ok)
                console.error("Received non-array data from manual transcript API:", data);
                setError("Received unexpected data format for transcript.");
                setTranscript([]);
            }
            // Note: getSubtitles does not return video title. 
            // If title is needed, consider using getVideoDetails from youtube-caption-extractor
            // or fetching it separately. For now, title remains empty or could be derived from user input if needed.

        } catch (err) {
            console.error("Error fetching manual transcript from API:", err);
            setError((err as Error).message || "Failed to fetch manual transcript. Please check the link or try again.");
            setTranscript([]);
            setVideoTitle("");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string) => {
        // First, handle the common encoded entities
        const decodedText = text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;#39;/g, "'");

        // Only use the textarea method in browser environment
        if (typeof document !== 'undefined') {
            const textArea = document.createElement('textarea');
            textArea.innerHTML = decodedText;
            return textArea.value;
        }

        return decodedText;
    };

    // Filter transcript based on search query
    const filteredTranscript = transcript.filter(item =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadTranscript = () => {
        if (filteredTranscript.length === 0) {
            alert("No transcript content to download."); // Or handle this more gracefully
            return;
        }

        const fileContent = filteredTranscript.map(item => {
            const timestamp = new Date(item.offset * 1000).toISOString().slice(11, 19);
            const text = decodeHtmlEntities(item.text);
            return `[${timestamp}] ${text}`;
        }).join("\n");

        const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        let fileName = "transcript.txt"; // Default filename
        if (videoTitle) {
            // Sanitize the video title to remove characters that are not allowed in filenames
            const sanitizedTitle = videoTitle.replace(/[<>:"/\\|?*]+/g, '_').trim();
            fileName = `Transcript - ${sanitizedTitle || 'video'}.txt`;
        } else {
            fileName = "Transcript.txt"; // Fallback if no title but download is initiated
        }
        link.setAttribute("download", fileName); // Updated filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="container sm:mx-auto">
                <div className="flex flex-col items-center w-full justify-center min-h-[90vh] py-20 px-4">
                    <div className="w-full sm:w-[650px]">
                        <h1 className="text-2xl font-normal tracking-tight mb-5 text-center">Youtube Transcript</h1>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Paste YouTube link to transcripts..."
                                className="flex-grow w-[320px]"
                                value={youtubeLink}
                                onChange={(e) => setYoutubeLink(e.target.value)}
                            />
                            <Button variant="default" onClick={() => { handleGetManualTranscript(); }} disabled={isLoading}>
                                {isLoading ? "Fetching..." : "Get Transcript"}
                            </Button>
                            {/* Example button to trigger the new function, you can integrate it as needed */}
                            {/* <Button variant="secondary" onClick={handleGetManualTranscript} disabled={isLoading} className="ml-2">
                                {isLoading ? "Fetching Manually..." : "Get Manual Transcript"}
                            </Button> */}
                        </div>
                        <AnimatePresence>
                            {showCard && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.5 }}
                                    className="mt-8"
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Transcript</CardTitle>
                                            {!isLoading && !error && transcript && (
                                                <CardDescription className="flex justify-between gap-3 mt-4">
                                                    <div>
                                                        <Input type="text" className="w-full sm:w-[320px]" placeholder="Search transcript..." value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <Button variant="outline" onClick={handleDownloadTranscript}>
                                                            Download Transcript
                                                        </Button>
                                                    </div>

                                                </CardDescription>
                                            )}
                                            {isLoading && (
                                                <CardDescription>
                                                    Fetching transcript...
                                                </CardDescription>
                                            )}
                                            {error && (
                                                <CardDescription className="text-red-500">
                                                    {error}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            {isLoading && <p className="flex items-center gap-x-1"><Loader2 className="animate-spin" />Loading...</p>}
                                            {!isLoading && error && <p className="text-red-500">{error}</p>}
                                            {!isLoading && !error && transcript && (
                                                <div className="max-h-96 overflow-y-auto">
                                                    {filteredTranscript.length > 0 ? (
                                                        filteredTranscript.map((item, index) => (
                                                            <div key={index} className="mb-2">
                                                                <p>
                                                                    <span className="text-muted-foreground">
                                                                        {new Date(item.offset * 1000).toISOString().slice(11, 19)}
                                                                    </span> {decodeHtmlEntities(item.text)}
                                                                </p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-muted-foreground">No matching text found.</p>
                                                    )}
                                                </div>
                                            )}
                                            {!isLoading && !error && !transcript && !youtubeLink && (
                                                <p className="text-muted-foreground">Enter a YouTube link above and click &quot;Get Transcript&quot;.</p>
                                            )}
                                            {!isLoading && !error && !transcript && youtubeLink && !error && (
                                                <p className="text-muted-foreground">No transcript found or an issue occurred.</p>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex justify-end">
                                            <Button variant="outline" onClick={() => {
                                                setShowCard(false);
                                                setTranscript([]);
                                                setError(null);
                                                setVideoTitle(""); // Reset video title on close
                                            }}>
                                                Close
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

        </>
    );
}