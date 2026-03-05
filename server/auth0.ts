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

export function setupAuth0(app: Express) {
  const baseURL = getBaseURL();
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;
  const clientID = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const secret = process.env.SESSION_SECRET;

  // Log what we have so Vercel function logs show the actual config state.
  // Values are partially masked so they're safe to log.
  console.log("[auth0] baseURL:", baseURL);
  console.log("[auth0] issuerBaseURL:", issuerBaseURL ? issuerBaseURL.slice(0, 40) + "..." : "(NOT SET)");
  console.log("[auth0] clientID:", clientID ? clientID.slice(0, 8) + "..." : "(NOT SET)");
  console.log("[auth0] secret:", secret ? "(set)" : "(NOT SET)");
  console.log("[auth0] clientSecret:", clientSecret ? "(set)" : "(NOT SET)");

  // If required env vars are missing, register stub routes that return 503 with
  // a clear message rather than letting the process crash / hang on OIDC discovery.
  const missing = [
    !issuerBaseURL && "AUTH0_ISSUER_BASE_URL",
    !clientID && "AUTH0_CLIENT_ID",
    !clientSecret && "AUTH0_CLIENT_SECRET",
    !secret && "SESSION_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    console.error("[auth0] Missing required env vars:", missing.join(", "));
    const msg = `Auth not configured. Missing env vars: ${missing.join(", ")}`;
    app.get("/api/auth/user", (_req, res) => res.status(503).json({ message: msg }));
    app.get("/login", (_req, res) => res.status(503).send(msg));
    app.get("/logout", (_req, res) => res.status(503).send(msg));
    app.get("/callback", (_req, res) => res.status(503).send(msg));
    return;
  }

  // Validate that AUTH0_ISSUER_BASE_URL looks like a real HTTPS URL, not a placeholder.
  let parsedIssuer: URL;
  try {
    parsedIssuer = new URL(issuerBaseURL!);
  } catch {
    const msg = `AUTH0_ISSUER_BASE_URL is not a valid URL: "${issuerBaseURL}". Expected https://YOURTENANT.auth0.com`;
    console.error("[auth0]", msg);
    app.get("/api/auth/user", (_req, res) => res.status(503).json({ message: msg }));
    app.get("/login", (_req, res) => res.status(503).send(msg));
    app.get("/logout", (_req, res) => res.status(503).send(msg));
    app.get("/callback", (_req, res) => res.status(503).send(msg));
    return;
  }

  if (parsedIssuer.protocol !== "https:" && parsedIssuer.hostname !== "localhost") {
    const msg = `AUTH0_ISSUER_BASE_URL must use https://. Got: "${issuerBaseURL}"`;
    console.error("[auth0]", msg);
    app.get("/api/auth/user", (_req, res) => res.status(503).json({ message: msg }));
    app.get("/login", (_req, res) => res.status(503).send(msg));
    app.get("/logout", (_req, res) => res.status(503).send(msg));
    app.get("/callback", (_req, res) => res.status(503).send(msg));
    return;
  }

  const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL,
    clientID: clientID!,
    issuerBaseURL: issuerBaseURL!,
    secret: secret!,
    clientSecret: clientSecret!,
  };

  // Attach /login, /logout, and /callback routes as in the Auth0 Express quickstart.
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
