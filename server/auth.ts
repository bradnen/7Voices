import session from "express-session";
import type { Express } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

export function setupAuth(app: Express) {
  // Trust proxy for session cookies
  app.set('trust proxy', 1);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for better persistence
      sameSite: 'lax'
    },
    rolling: true // Reset expiration on each request
  }));
}

export async function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Update last activity for session maintenance
    (req.session as any).lastActivity = new Date().toISOString();
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication required" });
  }
}