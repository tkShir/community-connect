import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { api, adminProfileUpdateSchema, eventInputSchema, eventDenySchema } from "@shared/routes";
import { z } from "zod";
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

  app.get(api.matches.suggested.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });
    
    const suggested = await storage.getSuggestedMatches(myProfile.id);
    res.json(suggested);
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
      
      if (receiverId === myProfile.id) {
        return res.status(400).json({ message: "Cannot match with yourself" });
      }

      const match = await storage.createMatch({
        initiatorId: myProfile.id,
        receiverId,
      });

      // Notification for receiver
      const receiverProfile = await storage.getProfile(receiverId);
      if (receiverProfile) {
        await storage.createNotification(receiverProfile.userId, `${myProfile.alias} sent you a connection request!`);
      }

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

      if (match.receiverId !== myProfile.id) {
        return res.status(403).json({ message: "Not authorized to respond to this match" });
      }

      const updated = await storage.updateMatchStatus(matchId, status);
      
      // Notification for initiator
      const initiatorProfile = await storage.getProfile(match.initiatorId);
      if (initiatorProfile) {
        await storage.createNotification(initiatorProfile.userId, `${myProfile.alias} ${status} your connection request!`);
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === Notifications ===
  app.get(api.notifications.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const notifs = await storage.getNotifications(userId);
    res.json(notifs);
  });

  app.patch(api.notifications.markRead.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ success: true });
  });

  // === Admin Routes ===
  
  app.get("/api/admin/profiles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const allProfiles = await storage.getAllProfilesAdmin();
    res.json(allProfiles);
  });

  app.patch("/api/admin/profiles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const profileId = Number(req.params.id);
      const validatedData = adminProfileUpdateSchema.parse(req.body);
      const updated = await storage.updateProfileAdmin(profileId, validatedData);
      if (!updated) return res.status(404).json({ message: "Profile not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === Events Routes ===

  // Get all published events (public)
  app.get(api.events.published.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const events = await storage.getPublishedEvents();
    res.json(events);
  });

  // Get user's own events
  app.get(api.events.myEvents.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const events = await storage.getUserEvents(userId);
    res.json(events);
  });

  // Get single event
  app.get(api.events.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  // Create event (user = pending, admin = published)
  app.post(api.events.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    const isAdmin = myProfile?.isAdmin || false;

    try {
      const input = eventInputSchema.parse(req.body);
      const event = await storage.createEvent(input, userId, isAdmin);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Admin: Get all events
  app.get("/api/admin/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const allEvents = await storage.getAllEvents();
    res.json(allEvents);
  });

  // Admin: Get pending events
  app.get("/api/admin/events/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const pendingEvents = await storage.getPendingEvents();
    res.json(pendingEvents);
  });

  // Admin: Update event
  app.patch("/api/admin/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const eventId = Number(req.params.id);
      const updated = await storage.updateEvent(eventId, req.body);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Approve event
  app.post("/api/admin/events/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const updated = await storage.approveEvent(eventId);
      
      // Notify the event creator
      await storage.createNotification(event.creatorId, `Your event "${event.title}" has been approved and published!`);
      
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Deny event
  app.post("/api/admin/events/:id/deny", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { reason } = eventDenySchema.parse(req.body);
      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const updated = await storage.denyEvent(eventId, reason);
      
      // Notify the event creator with reason
      await storage.createNotification(event.creatorId, `Your event "${event.title}" was denied. Reason: ${reason}`);
      
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Admin: Delete event
  app.delete("/api/admin/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const eventId = Number(req.params.id);
      await storage.deleteEvent(eventId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingProfiles = await db.select().from(profiles).limit(1);
  if (existingProfiles.length > 0) return;

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
      profession: ["Technology"],
      hobbies: ["Coding", "Hiking", "Gaming"],
      interests: ["AI", "Startups", "Machine Learning"],
      goal: ["Find a Mentee"],
      isPublic: true,
      ageRange: "23-26",
      contactMethod: "Email",
      contactValue: "alex@example.com"
    },
    {
      userId: "seed_user_2",
      alias: "SoccerPro",
      bio: "Love playing soccer on weekends. Looking for a team.",
      profession: ["Finance"],
      hobbies: ["Soccer", "Running", "Cooking"],
      interests: ["Sports", "Fitness", "Nutrition"],
      goal: ["Activity Partner"],
      isPublic: true,
      ageRange: "27-30",
      contactMethod: "Phone",
      contactValue: "123-456-7890"
    },
    {
      userId: "seed_user_3",
      alias: "DesignGuru",
      bio: "Senior designer happy to mentor juniors.",
      profession: ["Technology", "Arts"],
      hobbies: ["Art", "Photography", "Travel"],
      interests: ["Design", "UX Design", "Leadership"],
      goal: ["Find a Mentor"],
      isPublic: true,
      ageRange: "30-34",
      contactMethod: "LINE",
      contactValue: "designguru_line"
    },
    {
      userId: "seed_user_4",
      alias: "StartupFounder",
      bio: "Building a new fintech startup. Need advice.",
      profession: ["Finance", "Technology"],
      hobbies: ["Reading", "Traveling", "Golf"],
      interests: ["Investing", "Startups", "Leadership"],
      goal: ["Find a Mentor", "Professional Networking"],
      isPublic: true,
      ageRange: "above 34",
      contactMethod: "Email",
      contactValue: "casey@example.com"
    }
  ];

  for (const p of seedProfiles) {
    await db.insert(profiles).values(p).onConflictDoNothing();
  }
}
