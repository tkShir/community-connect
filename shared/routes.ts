import { z } from 'zod';
import { insertProfileSchema, insertMatchSchema, insertMessageSchema, profiles, matches, messages } from './schema';

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
      input: insertProfileSchema,
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
    potential: { // Recommendations
      method: 'GET' as const,
      path: '/api/matches/potential',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()), // Returns profiles
      },
    },
    list: { // My matches
      method: 'GET' as const,
      path: '/api/matches',
      responses: {
        200: z.array(z.custom<typeof matches.$inferSelect & { partner: typeof profiles.$inferSelect }>()),
      },
    },
    create: { // Request a match
      method: 'POST' as const,
      path: '/api/matches',
      input: z.object({ receiverId: z.number() }),
      responses: {
        201: z.custom<typeof matches.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    respond: { // Accept/Reject
      method: 'PATCH' as const,
      path: '/api/matches/:id',
      input: z.object({ status: z.enum(['accepted', 'rejected']) }),
      responses: {
        200: z.custom<typeof matches.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/matches/:matchId/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/matches/:matchId/messages',
      input: z.object({ content: z.string() }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
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
