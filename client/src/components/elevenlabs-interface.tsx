import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Settings2, Download, Copy, RotateCcw, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Voice {
  id: string;
  name: string;
  category?: string;
  accent?: string;
  description?: string;
}

export default function ElevenLabsInterface() {
  const [text, setText] = useState("In the ancient land of Eldoria, where skies shimmered and forests, whispered secrets to the wind, lived a dragon named Zephyros. [sarcastically] Not the \"burn it all down\" kind... [giggles] but he was gentle, wise, with eyes like old stars. [whispers] Even the birds fell silent when he passed.");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { toast } = useToast();

  // Fetch available voices
  const { data: voices = [], isLoading: voicesLoading } = useQuery<Voice[]>({
    queryKey: ["/api/tts/voices"],
  });

  // Generate speech mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          speed: 1.0,
          pitch: 0,
          tone: "neutral"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.blob();
    },
    onSuccess: (audioBlob) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      setCurrentAudio(audio);
      audio.play();
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
    } else {
      generateMutation.mutate();
    }
  };

  const characterCount = text.length;
  const maxCharacters = 1000;

  const sampleTexts = [
    "Samara - Narrate a story",
    "2 speakers - Create a dialogue", 
    "Announcer - Voiceover a game",
    "Sergeant - Play a drill sergeant",
    "Spuds - Recount an old story",
    "Jessica - Provide customer support"
  ];

  return (
    <div className="w-full max-w-6xl mx-auto bg-white">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900">
          The most realistic voice AI platform
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          AI voice models and products powering millions of developers, creators, and enterprises. 
          From low‑latency conversational agents to the leading AI voice generator for voiceovers and audiobooks.
        </p>
      </div>

      {/* Main Interface */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
        {/* Sample Voices Section */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Explore samples</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {sampleTexts.map((sample, index) => (
              <button
                key={index}
                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-left group"
                onClick={() => {
                  const [voiceName, description] = sample.split(' - ');
                  setText(`${description} using ${voiceName} voice.`);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{sample.split(' - ')[0]}</span>
                  <Play className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
                <p className="text-xs text-gray-500">{sample.split(' - ')[1]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Text Input and Controls */}
        <div className="p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Text Input Area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your text here..."
                  className="min-h-[200px] resize-none border-2 border-gray-200 focus:border-black focus:ring-0 text-base leading-relaxed p-4"
                  maxLength={maxCharacters}
                  data-testid="text-input"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <span className={`text-sm ${characterCount > maxCharacters * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
                    {characterCount}/{maxCharacters}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePlayPause}
                  disabled={!selectedVoice || !text.trim() || characterCount > maxCharacters || generateMutation.isPending}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-medium h-auto"
                  data-testid="play-button"
                >
                  {generateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : isPlaying ? (
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Pause
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Play
                    </div>
                  )}
                </Button>

                {currentAudio && (
                  <Button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = currentAudio.src;
                      a.download = 'generated-speech.mp3';
                      a.click();
                    }}
                    variant="outline"
                    className="border-2 border-gray-200 hover:border-gray-300 px-6 py-3 rounded-xl h-auto"
                    data-testid="download-button"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="border-2 border-gray-200 hover:border-gray-300 p-3 rounded-xl h-auto"
                  onClick={() => navigator.clipboard.writeText(text)}
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="border-2 border-gray-200 hover:border-gray-300 p-3 rounded-xl h-auto"
                  onClick={() => setText("")}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Audio Visualization */}
              {(generateMutation.isPending || currentAudio) && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-4">
                    <Volume2 className="h-5 w-5 text-gray-600" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-1 h-8">
                        {[...Array(40)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 bg-gray-400 rounded-full transition-all duration-300 ${
                              generateMutation.isPending || isPlaying
                                ? `animate-pulse`
                                : ''
                            }`}
                            style={{
                              height: `${Math.floor(Math.random() * 24) + 8}px`,
                              animationDelay: `${i * 50}ms`,
                              animationDuration: '1.5s'
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        {generateMutation.isPending ? 'Generating audio...' : 
                         isPlaying ? 'Playing audio' : 'Audio ready'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Voice Selection and Settings */}
            <div className="space-y-6">
              {/* Voice Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Voice</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger 
                    className="w-full border-2 border-gray-200 focus:border-black focus:ring-0 h-12 rounded-xl"
                    data-testid="voice-select"
                  >
                    <SelectValue placeholder="Select a voice..." />
                  </SelectTrigger>
                  <SelectContent>
                    {voicesLoading ? (
                      <SelectItem value="loading" disabled>Loading voices...</SelectItem>
                    ) : (
                      voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">{voice.name}</span>
                              <span className="text-xs text-gray-500">{voice.description}</span>
                            </div>
                            <span className="text-xs text-black bg-gray-100 px-2 py-1 rounded">
                              {voice.category || 'Premium'}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Language</label>
                <Select defaultValue="english">
                  <SelectTrigger className="w-full border-2 border-gray-200 focus:border-black focus:ring-0 h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="italian">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Settings Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Settings</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Advanced Settings */}
              {showSettings && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Stability</label>
                      <span className="text-sm text-gray-600">50%</span>
                    </div>
                    <Slider
                      defaultValue={[0.5]}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Similarity Boost</label>
                      <span className="text-sm text-gray-600">75%</span>
                    </div>
                    <Slider
                      defaultValue={[0.75]}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Create New Button */}
              <Button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl h-12 font-medium"
                onClick={() => {
                  setText("");
                  setSelectedVoice("");
                  setCurrentAudio(null);
                  setIsPlaying(false);
                }}
              >
                Create new
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Powered by Section */}
      <div className="text-center mt-8">
        <p className="text-gray-600 mb-2">Powered by Eleven v3 (alpha)</p>
        <p className="text-lg font-semibold text-gray-900">Experience the full Audio AI platform</p>
      </div>
    </div>
  );
}