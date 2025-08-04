import session from "express-session";
import type { Express } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

export function setupAuth(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
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
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication required" });
  }
}