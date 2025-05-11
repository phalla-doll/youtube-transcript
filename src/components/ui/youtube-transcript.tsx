"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function YoutubeTranscript() {
    return (
        <>
            <div className="w-full sm:max-w-lg">
                <h1 className="text-2xl font-light tracking-tight mb-5 text-center">Youtube Transcript</h1>
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Paste YouTube link to transcripts..." 
                        className="flex-grow w-[320px]"
                    />
                    <Button variant="default">
                        Get Transcript
                    </Button>
                </div>
            </div>
        </>
    );
}