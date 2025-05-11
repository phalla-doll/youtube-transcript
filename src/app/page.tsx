import YoutubeTranscript from "@/components/ui/youtube-transcript";
import { Milestone } from "lucide-react";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        <YoutubeTranscript />

      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-muted-foreground"
          href="https://mantha.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Milestone className="w-5 h-5" />
          Made with love by this guy.
        </a>
      </footer>
    </div>
  );
}
