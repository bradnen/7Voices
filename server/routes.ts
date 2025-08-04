import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTtsRequestSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import passport from "passport";
import twilio from "twilio";

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.warn("ELEVENLABS_API_KEY not found, TTS generation will not work");
}

// Initialize Stripe (with fallback for development)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
}) : null;

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// SMS notification function
async function sendPaymentNotification(userEmail: string, plan: string, amount: number) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER || !process.env.DTAC_PHONE_NUMBER) {
    console.log("Twilio not configured, skipping SMS notification");
    return;
  }

  try {
    const message = `🎉 New 7Voice payment!\n\nUser: ${userEmail}\nPlan: ${plan}\nAmount: $${amount}\n\nPayment completed successfully.`;
    
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.DTAC_PHONE_NUMBER,
    });
    
    console.log("Payment notification sent to DTAC number");
  } catch (error) {
    console.error("Failed to send SMS notification:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup GitHub authentication
  const { setupAuth, requireAuth } = await import("./auth");
  setupAuth(app);
  
  // Generate speech from text
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const validatedData = insertTtsRequestSchema.parse(req.body);
      
      // Store the request
      const ttsRequest = await storage.createTtsRequest(validatedData);
      
      // Map voice names to ElevenLabs voice IDs
      const voiceMap: Record<string, string> = {
        "Rachel - Professional Female": "21m00Tcm4TlvDq8ikWAM",
        "Drew - Warm Male": "29vD33N1CtxCmqQRPOHJ", 
        "Clyde - Middle Aged Male": "2EiwWnXFnvU5JabPnv8n",
        "Bella - Young Female": "EXAVITQu4vr4xnSDxMaL",
        "Antoni - Well-Rounded Male": "ErXwobaYiN019PkySvjV",
        "Elli - Emotional Female": "MF3mGyEYCl7XYWbV9V6O",
        "Josh - Deep Male": "TxGEqnHWrfWFTfGW9XjX",
        "Arnold - Crisp Male": "VR6AewLTigWG4xSOukaG",
        "Adam - Narration Male": "pNInz6obpgDQGcFmaJgB",
        "Sam - Raspy Male": "yoZ06aMxZJJ28mfd3POQ"
      };
      
      const voiceId = voiceMap[validatedData.voice] || "21m00Tcm4TlvDq8ikWAM";
      
      if (!ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key not configured");
      }
      
      // Generate speech using ElevenLabs API
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: validatedData.text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      
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
      
      // Handle ElevenLabs API errors
      if (error.message?.includes('ElevenLabs API error')) {
        return res.status(429).json({ 
          message: "ElevenLabs API error. Please check your API key and quota, or try again later." 
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
        { id: "Rachel - Professional Female", name: "Rachel", description: "Professional Female", category: "Professional" },
        { id: "Drew - Warm Male", name: "Drew", description: "Warm Male", category: "Conversational" },
        { id: "Clyde - Middle Aged Male", name: "Clyde", description: "Middle Aged Male", category: "Mature" },
        { id: "Bella - Young Female", name: "Bella", description: "Young Female", category: "Youthful" },
        { id: "Antoni - Well-Rounded Male", name: "Antoni", description: "Well-Rounded Male", category: "Versatile" },
        { id: "Elli - Emotional Female", name: "Elli", description: "Emotional Female", category: "Expressive" },
        { id: "Josh - Deep Male", name: "Josh", description: "Deep Male", category: "Authoritative" },
        { id: "Arnold - Crisp Male", name: "Arnold", description: "Crisp Male", category: "Clear" },
        { id: "Adam - Narration Male", name: "Adam", description: "Narration Male", category: "Storytelling" },
        { id: "Sam - Raspy Male", name: "Sam", description: "Raspy Male", category: "Character" }
      ];
      
      res.json(voices);
    } catch (error: any) {
      console.error('Get voices error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to get voices" 
      });
    }
  });

  // Preview voice with sample text using ElevenLabs
  app.post("/api/tts/preview", async (req, res) => {
    try {
      const { voice } = req.body;
      
      if (!voice) {
        return res.status(400).json({ message: "Voice is required" });
      }
      
      if (!ELEVENLABS_API_KEY) {
        return res.status(501).json({ message: "ElevenLabs API key not configured" });
      }
      
      const voiceMap: Record<string, string> = {
        "Rachel - Professional Female": "21m00Tcm4TlvDq8ikWAM",
        "Drew - Warm Male": "29vD33N1CtxCmqQRPOHJ", 
        "Clyde - Middle Aged Male": "2EiwWnXFnvU5JabPnv8n",
        "Bella - Young Female": "EXAVITQu4vr4xnSDxMaL",
        "Antoni - Well-Rounded Male": "ErXwobaYiN019PkySvjV",
        "Elli - Emotional Female": "MF3mGyEYCl7XYWbV9V6O",
        "Josh - Deep Male": "TxGEqnHWrfWFTfGW9XjX",
        "Arnold - Crisp Male": "VR6AewLTigWG4xSOukaG",
        "Adam - Narration Male": "pNInz6obpgDQGcFmaJgB",
        "Sam - Raspy Male": "yoZ06aMxZJJ28mfd3POQ"
      };
      
      const voiceId = voiceMap[voice] || "21m00Tcm4TlvDq8ikWAM";
      const sampleText = "Hello! This is a preview of my voice. I hope you like how I sound.";
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: sampleText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
      });
      
      res.send(buffer);
    } catch (error: any) {
      console.error('Voice preview error:', error);
      
      if (error.message?.includes('ElevenLabs API error')) {
        return res.status(429).json({ 
          message: "ElevenLabs API error. Please check your API key and quota." 
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
      const planType = priceId.includes('pro') ? 'pro' : 'premium';
      await storage.updateUserStripeInfo(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: planType
      });

      // Send SMS notification for successful subscription creation
      const planAmount = planType === 'pro' ? 9.99 : 19.99;
      await sendPaymentNotification(user.email || 'Unknown', planType, planAmount);

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
        return res.json({ active: false, status: "none", plan: "free" });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      res.json({
        active: subscription.status === 'active',
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

  // GitHub authentication routes
  app.get("/api/auth/github", 
    passport.authenticate("github", { scope: ["user:email"] })
  );

  app.get("/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/dashboard");
    }
  );

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // TTS History endpoint
  app.get("/api/tts/history", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const history = await storage.getTtsRequests();
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching TTS history:", error);
      res.status(500).json({ message: "Error fetching history" });
    }
  });

  // Test SMS endpoint for development
  app.post("/api/test-sms", async (req, res) => {
    try {
      await sendPaymentNotification("test@example.com", "test plan", 9.99);
      res.json({ message: "Test SMS sent successfully" });
    } catch (error: any) {
      console.error("Test SMS failed:", error);
      res.status(500).json({ message: "Test SMS failed: " + error.message });
    }
  });

  // Stripe webhook for payment confirmations
  app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    if (!stripe) {
      return res.status(501).json({ message: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // In production, you should set STRIPE_WEBHOOK_SECRET
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Try to find the user and send notification
        try {
          if (paymentIntent.customer) {
            const customer = await stripe.customers.retrieve(paymentIntent.customer as string);
            const email = (customer as any).email || 'Unknown';
            const amount = paymentIntent.amount / 100; // Convert from cents
            
            await sendPaymentNotification(email, 'subscription', amount);
          }
        } catch (error) {
          console.error('Error processing payment notification:', error);
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        
        // Send notification for recurring payments
        try {
          if (invoice.customer) {
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            const email = (customer as any).email || 'Unknown';
            const amount = invoice.amount_paid / 100; // Convert from cents
            
            await sendPaymentNotification(email, 'recurring payment', amount);
          }
        } catch (error) {
          console.error('Error processing invoice notification:', error);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  });

  const httpServer = createServer(app);
  return httpServer;
}
