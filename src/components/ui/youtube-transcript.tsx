"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function YoutubeTranscript() {
    const [showCard, setShowCard] = useState(false);

    const handleGetTranscript = () => {
        setShowCard(true);
        // In a real application, you would fetch the transcript here
    };

    return (
        <>
            <div className="container sm:mx-auto">
                <div className="flex flex-col items-center w-full justify-center min-h-[90vh] py-20 px-4">
                    <div className="w-full sm:w-[650px]">
                        <h1 className="text-2xl font-light tracking-tight mb-5 text-center">Youtube Transcript</h1>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Paste YouTube link to transcripts..."
                                className="flex-grow w-[320px]"
                            />
                            <Button variant="default" onClick={handleGetTranscript}>
                                Get Transcript
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
                                    {/* Placeholder for transcript content */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Transcript</CardTitle>
                                            <CardDescription>
                                                This is a placeholder for the transcript content.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p>This is where the transcript will be displayed.</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-end">
                                            <Button variant="outline" onClick={() => setShowCard(false)}>
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