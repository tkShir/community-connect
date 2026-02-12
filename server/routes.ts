import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, adminProfileUpdateSchema, eventInputSchema, eventDenySchema, groupInputSchema, groupDenySchema, customOptionUpdateSchema } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { profiles } from "@shared/schema";

function isAuthed(req: Request): boolean {
  const anyReq = req as any;
  return !!anyReq.oidc?.isAuthenticated?.();
}

function getUserId(req: Request): string {
  const anyReq = req as any;
  return anyReq.oidc?.user?.sub as string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === Profiles ===
  
  app.get(api.profiles.me.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const profile = await storage.getProfileByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.post(api.profiles.upsert.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);

    try {
      const input = api.profiles.upsert.input.parse(req.body);
      const profile = await storage.upsertProfile(userId, input);

      // Auto-register custom values
      await storage.registerCustomValues("profession", input.profession, userId);
      await storage.registerCustomValues("interests", input.interests, userId);
      await storage.registerCustomValues("hobbies", input.hobbies, userId);

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
    if (!isAuthed(req)) return res.sendStatus(401);
    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  // === Matches ===

  app.get(api.matches.potential.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });
    
    const potential = await storage.getPotentialMatches(myProfile.id);
    res.json(potential);
  });

  app.get(api.matches.suggested.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });
    
    const suggested = await storage.getSuggestedMatches(myProfile.id);
    res.json(suggested);
  });

  app.get(api.matches.list.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile) return res.status(400).json({ message: "Create a profile first" });
    
    const matches = await storage.getMatchesForProfile(myProfile.id);
    res.json(matches);
  });

  app.post(api.matches.create.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const notifs = await storage.getNotifications(userId);
    res.json(notifs);
  });

  app.patch(api.notifications.markRead.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ success: true });
  });

  // === Custom Options (public - for translation lookups) ===

  app.get(api.customOptions.list.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const options = await storage.getCustomOptions();
    res.json(options);
  });

  // === Admin Routes ===
  
  app.get("/api/admin/profiles", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const allProfiles = await storage.getAllProfilesAdmin();
    res.json(allProfiles);
  });

  app.patch("/api/admin/profiles/:id", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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
    if (!isAuthed(req)) return res.sendStatus(401);
    const events = await storage.getPublishedEvents();
    res.json(events);
  });

  // Get user's own events
  app.get(api.events.myEvents.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const events = await storage.getUserEvents(userId);
    res.json(events);
  });

  // Get single event
  app.get(api.events.get.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  // Create event (user = pending, admin = published)
  app.post(api.events.create.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const allEvents = await storage.getAllEvents();
    res.json(allEvents);
  });

  // Admin: Get pending events
  app.get("/api/admin/events/pending", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const pendingEvents = await storage.getPendingEvents();
    res.json(pendingEvents);
  });

  // Admin: Update event
  app.patch("/api/admin/events/:id", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
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

  // === Groups Routes ===

  app.get(api.groups.published.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const publishedGroups = await storage.getPublishedGroups();
    res.json(publishedGroups);
  });

  app.get(api.groups.myGroups.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const userGroups = await storage.getUserGroups(userId);
    res.json(userGroups);
  });

  app.post(api.groups.create.path, async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    const isAdmin = myProfile?.isAdmin || false;

    try {
      const input = groupInputSchema.parse(req.body);
      const group = await storage.createGroup(input, userId, isAdmin);
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Admin: Get all groups
  app.get("/api/admin/groups", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const allGroups = await storage.getAllGroups();
    res.json(allGroups);
  });

  // Admin: Get pending groups
  app.get("/api/admin/groups/pending", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const pendingGroups = await storage.getPendingGroups();
    res.json(pendingGroups);
  });

  // Admin: Update group
  app.patch("/api/admin/groups/:id", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const groupId = Number(req.params.id);
      const updated = await storage.updateGroup(groupId, req.body);
      if (!updated) return res.status(404).json({ message: "Group not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Approve group
  app.post("/api/admin/groups/:id/approve", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const groupId = Number(req.params.id);
      const group = await storage.getGroup(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      const updated = await storage.approveGroup(groupId);
      await storage.createNotification(group.creatorId, `Your group suggestion "${group.title}" has been approved!`);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Deny group
  app.post("/api/admin/groups/:id/deny", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const { reason } = groupDenySchema.parse(req.body);
      const groupId = Number(req.params.id);
      const group = await storage.getGroup(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      const updated = await storage.denyGroup(groupId, reason);
      await storage.createNotification(group.creatorId, `Your group suggestion "${group.title}" was denied. Reason: ${reason}`);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Admin: Delete group
  app.delete("/api/admin/groups/:id", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const groupId = Number(req.params.id);
      await storage.deleteGroup(groupId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Admin: Custom Options ===

  app.get("/api/admin/custom-options", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const options = await storage.getCustomOptions();
    res.json(options);
  });

  app.patch("/api/admin/custom-options/:id", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const optionId = Number(req.params.id);
      const validated = customOptionUpdateSchema.parse(req.body);
      const updated = await storage.updateCustomOption(optionId, validated);
      if (!updated) return res.status(404).json({ message: "Custom option not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/admin/custom-options/:id", async (req, res) => {
    if (!isAuthed(req)) return res.sendStatus(401);
    const userId = getUserId(req);
    const myProfile = await storage.getProfileByUserId(userId);
    if (!myProfile || !myProfile.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const optionId = Number(req.params.id);
      await storage.deleteCustomOption(optionId);
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
