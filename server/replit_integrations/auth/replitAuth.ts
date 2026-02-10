import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, Request, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

function getIssuerUrl(): string {
  return (
    process.env.AUTH0_ISSUER_BASE_URL ??
    process.env.ISSUER_URL ??
    "https://replit.com/oidc"
  );
}

function getClientId(): string {
  const clientId =
    process.env.AUTH0_CLIENT_ID ??
    process.env.CLIENT_ID;

  if (!clientId) {
    throw new Error("OIDC client ID is not configured");
  }

  return clientId;
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(new URL(getIssuerUrl()), getClientId());
  },
  { maxAge: 3600 * 1000 }
);

function getBaseUrl(req?: Request, domain?: string): string {
  // Prefer explicit BASE_URL (e.g. http://localhost:5173 in development)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }

  // Fallback to request info if available
  if (req) {
    const proto = req.protocol;
    const host = req.get("host");
    return `${proto}://${host}`;
  }

  // Last resort: construct from domain and https
  if (domain) {
    return `https://${domain}`;
  }

  throw new Error("Unable to determine base URL for auth callbacks");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // In development we run over http://localhost, so cookies
      // cannot be marked secure or they will not be sent.
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const id = claims.sub ?? claims["sub"];
  const email = claims.email ?? claims["email"];

  // Auth0 typically uses given_name / family_name / picture
  const firstName =
    claims.given_name ??
    claims["given_name"] ??
    claims["first_name"] ??
    undefined;

  const lastName =
    claims.family_name ??
    claims["family_name"] ??
    claims["last_name"] ??
    undefined;

  const profileImageUrl =
    claims.picture ??
    claims["picture"] ??
    claims["profile_image_url"] ??
    undefined;

  await authStorage.upsertUser({
    id,
    email,
    firstName,
    lastName,
    profileImageUrl,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string, req?: Request) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          // Use BASE_URL when provided (development: http://localhost:5173)
          // so Auth0 redirects to the correct origin and port.
          callbackURL: `${getBaseUrl(req, domain)}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname, req);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname, req);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const baseUrl = getBaseUrl(req, req.hostname);
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: getClientId(),
          post_logout_redirect_uri: baseUrl,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
