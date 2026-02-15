import "dotenv/config";
import "./index";

const cs = process.env.DATABASE_URL;
console.log("DATABASE_URL raw:", JSON.stringify(cs));

try {
  const u = new URL(cs);
  console.log("parsed ok:", u.hostname, u.pathname);
} catch (e) {
  console.error("BAD DATABASE_URL:", e);
}