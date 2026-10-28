import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env"), override: true });

await import("./core/telegram/build.js");
