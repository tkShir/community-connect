import type { Express, Request } from "express";
import { auth } from "express-openid-connect";
import { authStorage } from "./replit_integrations/auth";

function getBaseURL(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }
  const port = parseInt(process.env.PORT || "5173", 10);
  return `http://localhost:${port}`;
}

function stubAuthRoutes(app: Express, msg: string) {
  app.get("/api/auth/user", (_req, res) => res.status(503).json({ message: msg }));
  app.get("/login", (_req, res) => res.status(503).send(msg));
  app.get("/logout", (_req, res) => res.status(503).send(msg));
  app.get("/callback", (_req, res) => res.status(503).send(msg));
}

export function setupAuth0(app: Express) {
  const baseURL = getBaseURL();
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;
  const clientID = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const secret = process.env.SESSION_SECRET;

  // Log FULL values (not truncated) so Vercel runtime logs show exactly what the
  // function sees. Secrets are masked; URLs are shown in full for diagnosis.
  console.log("[auth0] baseURL:", baseURL);
  console.log("[auth0] AUTH0_ISSUER_BASE_URL:", issuerBaseURL ?? "(NOT SET)");
  console.log("[auth0] AUTH0_CLIENT_ID:", clientID ? clientID.slice(0, 8) + "..." : "(NOT SET)");
  console.log("[auth0] SESSION_SECRET:", secret ? "(set)" : "(NOT SET)");
  console.log("[auth0] AUTH0_CLIENT_SECRET:", clientSecret ? "(set)" : "(NOT SET)");
  console.log("[auth0] DATABASE_URL:", process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:([^@]+)@/, ":***@")  // mask password
    : "(NOT SET)");

  // Check for missing required vars
  const missing = [
    !issuerBaseURL && "AUTH0_ISSUER_BASE_URL",
    !clientID && "AUTH0_CLIENT_ID",
    !clientSecret && "AUTH0_CLIENT_SECRET",
    !secret && "SESSION_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    const msg = `Auth not configured. Missing env vars: ${missing.join(", ")}`;
    console.error("[auth0]", msg);
    stubAuthRoutes(app, msg);
    return;
  }

  // Validate that AUTH0_ISSUER_BASE_URL is a proper URL
  let parsedIssuer: URL;
  try {
    parsedIssuer = new URL(issuerBaseURL!);
  } catch {
    const msg = `AUTH0_ISSUER_BASE_URL is not a valid URL: "${issuerBaseURL}". Expected https://YOURTENANT.auth0.com`;
    console.error("[auth0]", msg);
    stubAuthRoutes(app, msg);
    return;
  }

  // Reject placeholders and bare hostnames (must contain at least one dot)
  const hostname = parsedIssuer.hostname;
  const looksReal = hostname === "localhost" || hostname.includes(".");
  if (!looksReal || (parsedIssuer.protocol !== "https:" && hostname !== "localhost")) {
    const msg = `AUTH0_ISSUER_BASE_URL looks wrong: "${issuerBaseURL}". ` +
      `Expected https://YOURTENANT.auth0.com — no bare hostnames or http:// in production.`;
    console.error("[auth0]", msg);
    stubAuthRoutes(app, msg);
    return;
  }

  console.log("[auth0] Config looks valid; starting OIDC discovery against", hostname);

  const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL,
    clientID: clientID!,
    issuerBaseURL: issuerBaseURL!,
    secret: secret!,
    clientSecret: clientSecret!,
  };

  // Attach /login, /logout, and /callback routes
  app.use(auth(config));

  // Current authenticated user endpoint for the frontend.
  app.get("/api/auth/user", async (req: Request, res) => {
    const oidc = (req as any).oidc;

    if (!oidc?.isAuthenticated?.()) {
      return res.sendStatus(401);
    }

    const claims = oidc.user || {};
    const id = claims.sub as string | undefined;

    if (!id) {
      return res.status(500).json({ message: "Missing user sub claim" });
    }

    const email = (claims.email as string | undefined) ?? undefined;
    const firstName =
      (claims.given_name as string | undefined) ??
      (claims.name as string | undefined)?.split(" ")[0];
    const lastName = (claims.family_name as string | undefined) ?? undefined;
    const profileImageUrl = (claims.picture as string | undefined) ?? undefined;

    const user = await authStorage.upsertUser({
      id,
      email,
      firstName,
      lastName,
      profileImageUrl,
    });

    res.json(user);
  });
}
