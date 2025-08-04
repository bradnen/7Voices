import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTtsRequestSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcryptjs";

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
      const { plan } = req.body; // 'pro' or 'premium'
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get user
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId && user.subscriptionStatus === 'active') {
        return res.status(400).json({ message: "User already has an active subscription" });
      }

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { userId }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
      }

      // Create price for the plan (these would normally be configured in Stripe Dashboard)
      const priceData = plan === 'pro' 
        ? { unit_amount: 999, nickname: 'Pro Plan' } // $9.99
        : { unit_amount: 1999, nickname: 'Premium Plan' }; // $19.99

      const price = await stripe.prices.create({
        unit_amount: priceData.unit_amount,
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: `7Voices ${priceData.nickname}`,
          metadata: { plan }
        },
        metadata: { plan }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, plan }
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: plan
      });

      const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;

      if (!clientSecret) {
        return res.status(400).json({ message: "Unable to create payment intent for subscription" });
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret,
        plan,
        amount: priceData.unit_amount / 100
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
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
      });
    } catch (error: any) {
      console.error("Subscription status error:", error);
      res.status(500).json({ message: "Error fetching subscription status" });
    }
  });

  // Email and password authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session data with metadata for persistence
      (req.session as any).userId = user.id;
      (req.session as any).lastActivity = new Date().toISOString();
      (req.session as any).loginTime = new Date().toISOString();
      
      // Save session and wait for completion
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      res.json({ user, message: "Logged in successfully" });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Email signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username: email.split('@')[0],
        name: email.split('@')[0],
        subscriptionPlan: "free",
        subscriptionStatus: "inactive"
      });

      // Set session data with metadata for persistence
      (req.session as any).userId = user.id;
      (req.session as any).lastActivity = new Date().toISOString();
      (req.session as any).signupTime = new Date().toISOString();
      
      // Save session and wait for completion
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      res.json({ user, message: "Account created successfully" });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Account creation failed" });
    }
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  app.get("/api/subscription/status", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({
        subscriptionPlan: user.subscriptionPlan || 'free',
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        hasActiveSubscription: user.subscriptionStatus === 'active' && user.subscriptionPlan !== 'free'
      });
    } catch (error: any) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Error checking subscription status" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
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
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log('Subscription event:', subscription.id, subscription.status);
        
        try {
          // Find user by Stripe customer ID
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          const userId = (customer as any).metadata?.userId;
          
          if (userId) {
            // Determine plan type from subscription items
            const planType = subscription.items.data[0]?.price?.metadata?.plan || 
                           (subscription.items.data[0]?.price?.unit_amount === 999 ? 'pro' : 'premium');
            
            // Update user subscription status
            await storage.updateUserStripeInfo(userId, {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionPlan: planType
            });
            
            console.log(`Updated user ${userId} subscription to ${planType} (${subscription.status})`);
          }
        } catch (error) {
          console.error('Error updating user subscription:', error);
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        
        // Send notification for subscription payments
        try {
          if (invoice.customer && (invoice as any).subscription) {
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
            const userId = (customer as any).metadata?.userId;
            
            if (userId) {
              // Update subscription status to active
              const planType = subscription.items.data[0]?.price?.unit_amount === 999 ? 'pro' : 'premium';
              await storage.updateUserStripeInfo(userId, {
                subscriptionStatus: 'active',
                subscriptionPlan: planType
              });
            }
            
            const email = (customer as any).email || 'Unknown';
            const amount = invoice.amount_paid / 100; // Convert from cents
            const planName = subscription.items.data[0]?.price?.unit_amount === 999 ? 'Pro' : 'Premium';
            
            await sendPaymentNotification(email, `${planName} Plan`, amount);
          }
        } catch (error) {
          console.error('Error processing invoice notification:', error);
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log('Subscription cancelled:', deletedSub.id);
        
        try {
          const customer = await stripe.customers.retrieve(deletedSub.customer as string);
          const userId = (customer as any).metadata?.userId;
          
          if (userId) {
            // Downgrade to free plan
            await storage.updateUserStripeInfo(userId, {
              subscriptionStatus: 'cancelled',
              subscriptionPlan: 'free'
            });
          }
        } catch (error) {
          console.error('Error handling subscription cancellation:', error);
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
