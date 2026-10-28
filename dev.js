import { existsSync } from "fs";

process.env.ENV_FILE = process.env.ENV_FILE || ".env.development";
if (!existsSync(process.env.ENV_FILE)) {
    throw new Error(
        `Development environment file not found: ${process.env.ENV_FILE}. Copy .env.development.example to it and set a separate Telegram bot token.`
    );
}

await import("./telegram.js");
