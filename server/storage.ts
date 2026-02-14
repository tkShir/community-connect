import { db } from "./db";
import {
  profiles, matches, notifications, events, groups, customOptions, feedback,
  type Profile, type InsertProfile,
  type Match, type InsertMatch,
  type MatchWithProfile,
  type Event, type InsertEvent,
  type Group, type InsertGroup,
  type CustomOption,
  type Feedback, type InsertFeedback,
} from "@shared/schema";
import { eq, or, and, ne, notInArray, desc } from "drizzle-orm";
import { isPredefinedKey, type OptionCategory } from "@shared/profile-keys";

export interface IStorage {
  // Profiles
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  upsertProfile(userId: string, profile: InsertProfile): Promise<Profile>;
  getAllProfiles(excludeUserId: string): Promise<Profile[]>;
  getAllProfilesAdmin(): Promise<Profile[]>;
  updateProfileAdmin(id: number, profile: Partial<InsertProfile> & { isAdmin?: boolean }): Promise<Profile | undefined>;

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

  // Events
  createEvent(event: InsertEvent, creatorId: string, createdByAdmin: boolean): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  getPublishedEvents(): Promise<Event[]>;
  getPendingEvents(): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;
  getUserEvents(userId: string): Promise<Event[]>;
  approveEvent(id: number): Promise<Event | undefined>;
  denyEvent(id: number, reason: string): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;

  // Custom Options
  getCustomOptions(): Promise<CustomOption[]>;
  getCustomOptionsByCategory(category: string): Promise<CustomOption[]>;
  updateCustomOption(id: number, update: { labelEn?: string; labelJa?: string }): Promise<CustomOption | undefined>;
  deleteCustomOption(id: number): Promise<void>;
  registerCustomValues(category: OptionCategory, values: string[], userId: string): Promise<void>;

  // Feedback
  createFeedback(feedbackData: InsertFeedback, userId?: string): Promise<Feedback>;
  getAllFeedback(): Promise<Feedback[]>;
  deleteFeedback(id: number): Promise<void>;

  // Groups
  createGroup(group: InsertGroup, creatorId: string, createdByAdmin: boolean): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group | undefined>;
  getPublishedGroups(): Promise<Group[]>;
  getPendingGroups(): Promise<Group[]>;
  getAllGroups(): Promise<Group[]>;
  getUserGroups(userId: string): Promise<Group[]>;
  approveGroup(id: number): Promise<Group | undefined>;
  denyGroup(id: number, reason: string): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<void>;
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
    
    const myGoals = Array.isArray(myProfile.goal) ? myProfile.goal : [myProfile.goal];
    
    return potential.map(p => {
      let score = 0;
      
      if (myGoals.some(g => g.toLowerCase().includes('networking'))) {
        const professionMatch = p.profession.filter(prof => myProfile.profession.includes(prof)).length;
        const interestMatch = p.interests.filter(i => myProfile.interests.includes(i)).length;
        score += (professionMatch * 3) + (interestMatch * 2);
      }
      
      if (myGoals.some(g => g.toLowerCase().includes('friendship') || g.toLowerCase().includes('social'))) {
        const hobbyMatch = p.hobbies.filter(h => myProfile.hobbies.includes(h)).length;
        const sameAge = p.ageRange === myProfile.ageRange ? 1 : 0;
        score += (hobbyMatch * 2) + (sameAge * 3);
      }
      
      if (myGoals.some(g => g.toLowerCase().includes('activity') || g.toLowerCase().includes('partner'))) {
        const hobbyMatch = p.hobbies.filter(h => myProfile.hobbies.includes(h)).length;
        score += hobbyMatch * 3;
      }
      
      const interestMatch = p.interests.filter(i => myProfile.interests.includes(i)).length;
      score += interestMatch;
      
      return { profile: p, score };
    }).sort((a, b) => b.score - a.score).map(item => item.profile);
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
    const myInterests = Array.isArray(myProfile.interests) ? myProfile.interests : [myProfile.interests];
    const myHobbies = Array.isArray(myProfile.hobbies) ? myProfile.hobbies : [myProfile.hobbies];
    const myAgeRange = myProfile.ageRange;
    
    const normalizeGoal = (g: string) => g.toLowerCase().trim();
    
    const iWantMentor = myGoals.some(g => normalizeGoal(g).includes('mentor') && !normalizeGoal(g).includes('mentee'));
    const iWantMentee = myGoals.some(g => normalizeGoal(g).includes('mentee'));
    const iWantNetworking = myGoals.some(g => normalizeGoal(g).includes('professional') || normalizeGoal(g).includes('networking'));
    const iWantFriendship = myGoals.some(g => normalizeGoal(g).includes('friendship') || normalizeGoal(g).includes('social'));
    const iWantActivityPartner = myGoals.some(g => normalizeGoal(g).includes('activity') || normalizeGoal(g).includes('partner'));
    
    return allProfiles.filter(p => {
      const pProfessions = Array.isArray(p.profession) ? p.profession : [p.profession];
      const pGoals = Array.isArray(p.goal) ? p.goal : [p.goal];
      const pInterests = Array.isArray(p.interests) ? p.interests : [p.interests];
      const pHobbies = Array.isArray(p.hobbies) ? p.hobbies : [p.hobbies];
      
      const hasCommonProfession = myProfessions.some(mp => pProfessions.some(pp => mp.toLowerCase() === pp.toLowerCase()));
      const hasCommonInterests = myInterests.some(mi => pInterests.some(pi => mi.toLowerCase() === pi.toLowerCase()));
      const hasCommonHobbies = myHobbies.some(mh => pHobbies.some(ph => mh.toLowerCase() === ph.toLowerCase()));
      const sameAgeRange = myAgeRange === p.ageRange;
      
      const theyWantMentor = pGoals.some(g => normalizeGoal(g).includes('mentor') && !normalizeGoal(g).includes('mentee'));
      const theyWantMentee = pGoals.some(g => normalizeGoal(g).includes('mentee'));
      
      // Mentor/Mentee matching: complementary goals in same profession
      if (iWantMentor && theyWantMentee && hasCommonProfession) return true;
      if (iWantMentee && theyWantMentor && hasCommonProfession) return true;
      
      // Professional Networking: common profession OR common interests
      if (iWantNetworking && (hasCommonProfession || hasCommonInterests)) return true;
      
      // Friendship/Social: same age range AND (common interests OR common hobbies)
      if (iWantFriendship && sameAgeRange && (hasCommonInterests || hasCommonHobbies)) return true;
      
      // Activity Partner: common hobbies
      if (iWantActivityPartner && hasCommonHobbies) return true;
      
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

  async getAllProfilesAdmin(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }

  async updateProfileAdmin(id: number, profileUpdate: Partial<InsertProfile> & { isAdmin?: boolean }): Promise<Profile | undefined> {
    const [updated] = await db.update(profiles).set(profileUpdate).where(eq(profiles.id, id)).returning();
    return updated;
  }

  async createEvent(event: InsertEvent, creatorId: string, createdByAdmin: boolean): Promise<Event> {
    const status = createdByAdmin ? "published" : "pending_approval";
    const [created] = await db.insert(events).values({
      ...event,
      creatorId,
      createdByAdmin,
      status,
    }).returning();
    return created;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set({ ...eventUpdate, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return updated;
  }

  async getPublishedEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.status, "published")).orderBy(desc(events.eventDate));
  }

  async getPendingEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.status, "pending_approval")).orderBy(desc(events.createdAt));
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.creatorId, userId)).orderBy(desc(events.createdAt));
  }

  async approveEvent(id: number): Promise<Event | undefined> {
    const [updated] = await db.update(events).set({ status: "published", updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return updated;
  }

  async denyEvent(id: number, reason: string): Promise<Event | undefined> {
    const [updated] = await db.update(events).set({ status: "denied", denialReason: reason, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async createGroup(group: InsertGroup, creatorId: string, createdByAdmin: boolean): Promise<Group> {
    const status = createdByAdmin ? "published" : "pending_approval";
    const [created] = await db.insert(groups).values({
      ...group,
      creatorId,
      createdByAdmin,
      status,
    }).returning();
    return created;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async updateGroup(id: number, groupUpdate: Partial<InsertGroup>): Promise<Group | undefined> {
    const [updated] = await db.update(groups).set(groupUpdate).where(eq(groups.id, id)).returning();
    return updated;
  }

  async getPublishedGroups(): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.status, "published")).orderBy(desc(groups.createdAt));
  }

  async getPendingGroups(): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.status, "pending_approval")).orderBy(desc(groups.createdAt));
  }

  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(desc(groups.createdAt));
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.creatorId, userId)).orderBy(desc(groups.createdAt));
  }

  async approveGroup(id: number): Promise<Group | undefined> {
    const [updated] = await db.update(groups).set({ status: "published" }).where(eq(groups.id, id)).returning();
    return updated;
  }

  async denyGroup(id: number, reason: string): Promise<Group | undefined> {
    const [updated] = await db.update(groups).set({ status: "denied", denialReason: reason }).where(eq(groups.id, id)).returning();
    return updated;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  // === Feedback ===

  async createFeedback(feedbackData: InsertFeedback, userId?: string): Promise<Feedback> {
    const [created] = await db.insert(feedback).values({
      ...feedbackData,
      userId: userId || null,
    }).returning();
    return created;
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async deleteFeedback(id: number): Promise<void> {
    await db.delete(feedback).where(eq(feedback.id, id));
  }

  // === Custom Options ===

  async getCustomOptions(): Promise<CustomOption[]> {
    return await db.select().from(customOptions).orderBy(customOptions.category, customOptions.originalValue);
  }

  async getCustomOptionsByCategory(category: string): Promise<CustomOption[]> {
    return await db.select().from(customOptions).where(eq(customOptions.category, category as any));
  }

  async updateCustomOption(id: number, update: { labelEn?: string; labelJa?: string }): Promise<CustomOption | undefined> {
    const [updated] = await db.update(customOptions).set(update).where(eq(customOptions.id, id)).returning();
    return updated;
  }

  async deleteCustomOption(id: number): Promise<void> {
    await db.delete(customOptions).where(eq(customOptions.id, id));
  }

  async registerCustomValues(category: OptionCategory, values: string[], userId: string): Promise<void> {
    for (const value of values) {
      if (isPredefinedKey(category, value)) continue;
      // Check if already registered
      const [existing] = await db.select().from(customOptions)
        .where(and(eq(customOptions.category, category), eq(customOptions.originalValue, value)));
      if (existing) continue;
      await db.insert(customOptions).values({
        category,
        originalValue: value,
        labelEn: value,
        labelJa: value,
        createdBy: userId,
      });
    }
  }
}

export const storage = new DatabaseStorage();
