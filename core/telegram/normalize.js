function getText(message) {
    return message?.text || message?.caption || "";
}

function getMentions(message) {
    const mentions = {};
    const text = getText(message);
    for (const entity of message?.entities || message?.caption_entities || []) {
        if (entity.type === "text_mention" && entity.user?.id) {
            mentions[String(entity.user.id)] = text.slice(entity.offset, entity.offset + entity.length);
        }
    }
    return mentions;
}

export function normalizeTelegramUpdate(ctx) {
    const message = ctx.message || ctx.editedMessage;
    if (!message?.from || !message.chat) return null;

    const body = getText(message);
    const threadID = String(message.chat.id);
    const senderID = String(message.from.id);
    const isGroup = message.chat.type === "group" || message.chat.type === "supergroup";
    const reply = message.reply_to_message;
    const args = body.trim() ? body.trim().split(/\s+/) : [];
    const photo = message.photo?.at(-1);
    const attachments = photo
        ? [{ type: "photo", fileID: photo.file_id, width: photo.width, height: photo.height }]
        : message.document
          ? [{ type: "file", fileID: message.document.file_id, filename: message.document.file_name }]
          : [];

    return {
        type: "message",
        threadID,
        messageID: String(message.message_id),
        senderID,
        userID: senderID,
        body,
        args,
        isGroup,
        mentions: getMentions(message),
        participantIDs: [],
        attachments,
        messageReply: reply
            ? {
                  messageID: String(reply.message_id),
                  senderID: String(reply.from?.id || ""),
                  body: getText(reply),
                  attachments: [],
              }
            : null,
    };
}
