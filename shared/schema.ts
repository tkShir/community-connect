import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(), // Link to Replit Auth user
  alias: text("alias").notNull(), // Anonymous name
  bio: text("bio").notNull(),
  profession: text("profession").notNull(),
  hobbies: text("hobbies").array().notNull(),
  interests: text("interests").array().notNull(),
  goal: text("goal").notNull(), // e.g., "mentor", "mentee", "friend", "soccer"
  isPublic: boolean("is_public").default(true).notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  initiatorId: integer("initiator_id").notNull().references(() => profiles.id),
  receiverId: integer("receiver_id").notNull().references(() => profiles.id),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => profiles.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === RELATIONS ===

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  initiatedMatches: many(matches, { relationName: "initiator" }),
  receivedMatches: many(matches, { relationName: "receiver" }),
  sentMessages: many(messages),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  initiator: one(profiles, {
    fields: [matches.initiatorId],
    references: [profiles.id],
    relationName: "initiator",
  }),
  receiver: one(profiles, {
    fields: [matches.receiverId],
    references: [profiles.id],
    relationName: "receiver",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true, status: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type MatchWithProfile = Match & {
  partnerProfile: Profile;
};
