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

  const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL,
    clientID: process.env.AUTH0_CLIENT_ID!,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
    secret: process.env.SESSION_SECRET!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
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

