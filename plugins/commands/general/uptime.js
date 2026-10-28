const config = {
    name: "uptime",
    aliases: ["upt"],
    credits: "CD'sFusion Team"
}

function onCall({ message }) {
    let uptime = global.msToHMS(process.uptime() * 1000);
    message.reply(uptime);
}


export default {
    config,
    onCall
}
