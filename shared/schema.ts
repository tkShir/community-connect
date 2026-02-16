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
  isAdmin: boolean("is_admin").default(false).notNull(),
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

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  location: text("location").notNull(),
  schedule: text("schedule"),
  googleFormLink: text("google_form_link"),
  status: text("status", { enum: ["draft", "pending_approval", "published", "denied"] }).default("draft").notNull(),
  denialReason: text("denial_reason"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  createdByAdmin: boolean("created_by_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customOptions = pgTable("custom_options", {
  id: serial("id").primaryKey(),
  category: text("category", { enum: ["profession", "interests", "hobbies"] }).notNull(),
  originalValue: text("original_value").notNull(),
  labelEn: text("label_en").notNull(),
  labelJa: text("label_ja").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  lineGroupLink: text("line_group_link"),
  status: text("status", { enum: ["pending_approval", "published", "denied"] }).default("pending_approval").notNull(),
  denialReason: text("denial_reason"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  createdByAdmin: boolean("created_by_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  category: text("category", { enum: ["board", "software", "other"] }).notNull(),
  message: text("message").notNull(),
  name: text("name"),
  email: text("email"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const officialContent = pgTable("official_content", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const eventsRelations = relations(events, ({ one }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
}));

export const customOptionsRelations = relations(customOptions, ({ one }) => ({
  creator: one(users, {
    fields: [customOptions.createdBy],
    references: [users.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true, status: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true, status: true, denialReason: true, creatorId: true, createdByAdmin: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true, status: true, denialReason: true, creatorId: true, createdByAdmin: true });
export const insertCustomOptionSchema = createInsertSchema(customOptions).omit({ id: true, createdAt: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true, userId: true });
export const insertOfficialContentSchema = createInsertSchema(officialContent).omit({ id: true, updatedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Notification = typeof notifications.$inferSelect;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type CustomOption = typeof customOptions.$inferSelect;
export type InsertCustomOption = z.infer<typeof insertCustomOptionSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type OfficialContent = typeof officialContent.$inferSelect;
export type InsertOfficialContent = z.infer<typeof insertOfficialContentSchema>;

export type MatchWithProfile = Match & {
  partner: Profile;
};
