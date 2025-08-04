import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTtsRequestSchema } from "@shared/schema";
import { setupAuth, requireAuth } from "./auth";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "sk-test-key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Generate speech from text
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const validatedData = insertTtsRequestSchema.parse(req.body);
      
      // Store the request
      const ttsRequest = await storage.createTtsRequest(validatedData);
      
      // Map voice names to OpenAI voice IDs
      const voiceMap: Record<string, string> = {
        "Sarah - Professional Female": "nova",
        "Marcus - Warm Male": "onyx", 
        "Emma - Energetic Female": "shimmer",
        "David - Deep Male": "fable",
        "Luna - Soft Female": "alloy",
        "Alex - Neutral": "echo"
      };
      
      const openaiVoice = voiceMap[validatedData.voice] || "alloy";
      
      // Generate speech using OpenAI TTS
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: openaiVoice as any,
        input: validatedData.text,
        speed: validatedData.speed || 1.0,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
        'Content-Disposition': `attachment; filename="speech-${ttsRequest.id}.mp3"`
      });
      
      res.send(buffer);
    } catch (error: any) {
      console.error('TTS generation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      // Handle OpenAI API quota errors specifically
      if (error.status === 429 && error.code === 'insufficient_quota') {
        return res.status(429).json({ 
          message: "OpenAI API quota exceeded. Please check your OpenAI account billing and add credits, or try again later." 
        });
      }
      
      // Handle other OpenAI API errors
      if (error.status >= 400 && error.status < 500) {
        return res.status(error.status).json({ 
          message: `OpenAI API Error: ${error.message}` 
        });
      }
      
      res.status(500).json({ 
        message: error.message || "Failed to generate speech" 
      });
    }
  });

  // Get available voices
  app.get("/api/tts/voices", async (req, res) => {
    try {
      const voices = [
        { id: "Sarah - Professional Female", name: "Sarah", description: "Professional Female" },
        { id: "Marcus - Warm Male", name: "Marcus", description: "Warm Male" },
        { id: "Emma - Energetic Female", name: "Emma", description: "Energetic Female" },
        { id: "David - Deep Male", name: "David", description: "Deep Male" },
        { id: "Luna - Soft Female", name: "Luna", description: "Soft Female" },
        { id: "Alex - Neutral", name: "Alex", description: "Neutral" }
      ];
      
      res.json(voices);
    } catch (error: any) {
      console.error('Get voices error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to get voices" 
      });
    }
  });

  // Preview voice with sample text
  app.post("/api/tts/preview", async (req, res) => {
    try {
      const { voice } = req.body;
      
      if (!voice) {
        return res.status(400).json({ message: "Voice is required" });
      }
      
      const voiceMap: Record<string, string> = {
        "Sarah - Professional Female": "nova",
        "Marcus - Warm Male": "onyx", 
        "Emma - Energetic Female": "shimmer",
        "David - Deep Male": "fable",
        "Luna - Soft Female": "alloy",
        "Alex - Neutral": "echo"
      };
      
      const openaiVoice = voiceMap[voice] || "alloy";
      const sampleText = "Hello! This is a preview of my voice. I hope you like how I sound.";
      
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: openaiVoice as any,
        input: sampleText,
        speed: 1.0,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
      });
      
      res.send(buffer);
    } catch (error: any) {
      console.error('Voice preview error:', error);
      
      // Handle OpenAI API quota errors specifically
      if (error.status === 429 && error.code === 'insufficient_quota') {
        return res.status(429).json({ 
          message: "OpenAI API quota exceeded. Please check your OpenAI account billing and add credits, or try again later." 
        });
      }
      
      // Handle other OpenAI API errors
      if (error.status >= 400 && error.status < 500) {
        return res.status(error.status).json({ 
          message: `OpenAI API Error: ${error.message}` 
        });
      }
      
      res.status(500).json({ 
        message: error.message || "Failed to preview voice" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
