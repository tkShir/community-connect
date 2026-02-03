import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertProfileSchema } from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { profiles } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Profiles ===
  
  app.get(api.profiles.me.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfileByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.post(api.profiles.upsert.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    
    try {
      const input = api.profiles.upsert.input.parse(req.body);
      const profile = await storage.upsertProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.profiles.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  // === Matches ===

  app.get(api.matches.potential.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });
    
    const potential = await storage.getPotentialMatches(myProfile.id);
    res.json(potential);
  });

  app.get(api.matches.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });
    
    const matches = await storage.getMatchesForProfile(myProfile.id);
    res.json(matches);
  });

  app.post(api.matches.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });

    try {
      const { receiverId } = api.matches.create.input.parse(req.body);
      
      // Prevent self-match
      if (receiverId === myProfile.id) {
        return res.status(400).json({ message: "Cannot match with yourself" });
      }

      const match = await storage.createMatch({
        initiatorId: myProfile.id,
        receiverId,
        // status defaults to pending
      });
      res.status(201).json(match);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.matches.respond.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });

    try {
      const { status } = api.matches.respond.input.parse(req.body);
      const matchId = Number(req.params.id);
      
      const match = await storage.getMatch(matchId);
      if (!match) return res.status(404).json({ message: "Match not found" });

      // Only receiver can accept/reject, or initiator can cancel (maybe? keep simple for now)
      if (match.receiverId !== myProfile.id) {
        return res.status(403).json({ message: "Not authorized to respond to this match" });
      }

      const updated = await storage.updateMatchStatus(matchId, status);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === Messages ===

  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });

    const matchId = Number(req.params.matchId);
    const match = await storage.getMatch(matchId);
    if (!match) return res.status(404).json({ message: "Match not found" });

    // Verify participation
    if (match.initiatorId !== myProfile.id && match.receiverId !== myProfile.id) {
      return res.status(403).json({ message: "Not a participant" });
    }

    const messages = await storage.getMessages(matchId);
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });

    try {
      const matchId = Number(req.params.matchId);
      const { content } = api.messages.create.input.parse(req.body);

      const match = await storage.getMatch(matchId);
      if (!match) return res.status(404).json({ message: "Match not found" });

      if (match.status !== 'accepted') {
         return res.status(400).json({ message: "Match must be accepted to message" });
      }

      if (match.initiatorId !== myProfile.id && match.receiverId !== myProfile.id) {
        return res.status(403).json({ message: "Not a participant" });
      }

      const message = await storage.createMessage({
        matchId,
        senderId: myProfile.id,
        content
      });
      res.status(201).json(message);
    } catch (err) {
       if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Seed data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Check if any profiles exist. If not, seed.
  // We can only seed if we have users. 
  // Let's create dummy users in the 'users' table directly for seeding purposes.
  
  const existingProfiles = await db.select().from(profiles).limit(1);
  if (existingProfiles.length > 0) return;

  console.log("Seeding database...");

  const seedUsers = [
    { id: "seed_user_1", email: "alex@example.com", firstName: "Alex", lastName: "Doe" },
    { id: "seed_user_2", email: "sam@example.com", firstName: "Sam", lastName: "Smith" },
    { id: "seed_user_3", email: "jordan@example.com", firstName: "Jordan", lastName: "Lee" },
    { id: "seed_user_4", email: "casey@example.com", firstName: "Casey", lastName: "West" },
  ];

  for (const u of seedUsers) {
    await db.insert(users).values(u).onConflictDoNothing();
  }

  const seedProfiles = [
    {
      userId: "seed_user_1",
      alias: "TechSeeker",
      bio: "Software engineer looking for mentorship in AI.",
      profession: "Software Engineer",
      hobbies: ["Coding", "Hiking", "Gaming"],
      interests: ["AI", "Startups", "Machine Learning"],
      goal: "mentee",
      isPublic: true
    },
    {
      userId: "seed_user_2",
      alias: "SoccerPro",
      bio: "Love playing soccer on weekends. Looking for a team.",
      profession: "Accountant",
      hobbies: ["Soccer", "Running", "Cooking"],
      interests: ["Sports", "Fitness", "Nutrition"],
      goal: "soccer",
      isPublic: true
    },
    {
      userId: "seed_user_3",
      alias: "DesignGuru",
      bio: "Senior designer happy to mentor juniors.",
      profession: "Product Designer",
      hobbies: ["Art", "Photography", "Travel"],
      interests: ["Design", "UX", "Mentorship"],
      goal: "mentor",
      isPublic: true
    },
    {
      userId: "seed_user_4",
      alias: "StartupFounder",
      bio: "Building a new fintech startup. Need advice.",
      profession: "Founder",
      hobbies: ["Reading", "Networking", "Golf"],
      interests: ["Fintech", "Business", "Investing"],
      goal: "mentor",
      isPublic: true
    }
  ];

  for (const p of seedProfiles) {
    await db.insert(profiles).values(p).onConflictDoNothing();
  }

  console.log("Seeding complete.");
}
