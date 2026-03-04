import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, mkdir, cp, writeFile } from "fs/promises";

async function buildVercel() {
  // Clean previous Vercel output
  await rm(".vercel/output", { recursive: true, force: true });

  // 1. Build Vite client → dist/public/
  console.log("Building client...");
  await viteBuild();

  // 2. Create .vercel/output directory structure
  await mkdir(".vercel/output/static", { recursive: true });
  await mkdir(".vercel/output/functions/api.func", { recursive: true });

  // 3. Copy client build to static output
  console.log("Copying static files...");
  await cp("dist/public", ".vercel/output/static", { recursive: true });

  // 4. Bundle the Express server + all npm deps into one self-contained CJS file.
  //    --define flags eliminate dead code: the Vite dev middleware and
  //    httpServer.listen() branches are tree-shaken out.
  console.log("Bundling API function...");
  await esbuild({
    entryPoints: ["api/_handler.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    // Only exclude native addons that cannot be statically bundled
    external: ["pg-native", "bufferutil", "utf-8-validate", "fsevents"],
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.VERCEL": '"1"',
    },
    outfile: ".vercel/output/functions/api.func/index.cjs",
    minify: true,
    logLevel: "info",
  });

  // 5. Serverless function metadata
  await writeFile(
    ".vercel/output/functions/api.func/.vc-config.json",
    JSON.stringify(
      {
        runtime: "nodejs20.x",
        handler: "index.cjs",
        launcherType: "Nodejs",
        shouldAddHelpers: true,
      },
      null,
      2,
    ),
  );

  // 6. Output routing: API + auth paths → function, everything else → SPA
  await writeFile(
    ".vercel/output/config.json",
    JSON.stringify(
      {
        version: 3,
        routes: [
          { src: "^/api(/.*)?$", dest: "/api" },
          { src: "^/login$",    dest: "/api" },
          { src: "^/logout$",   dest: "/api" },
          { src: "^/callback$", dest: "/api" },
          // Long-lived cache headers for hashed Vite assets
          {
            src: "^/assets/(.+)$",
            headers: { "cache-control": "public, max-age=31536000, immutable" },
            continue: true,
          },
          // Serve files that exist in static/
          { handle: "filesystem" },
          // SPA fallback
          { src: "/(.*)", dest: "/index.html" },
        ],
      },
      null,
      2,
    ),
  );

  console.log("Vercel build complete!");
}

buildVercel().catch((err) => {
  console.error(err);
  process.exit(1);
});
