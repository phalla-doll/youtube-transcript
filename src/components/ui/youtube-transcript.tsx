"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function YoutubeTranscriptComponent() {
    const [showCard, setShowCard] = useState(false);
    const [youtubeLink, setYoutubeLink] = useState("");
    const [transcript, setTranscript] = useState<[{ text: string, duration: number, offset: number }] | []>([]);
    const [videoTitle, setVideoTitle] = useState<string>(""); // Add state for video title
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleGetTranscript = async () => {
        if (!youtubeLink) {
            setError("Please paste a YouTube link.");
            setShowCard(true);
            setTranscript([]);
            setVideoTitle(""); // Reset video title
            return;
        }
        setIsLoading(true);
        setError(null);
        setTranscript([]);
        setVideoTitle(""); // Reset video title on new fetch
        setShowCard(true);

        try {
            // Make a request to your new API route
            const response = await fetch(`/api/get-transcript?url=${encodeURIComponent(youtubeLink)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            console.log("Transcript data:", data);
            setTranscript(data.transcript);
            // Assuming your API response includes videoTitle, e.g., data.videoTitle
            if (data.title && typeof data.title === 'string') {
                setVideoTitle(data.title);
            } else {
                setVideoTitle(""); // Set to empty if not available or not a string
            }
        } catch (err) {
            console.error("Error fetching transcript from API:", err);
            setError((err as Error).message || "Failed to fetch transcript. Please check the link or try again.");
            setTranscript([]);
            setVideoTitle(""); // Reset video title on error
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
                            <Button variant="default" onClick={handleGetTranscript} disabled={isLoading}>
                                {isLoading ? "Fetching..." : "Get Transcript"}
                            </Button>
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
                                            {isLoading && <p>Loading...</p>}
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