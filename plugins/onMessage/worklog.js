import moment from "moment-timezone";

const PHOTO_CAPTIONS = new Map([
    ["xin", "in"],
    ["xout", "out"],
    ["in", "in"],
    ["out", "out"],
]);
const MENU_ACTIONS = new Map([
    ["📸 clock in (send photo)", "in"],
    ["📸 clock out (send photo)", "out"],
]);

export default async function ({ message }) {
    const body = String(message.body || "").trim();
    const normalizedBody = body.toLowerCase();
    const action = PHOTO_CAPTIONS.get(normalizedBody) || MENU_ACTIONS.get(normalizedBody);
    if (!action || !message.isGroup) return;

    const photo = message.attachments?.find((attachment) => attachment.type === "photo");
    if (!photo) {
        await message.reply(
            `Telegram cannot open the camera from a bot button. Tap the paperclip/camera icon, ` +
                `take a photo, and send it with the caption ${action === "in" ? "In" : "Out"}.`
        );
        return;
    }

    try {
        const log = action === "in"
            ? global.worklogs.start({
                  userID: message.senderID,
                  threadID: message.threadID,
                  photoFileID: photo.fileID,
              })
            : global.worklogs.stop({
                  userID: message.senderID,
                  threadID: message.threadID,
                  photoFileID: photo.fileID,
              });

        if (action === "in") {
            const timezone = global.config.timezone || "UTC";
            const clockInTime = moment(log.inAt).tz(timezone).format("h:mm:ss A");
            await message.reply(`✅ Clock-in recorded at ${clockInTime}.`);
        } else {
            await message.reply(
                `✅ Clock-out recorded.\nWorked: ${global.worklogs.formatMinutes(log.totalMinutes)}\n` +
                `Regular: ${global.worklogs.formatMinutes(log.regularMinutes)}\n` +
                `Overtime: ${global.worklogs.formatMinutes(log.overtimeMinutes)}`
            );
        }
    } catch (error) {
        if (error.message.startsWith("Complete your profile")) {
            await message.reply(
                "Please create your employee profile first:\n" +
                "/profile set Name|Department|Position|Type|Unit|Rate\n" +
                "Example: /profile set John|IT|Technician|direct|hour|800"
            );
            return;
        }
        await message.reply(`Work-log error: ${error.message}`);
    }
}
