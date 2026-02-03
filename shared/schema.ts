import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  alias: text("alias").notNull(),
  bio: text("bio").notNull(),
  profession: text("profession").array().notNull(),
  hobbies: text("hobbies").array().notNull(),
  interests: text("interests").array().notNull(),
  goal: text("goal").array().notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  ageRange: text("age_range").notNull(),
  contactMethod: text("contact_method").notNull(),
  contactValue: text("contact_value").notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  initiatorId: integer("initiator_id").notNull().references(() => profiles.id),
  receiverId: integer("receiver_id").notNull().references(() => profiles.id),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
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
}));

export const matchesRelations = relations(matches, ({ one }) => ({
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
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true, status: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Notification = typeof notifications.$inferSelect;

export type MatchWithProfile = Match & {
  partnerProfile: Profile;
};
