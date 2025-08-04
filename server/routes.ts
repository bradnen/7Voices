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

// Initialize Stripe (with fallback for development)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : null;

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

  // Stripe payment routes
  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(501).json({ message: "Stripe not configured" });
    }

    try {
      const { amount, plan } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          plan: plan || "pro"
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/stripe/create-subscription", requireAuth, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ message: "Stripe not configured" });
    }

    try {
      const { priceId } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get or create customer
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { userId }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: priceId.includes('pro') ? 'pro' : 'premium'
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  app.get("/api/stripe/subscription-status", requireAuth, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ message: "Stripe not configured" });
    }

    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ status: "none", plan: "free" });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      res.json({
        status: subscription.status,
        plan: user.subscriptionPlan || "free",
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
    } catch (error: any) {
      console.error("Subscription status error:", error);
      res.status(500).json({ message: "Error fetching subscription status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
