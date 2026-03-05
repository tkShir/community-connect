import type { Express, Request, Response } from "express";
import * as crypto from "crypto";
import * as https from "https";
import * as http from "http";
import { authStorage } from "./replit_integrations/auth/storage";

// ── Types ────────────────────────────────────────────────────────────────────

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

// ── Cookie names ─────────────────────────────────────────────────────────────

const SESSION_COOKIE = "app_session";  // signed user session (7 days)
const OAUTH_STATE_COOKIE = "oauth_st"; // plain state+returnTo (5 min, deleted after /callback)

// ── Helpers: signed cookies ───────────────────────────────────────────────────
// Format: base64url(JSON) + "." + HMAC-SHA256(base64url(JSON))
// Stateless — no server-side storage, works across Vercel instances.

function signCookie(data: object, secret: string): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function unsignCookie<T = object>(value: string, secret: string): T | null {
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url"))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

// ── Helpers: cookie I/O ───────────────────────────────────────────────────────

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie ?? "";
  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

function setCookie(
  res: Response,
  name: string,
  value: string,
  maxAgeMs: number,
  secure: boolean,
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ];
  res.append("Set-Cookie", parts.join("; "));
}

function clearCookie(res: Response, name: string) {
  res.append("Set-Cookie", `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

// ── Helpers: HTTP ─────────────────────────────────────────────────────────────

function fetchJSON(
  url: string,
  opts: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  },
): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: opts.method ?? "GET",
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
    if (opts.timeoutMs) {
      req.setTimeout(opts.timeoutMs, () => {
        req.destroy(new Error(`Request to ${url} timed out after ${opts.timeoutMs}ms`));
      });
    }
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// ── Exports used by routes.ts ─────────────────────────────────────────────────

export function isAuthenticated(req: Request): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const cookies = parseCookies(req);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return false;
  return !!(unsignCookie<SessionUser>(raw, secret));
}

export function getSessionUserId(req: Request): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return "";
  const cookies = parseCookies(req);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return "";
  return unsignCookie<SessionUser>(raw, secret)?.id ?? "";
}

// ── setupAuth0 ────────────────────────────────────────────────────────────────

function getBaseURL(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");
  return `http://localhost:${process.env.PORT ?? "5173"}`;
}

export function setupAuth0(app: Express) {
  const baseURL = getBaseURL();
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/+$/, "");
  const clientID = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const secret = process.env.SESSION_SECRET;
  const isProd = process.env.NODE_ENV === "production";

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
    !clientID     && "AUTH0_CLIENT_ID",
    !clientSecret && "AUTH0_CLIENT_SECRET",
    !secret       && "SESSION_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    const msg = `Auth not configured. Missing: ${missing.join(", ")}`;
    console.error("[auth0]", msg);
    const stub = (_: Request, res: Response) => res.status(503).json({ message: msg });
    app.get("/api/auth/user", stub);
    app.get("/login",    (_, res) => res.status(503).send(msg));
    app.get("/logout",   (_, res) => res.status(503).send(msg));
    app.get("/callback", (_, res) => res.status(503).send(msg));
    return;
  }

  let issuerHost: string;
  try {
    issuerHost = new URL(issuerBaseURL!).hostname;
    if (!issuerHost.includes(".") && issuerHost !== "localhost") {
      throw new Error(`"${issuerHost}" doesn't look like a real Auth0 tenant`);
    }
  } catch (err: any) {
    const msg = `AUTH0_ISSUER_BASE_URL invalid: ${err.message} — got "${issuerBaseURL}"`;
    console.error("[auth0]", msg);
    const stub = (_: Request, res: Response) => res.status(503).json({ message: msg });
    app.get("/api/auth/user", stub);
    app.get("/login",    (_, res) => res.status(503).send(msg));
    app.get("/logout",   (_, res) => res.status(503).send(msg));
    app.get("/callback", (_, res) => res.status(503).send(msg));
    return;
  }

  console.log("[auth0] issuer host:", issuerHost, "— stateless cookie sessions, no OIDC discovery");

  const redirectUri = `${baseURL}/callback`;

  // ── GET /login ─────────────────────────────────────────────────────────────
  app.get("/login", (req: Request, res: Response) => {
    const state = crypto.randomBytes(16).toString("hex");
    const returnTo = (req.query.returnTo as string) || "/";

    // Store state + returnTo in a short-lived plain cookie.
    // No session store needed — the cookie travels with the browser.
    setCookie(res, OAUTH_STATE_COOKIE, JSON.stringify({ state, returnTo }), 5 * 60 * 1000, isProd);

    const authUrl = `${issuerBaseURL}/authorize?` + new URLSearchParams({
      client_id:     clientID!,
      redirect_uri:  redirectUri,
      response_type: "code",
      scope:         "openid profile email",
      state,
    }).toString();

    console.log("[auth0] /login → Auth0 authorize, state prefix:", state.slice(0, 8));
    res.redirect(authUrl);
  });

  // ── GET /callback ──────────────────────────────────────────────────────────
  app.get("/callback", async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query as Record<string, string>;
    console.log("[auth0] /callback — code:", code ? "present" : "MISSING", "state:", state?.slice(0, 8));

    if (error) {
      console.error("[auth0] Auth0 returned error:", error, error_description);
      return res.status(400).send(`Auth0 error: ${error} — ${error_description ?? ""}`);
    }
    if (!code) return res.status(400).send("Missing code in callback");

    // Read state + returnTo from cookie
    const cookies = parseCookies(req);
    const stateCookieRaw = cookies[OAUTH_STATE_COOKIE];
    clearCookie(res, OAUTH_STATE_COOKIE);

    let expectedState: string | undefined;
    let returnTo = "/";
    if (stateCookieRaw) {
      try {
        const parsed = JSON.parse(stateCookieRaw);
        expectedState = parsed.state;
        returnTo = parsed.returnTo ?? "/";
      } catch {
        console.error("[auth0] failed to parse state cookie");
      }
    } else {
      console.warn("[auth0] state cookie missing — cookies:", Object.keys(cookies));
    }

    if (!expectedState || state !== expectedState) {
      console.error("[auth0] state mismatch — expected:", expectedState?.slice(0, 8), "got:", state?.slice(0, 8));
      return res.status(400).send("State mismatch. Try logging in again.");
    }

    try {
      // Exchange code → tokens
      console.log("[auth0] exchanging code for tokens...");
      const tokenRes = await fetchJSON(`${issuerBaseURL}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type:    "authorization_code",
          client_id:     clientID!,
          client_secret: clientSecret!,
          code,
          redirect_uri:  redirectUri,
        }).toString(),
        timeoutMs: 10_000,
      });

      if (tokenRes.error) {
        console.error("[auth0] token exchange error:", tokenRes);
        return res.status(400).send(`Token error: ${tokenRes.error} — ${tokenRes.error_description ?? ""}`);
      }

      // Fetch user profile
      console.log("[auth0] fetching userinfo...");
      const userInfo = await fetchJSON(`${issuerBaseURL}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenRes.access_token}` },
        timeoutMs: 10_000,
      });

      if (!userInfo.sub) {
        console.error("[auth0] userinfo missing sub:", JSON.stringify(userInfo));
        return res.status(500).send("No sub in userinfo");
      }

      console.log("[auth0] authenticated sub:", userInfo.sub);

      const sessionUser: SessionUser = {
        id:      userInfo.sub,
        email:   userInfo.email,
        name:    userInfo.name,
        picture: userInfo.picture,
      };

      // Store user in a signed cookie — stateless, survives across instances
      setCookie(res, SESSION_COOKIE, signCookie(sessionUser, secret!), 7 * 24 * 60 * 60 * 1000, isProd);

      res.redirect(returnTo);
    } catch (err: any) {
      console.error("[auth0] callback exception:", err.message);
      res.status(500).send(`Auth callback failed: ${err.message}`);
    }
  });

  // ── GET /logout ────────────────────────────────────────────────────────────
  app.get("/logout", (_req: Request, res: Response) => {
    clearCookie(res, SESSION_COOKIE);
    const logoutUrl = `${issuerBaseURL}/v2/logout?` + new URLSearchParams({
      client_id: clientID!,
      returnTo:  baseURL,
    }).toString();
    res.redirect(logoutUrl);
  });

  // ── GET /api/auth/user ─────────────────────────────────────────────────────
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const cookies = parseCookies(req);
    const raw = cookies[SESSION_COOKIE];
    const sessionUser = raw ? unsignCookie<SessionUser>(raw, secret!) : null;

    if (!sessionUser?.id) return res.sendStatus(401);

    try {
      const user = await authStorage.upsertUser({
        id:              sessionUser.id,
        email:           sessionUser.email,
        firstName:       sessionUser.name?.split(" ")[0],
        profileImageUrl: sessionUser.picture,
      });
      res.json(user);
    } catch (err: any) {
      console.error("[auth0] upsertUser failed:", err.message);
      res.status(500).json({ message: "Failed to load user" });
    }
  });

  console.log("[auth0] routes registered (stateless signed-cookie sessions)");
}

// ── Auth0 Management API helpers ──────────────────────────────────────────────

/** Cache management token to avoid re-fetching on every request */
let mgmtTokenCache: { token: string; expiresAt: number } | null = null;

async function getManagementToken(): Promise<string> {
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/+$/, "");
  const clientID = process.env.AUTH0_M2M_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

  if (!issuerBaseURL || !clientID || !clientSecret) {
    throw new Error("Auth0 credentials not configured");
  }

  // Return cached token if still valid (with 60s buffer)
  if (mgmtTokenCache && mgmtTokenCache.expiresAt > Date.now() + 60_000) {
    return mgmtTokenCache.token;
  }

  const audience = `${issuerBaseURL}/api/v2/`;
  const tokenRes = await fetchJSON(`${issuerBaseURL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientID,
      client_secret: clientSecret,
      audience,
    }).toString(),
    timeoutMs: 10_000,
  });

  if (tokenRes.error || !tokenRes.access_token) {
    throw new Error(`Failed to get management token: ${tokenRes.error} — ${tokenRes.error_description ?? ""}`);
  }

  const expiresInMs = (tokenRes.expires_in ?? 86400) * 1000;
  mgmtTokenCache = { token: tokenRes.access_token, expiresAt: Date.now() + expiresInMs };
  return tokenRes.access_token;
}

export interface CreateAuth0UserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function createAuth0User(input: CreateAuth0UserInput): Promise<{ id: string; email: string }> {
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/+$/, "");
  if (!issuerBaseURL) throw new Error("AUTH0_ISSUER_BASE_URL not configured");

  const token = await getManagementToken();

  const body: Record<string, unknown> = {
    email: input.email,
    password: input.password,
    connection: "Username-Password-Authentication",
    email_verified: true,
  };
  if (input.firstName || input.lastName) {
    body.given_name = input.firstName ?? "";
    body.family_name = input.lastName ?? "";
    body.name = [input.firstName, input.lastName].filter(Boolean).join(" ");
  }

  const result = await fetchJSON(`${issuerBaseURL}/api/v2/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    timeoutMs: 15_000,
  });

  if (result.error || result.statusCode >= 400) {
    throw new Error(result.message ?? result.error ?? "Failed to create user in Auth0");
  }

  return { id: result.user_id, email: result.email };
}
