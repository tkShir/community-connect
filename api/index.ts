import "dotenv/config";
import { app, initialize } from "../server/index";

// Initialize once at module load; all requests await this promise.
const initPromise = initialize();

export default async function handler(req: any, res: any): Promise<void> {
  await initPromise;
  app(req, res);
}
