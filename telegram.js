import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createServer } from "http";

const envFile = process.env.ENV_FILE || ".env";
loadEnv({ path: resolve(process.cwd(), envFile), override: true });

const port = Number.parseInt(process.env.PORT ?? "", 10);
if (Number.isInteger(port) && port > 0) {
    const healthServer = createServer((request, response) => {
        if (request.url === "/health" || request.url === "/") {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.end("OK");
            return;
        }

        response.writeHead(404);
        response.end("Not Found");
    });

    healthServer.on("error", (error) => {
        console.error("[HEALTH] Failed to start health server:", error);
        process.exit(1);
    });

    healthServer.listen(port, "0.0.0.0", () => {
        console.log(`[HEALTH] Listening on port ${port}`);
    });

    const closeHealthServer = () => {
        healthServer.close(() => process.exit(0));
    };
    process.once("SIGTERM", closeHealthServer);
    process.once("SIGINT", closeHealthServer);
}

await import("./core/telegram/build.js");
