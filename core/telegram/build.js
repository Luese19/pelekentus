import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { Bot } from "grammy";

import initializeVar from "../var/_init.js";
import { loadPlugins } from "../var/modules/loader.js";
import { XDatabase } from "../handlers/database.js";
import { Assets } from "../handlers/assets.js";
import handleEvents from "../handlers/events.js";
import logger from "../var/modules/logger.js";
import { TelegramApi } from "./api.js";
import { normalizeTelegramUpdate } from "./normalize.js";
import { createWorklogStore } from "./worklog.js";

loadEnv({ path: resolve(process.cwd(), ".env"), override: true });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error(
        "TELEGRAM_BOT_TOKEN is missing. Copy .env.example to .env, set the token from @BotFather, and run npm run startTelegram again."
    );
}

await initializeVar();

const bot = new Bot(token);
await bot.init();
const telegramApi = new TelegramApi(bot);
global.api = telegramApi;
global.botID = telegramApi.getCurrentUserID();

const xDatabase = new XDatabase(telegramApi, global.config.DATABASE);
await xDatabase.init();
global.worklogs = createWorklogStore();
new Assets();
await loadPlugins(xDatabase);

global.controllers = xDatabase.controllers;
const { handleMessage, handleReply, handleCommand } = await handleEvents();

bot.on("message", async (ctx) => {
    telegramApi.setContext(ctx);
    const event = normalizeTelegramUpdate(ctx);
    if (!event) return;
    if (global.maintain && !global.config.MODERATORS.some((id) => String(id) === event.senderID)) return;

    try {
        await xDatabase.controllers.Users.get(event.senderID);
        if (event.isGroup) await xDatabase.controllers.Threads.get(event.threadID);
        await handleMessage(event, xDatabase);
        await handleReply(event, xDatabase);
        await handleCommand(event, xDatabase);
        await xDatabase.update();
    } catch (error) {
        logger.error(error);
        await ctx.reply(global.getLang("handlers.default.error", { error: String(error.message || error) }));
    }
});

bot.catch((error) => logger.error(error));

logger.system(`Telegram bot started as ${global.config.NAME || "CD'sFUSION Team"}`);
if (process.env.TELEGRAM_WEBHOOK_URL) {
    await bot.api.setWebhook(process.env.TELEGRAM_WEBHOOK_URL);
} else {
    await bot.start();
}
