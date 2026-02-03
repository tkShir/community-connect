import { db } from "./db";
import {
  profiles, matches, messages,
  type Profile, type InsertProfile,
  type Match, type InsertMatch,
  type Message, type InsertMessage,
  type MatchWithProfile
} from "@shared/schema";
import { eq, or, and, ne, notInArray, desc } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Profiles
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  upsertProfile(userId: string, profile: InsertProfile): Promise<Profile>;
  getAllProfiles(excludeUserId: string): Promise<Profile[]>;

  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchStatus(id: number, status: "accepted" | "rejected"): Promise<Match | undefined>;
  getMatchesForProfile(profileId: number): Promise<MatchWithProfile[]>;
  getPotentialMatches(profileId: number): Promise<Profile[]>;
  getMatch(id: number): Promise<Match | undefined>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(matchId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(userId: string, insertProfile: InsertProfile): Promise<Profile> {
    // Check if profile exists for this user to update, or insert new
    const existing = await this.getProfileByUserId(userId);
    
    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({ ...insertProfile, userId }) // Ensure userId is preserved
        .where(eq(profiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(profiles)
        .values({ ...insertProfile, userId })
        .returning();
      return created;
    }
  }

  async getAllProfiles(excludeUserId: string): Promise<Profile[]> {
    return await db.select().from(profiles).where(ne(profiles.userId, excludeUserId));
  }

  // Matches
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatchStatus(id: number, status: "accepted" | "rejected"): Promise<Match | undefined> {
    const [updated] = await db
      .update(matches)
      .set({ status })
      .where(eq(matches.id, id))
      .returning();
    return updated;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMatchesForProfile(profileId: number): Promise<MatchWithProfile[]> {
    // Get matches where user is initiator or receiver
    const allMatches = await db.select().from(matches).where(
      or(
        eq(matches.initiatorId, profileId),
        eq(matches.receiverId, profileId)
      )
    );

    // Enrich with partner profile
    const enrichedMatches: MatchWithProfile[] = [];
    for (const match of allMatches) {
      const partnerId = match.initiatorId === profileId ? match.receiverId : match.initiatorId;
      const partnerProfile = await this.getProfile(partnerId);
      if (partnerProfile) {
        enrichedMatches.push({ ...match, partnerProfile });
      }
    }

    return enrichedMatches;
  }

  async getPotentialMatches(profileId: number): Promise<Profile[]> {
    const myProfile = await this.getProfile(profileId);
    if (!myProfile) return [];

    // Get IDs of profiles already interacted with (initiated matches or received matches)
    const existingInteractions = await db.select().from(matches).where(
      or(
        eq(matches.initiatorId, profileId),
        eq(matches.receiverId, profileId)
      )
    );

    const excludedProfileIds = new Set<number>();
    excludedProfileIds.add(profileId); // Exclude self
    existingInteractions.forEach(m => {
      excludedProfileIds.add(m.initiatorId);
      excludedProfileIds.add(m.receiverId);
    });

    // Simple recommendation: Get all profiles not in excluded list
    // In a real app, we'd filter by interests overlap here or in query
    const potential = await db.select().from(profiles).where(
        notInArray(profiles.id, Array.from(excludedProfileIds))
    );
    
    // Sort by number of common interests/hobbies (simple js sort for MVP)
    return potential.sort((a, b) => {
      const aCommon = a.interests.filter(i => myProfile.interests.includes(i)).length;
      const bCommon = b.interests.filter(i => myProfile.interests.includes(i)).length;
      return bCommon - aCommon;
    });
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessages(matchId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt);
  }
}

export const storage = new DatabaseStorage();
