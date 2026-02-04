import { z } from 'zod';
import { insertProfileSchema, insertMatchSchema, insertEventSchema, profiles, matches, notifications, events } from './schema';

export const profileInputSchema = insertProfileSchema.extend({
  alias: z.string().min(1, "Alias is required").min(2, "Alias must be at least 2 characters"),
  profession: z.array(z.string()).min(1, "Select at least one profession"),
  goal: z.array(z.string()).min(1, "Select at least one goal"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  hobbies: z.array(z.string()).min(1, "Select at least one hobby"),
});

export const adminProfileUpdateSchema = z.object({
  alias: z.string().min(2).optional(),
  bio: z.string().optional(),
  ageRange: z.string().optional(),
  isAdmin: z.boolean().optional(),
  contactMethod: z.string().optional(),
  contactValue: z.string().optional(),
});

export const eventInputSchema = insertEventSchema.extend({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  eventTime: z.string().min(1, "Event time is required"),
  eventDate: z.coerce.date(),
});

export const eventDenySchema = z.object({
  reason: z.string().min(1, "Denial reason is required"),
});

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    upsert: {
      method: 'POST' as const,
      path: '/api/profiles',
      input: profileInputSchema,
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:id',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  matches: {
    potential: {
      method: 'GET' as const,
      path: '/api/matches/potential',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()),
      },
    },
    suggested: { // New endpoint for suggested connections
      method: 'GET' as const,
      path: '/api/matches/suggested',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/matches',
      responses: {
        200: z.array(z.custom<typeof matches.$inferSelect & { partner: typeof profiles.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/matches',
      input: z.object({ receiverId: z.number() }),
      responses: {
        201: z.custom<typeof matches.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    respond: {
      method: 'PATCH' as const,
      path: '/api/matches/:id',
      input: z.object({ status: z.enum(['accepted', 'rejected']) }),
      responses: {
        200: z.custom<typeof matches.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      responses: {
        200: z.array(z.custom<typeof notifications.$inferSelect>()),
      },
    },
    markRead: {
      method: 'PATCH' as const,
      path: '/api/notifications/:id/read',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  events: {
    published: {
      method: 'GET' as const,
      path: '/api/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    myEvents: {
      method: 'GET' as const,
      path: '/api/events/mine',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/events/:id',
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: eventInputSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
