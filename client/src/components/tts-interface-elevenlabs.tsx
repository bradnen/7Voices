import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Download, Volume2, Settings, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Voice {
  id: string;
  name: string;
  category?: string;
  accent?: string;
  description?: string;
}

export default function TTSInterfaceElevenLabs() {
  const [text, setText] = useState("Transform your text into lifelike speech with our advanced AI voices. Experience the future of text-to-speech technology.");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speed, setSpeed] = useState([1.0]);
  const [stability, setStability] = useState([0.5]);
  const [similarityBoost, setSimilarityBoost] = useState([0.75]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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
          speed: speed[0],
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

  const handleDownload = () => {
    if (currentAudio) {
      const a = document.createElement('a');
      a.href = currentAudio.src;
      a.download = 'generated-speech.mp3';
      a.click();
    } else {
      generateMutation.mutate();
    }
  };

  const characterCount = text.length;
  const isOverLimit = characterCount > 5000;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Speech Synthesis</h2>
              <p className="text-white/80 text-sm">Transform text into natural speech</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {characterCount}/5000
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Text to synthesize</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text here..."
            className={`min-h-[120px] resize-none border-2 transition-colors ${
              isOverLimit ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
            } focus:ring-0`}
            data-testid="text-input"
          />
          <div className="flex justify-between items-center text-sm">
            <span className={`${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
              {characterCount} characters
            </span>
            {isOverLimit && (
              <span className="text-red-500">Text exceeds 5,000 character limit</span>
            )}
          </div>
        </div>

        {/* Voice Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Voice</label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger 
              className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-0 h-12"
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
                      <span className="text-xs text-purple-600 ml-2 bg-purple-50 px-2 py-1 rounded">
                        {voice.category || 'Premium'}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Settings Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Voice Settings</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            {showAdvanced ? 'Hide' : 'Show'} Settings
          </Button>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <Card className="p-4 border-gray-200 bg-gray-50/50">
            <div className="space-y-6">
              {/* Speed Control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Speed</label>
                  <span className="text-sm text-gray-600">{speed[0].toFixed(1)}x</span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                  data-testid="speed-slider"
                />
              </div>

              <Separator className="bg-gray-200" />

              {/* Stability Control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Stability</label>
                  <span className="text-sm text-gray-600">{(stability[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={stability}
                  onValueChange={setStability}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Higher values make the voice more stable and consistent
                </p>
              </div>

              <Separator className="bg-gray-200" />

              {/* Similarity Boost */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Clarity + Similarity</label>
                  <span className="text-sm text-gray-600">{(similarityBoost[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={similarityBoost}
                  onValueChange={setSimilarityBoost}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Higher values enhance voice clarity and similarity to the original
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handlePlayPause}
            disabled={!selectedVoice || !text.trim() || isOverLimit || generateMutation.isPending}
            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white h-12 text-base font-medium"
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
                Generate Speech
              </div>
            )}
          </Button>

          {currentAudio && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="h-12 px-6 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700"
              data-testid="download-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>

        {/* Audio Visualization Placeholder */}
        {(generateMutation.isPending || currentAudio) && (
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-purple-600" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-purple-400 rounded-full transition-all duration-300 ${
                        generateMutation.isPending || isPlaying
                          ? `h-${Math.floor(Math.random() * 8) + 2} animate-pulse`
                          : 'h-2'
                      }`}
                      style={{
                        animationDelay: `${i * 100}ms`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-purple-700">
                  {generateMutation.isPending ? 'Generating audio...' : 
                   isPlaying ? 'Playing audio' : 'Audio ready'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}