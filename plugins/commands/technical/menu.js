const config = {
    name: "menu",
    aliases: ["start"],
    description: "Show the Telegram bot menu",
    usage: "",
    permissions: [0],
    cooldown: 3,
    credits: "CD'sFusion Team",
};

function createKeyboard() {
    return {
        keyboard: [
            [{ text: "📸 Clock in (send photo)" }, { text: "📸 Clock out (send photo)" }],
            [{ text: "/work today" }, { text: "/work week" }],
            [{ text: "/profile view" }, { text: "/profile set" }],
            [{ text: "/help" }],
        ],
        resize_keyboard: true,
        is_persistent: true,
        input_field_placeholder: "Choose an action",
    };
}

export default {
    config,
    onCall: ({ message }) =>
        message.reply({
            body:
                "CD'sFusion Team menu\n\n" +
                "Use the buttons below. For clock in/out, send a photo with the caption In or Out.",
            reply_markup: createKeyboard(),
        }),
};
