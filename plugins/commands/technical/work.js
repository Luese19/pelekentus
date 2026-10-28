import { join } from "path";
import { writeFileSync } from "fs";

const config = {
    name: "work",
    aliases: ["hours", "timelog"],
    description: "View work hours and export your work log",
    usage: "today|week|export",
    permissions: [0],
    cooldown: 3,
    credits: "CD'sFusion Team",
};

function format(minutes) {
    return global.worklogs.formatMinutes(minutes || 0);
}

function report(userID, range) {
    const summary = global.worklogs.summarize(userID, range);
    const open = global.worklogs.getOpen(userID);
    const pay = summary.logs.reduce((total, log) => total + (log.pay?.totalPay || 0), 0);
    return (
        `Work report (${range})\n` +
        `Sessions: ${summary.logs.length}\n` +
        `Total: ${format(summary.totalMinutes)}\n` +
        `Regular: ${format(summary.regularMinutes)}\n` +
        `Overtime: ${format(summary.overtimeMinutes)}\n` +
        `Pay: ${pay.toFixed(2)} ${global.config.WORK_CURRENCY || ""}\n` +
        `Active session: ${open ? "yes" : "no"}`
    );
}

async function onCall({ message, args }) {
    if (!global.worklogs) return message.reply("Work logging is only available in the Telegram runtime.");
    const action = args[0]?.toLowerCase() || "today";
    const range = action === "week" ? "week" : "today";

    if (action === "today" || action === "week") return message.reply(report(message.senderID, range));

    if (action === "export") {
        const exportRange = args[1]?.toLowerCase() === "all" ? "all" : "week";
        const path = join(global.cachePath, `worklog_${message.senderID}_${exportRange}_${Date.now()}.csv`);
        writeFileSync(path, global.worklogs.csv(message.senderID, exportRange), "utf8");
        try {
            return await message.reply({
                body: `Work-log CSV export (${exportRange})`,
                attachment: [global.reader(path)],
            });
        } finally {
            if (global.isExists(path, "file")) global.deleteFile(path);
        }
    }

    if (action === "employee") {
        const moderator = (global.config.MODERATORS || []).some((id) => String(id) === String(message.senderID));
        if (!moderator) return message.reply("Only moderators can export another employee's report.");
        const targetID = args[1];
        const exportRange = args[2]?.toLowerCase() === "all" ? "all" : "week";
        const path = join(global.cachePath, `worklog_${targetID}_${exportRange}_${Date.now()}.csv`);
        writeFileSync(path, global.worklogs.csv(targetID, exportRange), "utf8");
        try {
            return await message.reply({
                body: `Work-log CSV export for ${targetID} (${exportRange})`,
                attachment: [global.reader(path)],
            });
        } finally {
            if (global.isExists(path, "file")) global.deleteFile(path);
        }
    }

    return message.reply("Use /work today, /work week, /work export [week|all], or /work employee USER_ID [week|all].");
}

export default { config, onCall };
