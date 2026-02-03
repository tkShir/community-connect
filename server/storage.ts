import { db } from "./db";
import {
  profiles, matches, notifications,
  type Profile, type InsertProfile,
  type Match, type InsertMatch,
  type MatchWithProfile
} from "@shared/schema";
import { eq, or, and, ne, notInArray, desc } from "drizzle-orm";

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
  getSuggestedMatches(profileId: number): Promise<Profile[]>;
  getMatch(id: number): Promise<Match | undefined>;

  // Notifications
  createNotification(userId: string, content: string): Promise<any>;
  getNotifications(userId: string): Promise<any[]>;
  markNotificationRead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(userId: string, insertProfile: InsertProfile): Promise<Profile> {
    const existing = await this.getProfileByUserId(userId);
    if (existing) {
      const [updated] = await db.update(profiles).set({ ...insertProfile, userId }).where(eq(profiles.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(profiles).values({ ...insertProfile, userId }).returning();
      return created;
    }
  }

  async getAllProfiles(excludeUserId: string): Promise<Profile[]> {
    return await db.select().from(profiles).where(ne(profiles.userId, excludeUserId));
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatchStatus(id: number, status: "accepted" | "rejected"): Promise<Match | undefined> {
    const [updated] = await db.update(matches).set({ status }).where(eq(matches.id, id)).returning();
    return updated;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMatchesForProfile(profileId: number): Promise<MatchWithProfile[]> {
    const allMatches = await db.select().from(matches).where(or(eq(matches.initiatorId, profileId), eq(matches.receiverId, profileId)));
    const enrichedMatches: MatchWithProfile[] = [];
    for (const match of allMatches) {
      const partnerId = match.initiatorId === profileId ? match.receiverId : match.initiatorId;
      const partnerProfile = await this.getProfile(partnerId);
      if (partnerProfile) enrichedMatches.push({ ...match, partnerProfile });
    }
    return enrichedMatches;
  }

  async getPotentialMatches(profileId: number): Promise<Profile[]> {
    const myProfile = await this.getProfile(profileId);
    if (!myProfile) return [];
    const existingInteractions = await db.select().from(matches).where(or(eq(matches.initiatorId, profileId), eq(matches.receiverId, profileId)));
    const excludedProfileIds = new Set<number>([profileId]);
    existingInteractions.forEach(m => { excludedProfileIds.add(m.initiatorId); excludedProfileIds.add(m.receiverId); });
    const potential = await db.select().from(profiles).where(notInArray(profiles.id, Array.from(excludedProfileIds)));
    return potential.sort((a, b) => {
      const aCommon = a.interests.filter(i => myProfile.interests.includes(i)).length;
      const bCommon = b.interests.filter(i => myProfile.interests.includes(i)).length;
      return bCommon - aCommon;
    });
  }

  async getSuggestedMatches(profileId: number): Promise<Profile[]> {
    const myProfile = await this.getProfile(profileId);
    if (!myProfile) return [];
    const existingInteractions = await db.select().from(matches).where(or(eq(matches.initiatorId, profileId), eq(matches.receiverId, profileId)));
    const excludedProfileIds = new Set<number>([profileId]);
    existingInteractions.forEach(m => { excludedProfileIds.add(m.initiatorId); excludedProfileIds.add(m.receiverId); });

    const allProfiles = await db.select().from(profiles).where(notInArray(profiles.id, Array.from(excludedProfileIds)));
    
    const myProfessions = Array.isArray(myProfile.profession) ? myProfile.profession : [myProfile.profession];
    const myGoals = Array.isArray(myProfile.goal) ? myProfile.goal : [myProfile.goal];
    
    return allProfiles.filter(p => {
      const pProfessions = Array.isArray(p.profession) ? p.profession : [p.profession];
      const pGoals = Array.isArray(p.goal) ? p.goal : [p.goal];
      
      const hasCommonProfession = myProfessions.some(mp => pProfessions.includes(mp));
      if (!hasCommonProfession) return false;
      
      const iWantMentor = myGoals.some(g => g.toLowerCase().includes('mentor') && !g.toLowerCase().includes('mentee'));
      const iWantMentee = myGoals.some(g => g.toLowerCase().includes('mentee'));
      const theyWantMentor = pGoals.some(g => g.toLowerCase().includes('mentor') && !g.toLowerCase().includes('mentee'));
      const theyWantMentee = pGoals.some(g => g.toLowerCase().includes('mentee'));
      
      if (iWantMentor && theyWantMentee) return true;
      if (iWantMentee && theyWantMentor) return true;
      return false;
    });
  }

  async createNotification(userId: string, content: string): Promise<any> {
    const [notif] = await db.insert(notifications).values({ userId, content }).returning();
    return notif;
  }

  async getNotifications(userId: string): Promise<any[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
