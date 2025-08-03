import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Play, Download, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Voice {
  id: string;
  name: string;
  description: string;
}

export default function TtsInterface() {
  const [text, setText] = useState("Welcome to 7Voice, the future of text-to-speech technology. Experience natural, human-like voices powered by advanced AI.");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [tone, setTone] = useState("neutral");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Fetch available voices
  const { data: voices = [] } = useQuery<Voice[]>({
    queryKey: ["/api/tts/voices"],
  });

  // Set default voice when voices are loaded
  useState(() => {
    if (voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0].id);
    }
  });

  // Generate speech mutation
  const generateSpeechMutation = useMutation({
    mutationFn: async (data: {
      text: string;
      voice: string;
      speed: number;
      pitch: number;
      tone: string;
    }) => {
      const response = await apiRequest("POST", "/api/tts/generate", data);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (audioUrl) => {
      setAudioUrl(audioUrl);
      toast({
        title: "Speech Generated",
        description: "Your audio is ready to play!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Preview voice mutation
  const previewVoiceMutation = useMutation({
    mutationFn: async (voice: string) => {
      const response = await apiRequest("POST", "/api/tts/preview", { voice });
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (audioUrl) => {
      const audio = new Audio(audioUrl);
      audio.play();
    },
    onError: (error: any) => {
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to preview voice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateSpeech = () => {
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter some text to generate speech.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoice) {
      toast({
        title: "Voice Required",
        description: "Please select a voice.",
        variant: "destructive",
      });
      return;
    }

    generateSpeechMutation.mutate({
      text: text.trim(),
      voice: selectedVoice,
      speed: speed[0],
      pitch: pitch[0],
      tone,
    });
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) {
      toast({
        title: "No Audio",
        description: "Please generate speech first.",
        variant: "destructive",
      });
      return;
    }

    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `7voice-speech-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreviewVoice = () => {
    if (!selectedVoice) {
      toast({
        title: "Voice Required",
        description: "Please select a voice to preview.",
        variant: "destructive",
      });
      return;
    }

    previewVoiceMutation.mutate(selectedVoice);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getSpeedDisplay = () => {
    return `${speed[0].toFixed(1)}x`;
  };

  const getPitchDisplay = () => {
    const value = pitch[0];
    if (value === 0) return "Normal";
    return value > 0 ? "High" : "Low";
  };

  return (
    <Card className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-navy-900 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Text Input Area */}
        <div className="lg:col-span-2">
          <label className="block text-lg font-semibold mb-4">Enter Your Text</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-40 md:h-48 resize-none text-base focus:border-turquoise-500 focus:ring-turquoise-200"
            placeholder="Type or paste your text here... (up to 5000 characters)"
            maxLength={5000}
          />
          <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
            <span>{text.length} characters</span>
            <span className="text-gray-400">5000 max</span>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-lg font-semibold mb-3">Voice Selection</label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="focus:border-turquoise-500 focus:ring-turquoise-200">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviewVoice}
              disabled={!selectedVoice || previewVoiceMutation.isPending}
              className="mt-2 text-turquoise-500 hover:text-turquoise-400 p-0 h-auto"
            >
              <Volume2 className="w-4 h-4 mr-1" />
              {previewVoiceMutation.isPending ? "Playing..." : "Preview Voice"}
            </Button>
          </div>

          {/* Audio Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Speed</label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={0.5}
                max={2}
                step={0.1}
                className="slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5x</span>
                <span>{getSpeedDisplay()}</span>
                <span>2.0x</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pitch</label>
              <Slider
                value={pitch}
                onValueChange={setPitch}
                min={-20}
                max={20}
                step={1}
                className="slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>{getPitchDisplay()}</span>
                <span>High</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="focus:border-turquoise-500 focus:ring-turquoise-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={handleGenerateSpeech}
          disabled={generateSpeechMutation.isPending}
          className="bg-turquoise-500 hover:bg-turquoise-400 text-white px-8 py-4 text-lg font-semibold transition-all transform hover:scale-105"
          size="lg"
        >
          <Play className="w-5 h-5 mr-3" />
          {generateSpeechMutation.isPending ? "Generating..." : "Generate Speech"}
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={!audioUrl}
          className="border-2 border-turquoise-500 text-turquoise-500 hover:bg-turquoise-500 hover:text-white px-8 py-4 text-lg font-semibold transition-all"
          size="lg"
        >
          <Download className="w-5 h-5 mr-3" />
          Download MP3
        </Button>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setAudioDuration(audioRef.current.duration);
              }
            }}
            onTimeUpdate={() => {
              if (audioRef.current) {
                const current = audioRef.current.currentTime;
                const duration = audioRef.current.duration;
                setCurrentTime(current);
                setAudioProgress((current / duration) * 100);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setAudioProgress(0);
              setCurrentTime(0);
            }}
          />
          <div className="flex items-center space-x-4">
            <Button
              size="sm"
              onClick={handlePlayPause}
              className="bg-turquoise-500 text-white p-3 rounded-full hover:bg-turquoise-400"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1 bg-gray-300 rounded-full h-2">
              <div 
                className="bg-turquoise-500 h-2 rounded-full transition-all" 
                style={{ width: `${audioProgress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 min-w-20">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
