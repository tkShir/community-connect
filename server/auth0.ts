import type { Express, Request, Response } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import * as crypto from "crypto";
import * as https from "https";
import * as http from "http";
import { authStorage } from "./replit_integrations/auth/storage";

const MemStore = MemoryStore(session);

// Extend session data type
declare module "express-session" {
  interface SessionData {
    user?: { id: string; email?: string; name?: string; picture?: string };
    oauthState?: string;
    returnTo?: string;
  }
}

function getBaseURL(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }
  const port = parseInt(process.env.PORT || "5173", 10);
  return `http://localhost:${port}`;
}

/** POST/GET using Node's built-in https/http — no external HTTP library needed. */
function fetchJSON(url: string, opts: { method?: string; headers?: Record<string, string>; body?: string }): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: opts.method || "GET",
      headers: opts.headers,
    };
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

export function isAuthenticated(req: Request): boolean {
  return !!(req.session?.user?.id);
}

export function getSessionUserId(req: Request): string {
  return req.session?.user?.id ?? "";
}

export function setupAuth0(app: Express) {
  const baseURL = getBaseURL();
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/+$/, "");
  const clientID = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const secret = process.env.SESSION_SECRET;

  // Startup diagnostics
  console.log("[auth0] baseURL:", baseURL);
  console.log("[auth0] AUTH0_ISSUER_BASE_URL:", issuerBaseURL ?? "(NOT SET)");
  console.log("[auth0] AUTH0_CLIENT_ID:", clientID ? clientID.slice(0, 8) + "..." : "(NOT SET)");
  console.log("[auth0] SESSION_SECRET:", secret ? "(set)" : "(NOT SET)");
  console.log("[auth0] AUTH0_CLIENT_SECRET:", clientSecret ? "(set)" : "(NOT SET)");
  console.log("[auth0] DATABASE_URL:", process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:([^@]+)@/, ":***@")
    : "(NOT SET)");

  const missing = [
    !issuerBaseURL && "AUTH0_ISSUER_BASE_URL",
    !clientID && "AUTH0_CLIENT_ID",
    !clientSecret && "AUTH0_CLIENT_SECRET",
    !secret && "SESSION_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    const msg = `Auth not configured. Missing env vars: ${missing.join(", ")}`;
    console.error("[auth0]", msg);
    app.get("/api/auth/user", (_req, res) => res.status(503).json({ message: msg }));
    app.get("/login", (_req, res) => res.status(503).send(msg));
    app.get("/logout", (_req, res) => res.status(503).send(msg));
    app.get("/callback", (_req, res) => res.status(503).send(msg));
    return;
  }

  // Validate issuer URL format (must have a proper hostname with a dot)
  let issuerHost: string;
  try {
    const parsed = new URL(issuerBaseURL!);
    issuerHost = parsed.hostname;
    if (!issuerHost.includes(".") && issuerHost !== "localhost") {
      throw new Error(`hostname "${issuerHost}" doesn't look like a real Auth0 tenant`);
    }
  } catch (err: any) {
    const msg = `AUTH0_ISSUER_BASE_URL is invalid: ${err.message}. Got: "${issuerBaseURL}"`;
    console.error("[auth0]", msg);
    app.get("/api/auth/user", (_req, res) => res.status(503).json({ message: msg }));
    app.get("/login", (_req, res) => res.status(503).send(msg));
    app.get("/logout", (_req, res) => res.status(503).send(msg));
    app.get("/callback", (_req, res) => res.status(503).send(msg));
    return;
  }

  console.log("[auth0] Issuer host validated:", issuerHost, "— no OIDC discovery needed");

  // Session middleware (stateful per-instance; for fully stateless use a JWT cookie store)
  app.use(
    session({
      secret: secret!,
      resave: false,
      saveUninitialized: false,
      store: new MemStore({ checkPeriod: 86_400_000 }), // prune expired every 24h
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  const redirectUri = `${baseURL}/callback`;

  // ── /login ───────────────────────────────────────────────────────────────
  app.get("/login", (req: Request, res: Response) => {
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    req.session.returnTo = (req.query.returnTo as string) || "/";
    const authUrl =
      `${issuerBaseURL}/authorize?` +
      new URLSearchParams({
        client_id: clientID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
        state,
      }).toString();
    res.redirect(authUrl);
  });

  // ── /callback ────────────────────────────────────────────────────────────
  app.get("/callback", async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query as Record<string, string>;

    if (error) {
      console.error("[auth0] callback error:", error, error_description);
      return res.status(400).send(`Auth0 error: ${error} — ${error_description || ""}`);
    }

    if (!code) {
      return res.status(400).send("Missing code in callback");
    }

    if (state !== req.session.oauthState) {
      console.error("[auth0] state mismatch");
      return res.status(400).send("State mismatch — possible CSRF");
    }

    try {
      // Exchange authorization code for tokens
      const tokenRes = await fetchJSON(`${issuerBaseURL}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientID!,
          client_secret: clientSecret!,
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (tokenRes.error) {
        console.error("[auth0] token exchange error:", tokenRes);
        return res.status(400).send(`Token error: ${tokenRes.error}`);
      }

      // Fetch user profile from Auth0 userinfo endpoint
      const userInfo = await fetchJSON(`${issuerBaseURL}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenRes.access_token}` },
      });

      if (!userInfo.sub) {
        return res.status(500).send("No sub in userinfo response");
      }

      req.session.user = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      };
      req.session.oauthState = undefined;

      const returnTo = req.session.returnTo || "/";
      req.session.returnTo = undefined;
      res.redirect(returnTo);
    } catch (err: any) {
      console.error("[auth0] callback exception:", err);
      res.status(500).send(`Internal error during callback: ${err.message}`);
    }
  });

  // ── /logout ──────────────────────────────────────────────────────────────
  app.get("/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      const logoutUrl =
        `${issuerBaseURL}/v2/logout?` +
        new URLSearchParams({
          client_id: clientID!,
          returnTo: baseURL,
        }).toString();
      res.redirect(logoutUrl);
    });
  });

  // ── /api/auth/user ────────────────────────────────────────────────────────
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) {
      return res.sendStatus(401);
    }

    try {
      const user = await authStorage.upsertUser({
        id: sessionUser.id,
        email: sessionUser.email,
        firstName: sessionUser.name?.split(" ")[0],
        profileImageUrl: sessionUser.picture,
      });
      res.json(user);
    } catch (err: any) {
      console.error("[auth0] upsertUser failed:", err);
      res.status(500).json({ message: "Failed to load user" });
    }
  });

  console.log("[auth0] Auth routes registered (no OIDC discovery, direct Auth0 endpoints)");
}
