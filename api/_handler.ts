// Catch unhandled promise rejections (e.g. from OIDC discovery failures)
// so they don't silently crash the serverless function process.
process.on("unhandledRejection", (reason) => {
  console.error("[handler] Unhandled rejection:", reason);
});

import { app, initialize } from "../server/index";

// Initialize once at module load; all requests await this promise.
const initPromise = initialize();

export default async function handler(req: any, res: any): Promise<void> {
  await initPromise;
  app(req, res);
}
