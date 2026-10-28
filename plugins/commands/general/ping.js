export default function ({ message }) {
    const timeStart = Date.now();
    return message.reply(`Pong! ${Date.now() - timeStart}ms`);
}
