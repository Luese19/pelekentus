import { InputFile } from "grammy";
import axios from "axios";
import { createWriteStream } from "fs";

function callbackResult(callback, error, result) {
    if (typeof callback === "function") callback(error, result);
    if (error) throw error;
    return result;
}

function asText(message) {
    if (typeof message === "string") return message;
    return message?.body || "";
}

export class TelegramApi {
    constructor(bot) {
        this.bot = bot;
        this.currentContext = null;
    }

    setContext(ctx) {
        this.currentContext = ctx;
    }

    getCurrentUserID() {
        return String(this.bot.botInfo.id);
    }

    getAvatarURL() {
        return "";
    }

    async getUserInfo(uid) {
        const chat = await this.bot.api.getChat(String(uid));
        const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
            chat.title ||
            chat.username ||
            String(uid);
        return {
            [String(uid)]: {
                id: String(uid),
                name,
                firstName: chat.first_name,
                lastName: chat.last_name,
                username: chat.username,
                thumbSrc: "",
            },
        };
    }

    async getThreadInfo(threadID) {
        const chat = await this.bot.api.getChat(String(threadID));
        const administrators = await this.bot.api.getChatAdministrators(String(threadID));
        return {
            threadID: String(threadID),
            name: chat.title || chat.username || `${chat.first_name || ""} ${chat.last_name || ""}`.trim(),
            threadName: chat.title,
            isGroup: chat.type === "group" || chat.type === "supergroup",
            adminIDs: administrators.map((admin) => String(admin.user.id)),
            participantIDs: [],
            userInfo: [],
        };
    }

    async sendMessage(message, threadID, callback, replyToMessageID = null) {
        try {
            if (typeof callback !== "function" && replyToMessageID === null) {
                replyToMessageID = callback;
                callback = null;
            }

            const options = replyToMessageID
                ? { reply_parameters: { message_id: Number(replyToMessageID) } }
                : {};
            if (message && typeof message === "object" && message.reply_markup) {
                options.reply_markup = message.reply_markup;
            }
            const attachments =
                message && typeof message === "object"
                    ? Array.isArray(message.attachment)
                        ? message.attachment
                        : message.attachment
                          ? [message.attachment]
                          : []
                    : [];
            const text = asText(message);
            let result;

            if (text.trim()) {
                result = await this.bot.api.sendMessage(String(threadID), text, options);
            }
            for (const attachment of attachments) {
                if (attachment) {
                    result = await this.bot.api.sendDocument(
                        String(threadID),
                        attachment.path ? new InputFile(attachment.path) : attachment,
                        options
                    );
                }
            }
            if (!result) throw new Error("Cannot send an empty Telegram message");

            return callbackResult(callback, null, {
                messageID: String(result.message_id),
                chatID: String(result.chat.id),
            });
        } catch (error) {
            return callbackResult(callback, error);
        }
    }

    async sendPhoto(buffer, threadID, replyToMessageID = null) {
        const options = replyToMessageID
            ? { reply_parameters: { message_id: Number(replyToMessageID) } }
            : {};
        return this.bot.api.sendPhoto(String(threadID), new InputFile(buffer, "equipment-qr.png"), options);
    }

    async downloadFileById(fileID, destination) {
        const file = await this.bot.api.getFile(fileID);
        if (!file.file_path) throw new Error("Telegram did not return a file path");
        const response = await axios.get(
            `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`,
            { responseType: "stream" }
        );
        await new Promise((resolve, reject) => {
            const output = createWriteStream(destination);
            response.data.pipe(output);
            output.on("finish", resolve);
            output.on("error", reject);
        });
        return destination;
    }

    async setMessageReaction(emoji, messageID, callback) {
        try {
            const ctx = this.currentContext;
            if (!ctx?.chat?.id) throw new Error("A Telegram chat context is required for reactions");
            const result = await this.bot.api.setMessageReaction(String(ctx.chat.id), Number(messageID), [
                { type: "emoji", emoji },
            ]);
            return callbackResult(callback, null, result);
        } catch (error) {
            if (error?.error_code === 400 && error?.description === "REACTION_INVALID") {
                console.warn(`[TELEGRAM] Reaction ${emoji} is not available in this chat`);
                return callbackResult(callback, null, null);
            }
            return callbackResult(callback, error);
        }
    }

    async unsendMessage(messageID) {
        const chatID = this.currentContext?.chat?.id;
        if (!chatID) throw new Error("A Telegram chat context is required to delete messages");
        return this.bot.api.deleteMessage(String(chatID), Number(messageID));
    }

    changeNickname(_name, _threadID, _userID, callback) {
        const error = new Error("Telegram does not support per-user nicknames");
        if (typeof callback === "function") callback(error);
    }
}
