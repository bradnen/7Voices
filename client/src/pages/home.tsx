import Navigation from "@/components/navigation";
import ElevenLabsInterface from "@/components/elevenlabs-interface";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <ElevenLabsInterface />
      </main>
    </div>
  );
}