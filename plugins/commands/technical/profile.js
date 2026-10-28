const config = {
    name: "profile",
    aliases: ["employee"],
    description: "Manage your employee profile and rate",
    usage: "set|view|rate",
    permissions: [0],
    cooldown: 3,
    credits: "CD'sFusion Team",
};

function isModerator(userID) {
    return (global.config.MODERATORS || []).some((id) => String(id) && String(id) === String(userID));
}

function parseProfile(value) {
    const [name, department, position, employmentType, rateUnit, rate] = String(value || "")
        .split("|")
        .map((item) => item.trim());
    if ([name, department, position, employmentType, rateUnit, rate].some((item) => !item)) {
        throw new Error("Use: /profile set Name|Department|Position|Type|Unit|Rate");
    }
    return { name, department, position, employmentType: employmentType.toLowerCase(), rateUnit: rateUnit.toLowerCase(), rate: Number(rate) };
}

function format(profile) {
    return [
        `Name: ${profile.name}`,
        `Department: ${profile.department}`,
        `Position: ${profile.position}`,
        `Employment: ${profile.employmentType}`,
        `Rate: ${profile.rate} ${profile.rateUnit}`,
    ].join("\n");
}

async function onCall({ message, args }) {
    if (!global.worklogs) return message.reply("Employee profiles are only available in the Telegram runtime.");
    const action = args[0]?.toLowerCase();
    try {
        if (action === "set") {
            const profile = global.worklogs.setProfile(message.senderID, parseProfile(args.slice(1).join(" ")), {
                allowRate: isModerator(message.senderID),
            });
            return message.reply(`Profile saved.\n${format(profile)}`);
        }
        if (action === "view") {
            const targetID = args[1] || message.senderID;
            if (targetID !== message.senderID && !isModerator(message.senderID)) {
                return message.reply("Only moderators can view another employee's profile.");
            }
            const profile = global.worklogs.getProfile(targetID);
            return message.reply(profile ? format(profile) : "No employee profile found.");
        }
        if (action === "rate") {
            if (!isModerator(message.senderID)) return message.reply("Only moderators can change rates.");
            const targetID = args[1];
            const rateUnit = args[2]?.toLowerCase();
            const rate = Number(args[3]);
            const current = global.worklogs.getProfile(targetID);
            if (!current) return message.reply("Employee profile not found.");
            const profile = global.worklogs.setProfile(targetID, { ...current, rateUnit, rate });
            return message.reply(`Rate updated for ${profile.name}.\n${format(profile)}`);
        }
        return message.reply(
            "Profile commands:\n" +
            "/profile set Name|Department|Position|Type|Unit|Rate\n" +
            "/profile view\n" +
            "/profile rate USER_ID hour|day|fixed RATE (moderator)"
        );
    } catch (error) {
        return message.reply(`Profile error: ${error.message}`);
    }
}

export default { config, onCall };
