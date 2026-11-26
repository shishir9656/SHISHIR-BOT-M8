const fs = require("fs-extra");
const moment = require("moment-timezone");

const getStreamFromURL = global.utils.getStreamFromURL;

//━━━━━━ CATBOX GIF SYSTEM ━━━━━━//
const CATBOX_GIF = [
    "https://files.catbox.moe/32r4tz.tmp",
    "https://files.catbox.moe/rpjitz.tmp"
];

const getRandomGif = () =>
    CATBOX_GIF[Math.floor(Math.random() * CATBOX_GIF.length)];

const getGifAttachment = async () => {
    try {
        return await getStreamFromURL(getRandomGif());
    } catch (error) {
        console.error("CATBOX ERROR:", error);
        return undefined;
    }
};

module.exports = {
    config: {
        name: "prefix",
        version: "2.5",
        author: "SHISHIR",
        countDown: 5,
        role: 0,
        description: "Change and show bot prefix",
        category: "config"
    },

    langs: {
        en: {
            usage: "❌ 𝐔𝐒𝐀𝐆𝐄: prefix <newPrefix> | prefix reset | prefix <newPrefix> -g",

            reset: "✅ 𝐏𝐑𝐄𝐅𝐈𝐗 𝐑𝐄𝐒𝐄𝐓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋!\n🔰 𝐒𝐘𝐒𝐓𝐄𝐌 𝐏𝐑𝐄𝐅𝐈𝐗: %1",

            onlyAdmin: "⛔ 𝐎𝐍𝐋𝐘 𝐁𝐎𝐓 𝐀𝐃𝐌𝐈𝐍 𝐂𝐀𝐍 𝐂𝐇𝐀𝐍𝐆𝐄 𝐆𝐋𝐎𝐁𝐀𝐋 𝐏𝐑𝐄𝐅𝐈𝐗.",

            confirmGlobal: "╭━━━━━━━━━━━━━━━━━━╮\n┃ ⚡ 𝐆𝐋𝐎𝐁𝐀𝐋 𝐏𝐑𝐄𝐅𝐈𝐗\n┃ 𝐂𝐇𝐀𝐍𝐆𝐄 𝐑𝐄𝐐𝐔𝐄𝐒𝐓𝐄𝐃!\n┃\n┃ 👉 React to confirm ✅\n╰━━━━━━━━━━━━━━━━━━╯",

            confirmThisThread: "╭━━━━━━━━━━━━━━━━━━╮\n┃ 🔰 𝐆𝐑𝐎𝐔𝐏 𝐏𝐑𝐄𝐅𝐈𝐗\n┃ 𝐂𝐇𝐀𝐍𝐆𝐄 𝐑𝐄𝐐𝐔𝐄𝐒𝐓𝐄𝐃!\n┃\n┃ 👉 React to confirm ✅\n╰━━━━━━━━━━━━━━━━━━╯",

            successGlobal: "✅ 𝐆𝐋𝐎𝐁𝐀𝐋 𝐏𝐑𝐄𝐅𝐈𝐗 𝐂𝐇𝐀𝐍𝐆𝐄𝐃!\n⚡ 𝐍𝐄𝐖 𝐏𝐑𝐄𝐅𝐈𝐗: %1",

            successThisThread: "✅ 𝐆𝐑𝐎𝐔𝐏 𝐏𝐑𝐄𝐅𝐈𝐗 𝐂𝐇𝐀𝐍𝐆𝐄𝐃!\n⚡ 𝐍𝐄𝐖 𝐏𝐑𝐄𝐅𝐈𝐗: %1"
        }
    },

    onStart: async function ({
        message,
        role,
        args,
        commandName,
        event,
        threadsData,
        getLang
    }) {
        if (!args[0])
            return message.reply(getLang("usage"));

        if (args[0] === "reset") {
            await threadsData.set(event.threadID, null, "data.prefix");

            return message.reply(
                getLang("reset", global.GoatBot.config.prefix)
            );
        }

        const newPrefix = args[0];
        const setGlobal = args[1] === "-g";

        if (setGlobal && role < 2)
            return message.reply(getLang("onlyAdmin"));

        const confirmMsg = setGlobal
            ? getLang("confirmGlobal")
            : getLang("confirmThisThread");

        const attachment = await getGifAttachment();

        message.reply({
            body: confirmMsg,
            attachment: attachment || undefined
        }, (err, info) => {
            if (err || !info) return;

            global.GoatBot.onReaction.set(info.messageID, {
                commandName,
                author: event.senderID,
                newPrefix,
                setGlobal
            });
        });
    },

    onReaction: async function ({
        event,
        message,
        threadsData,
        Reaction,
        getLang
    }) {
        if (event.userID !== Reaction.author) return;

        global.GoatBot.onReaction.delete(event.messageID);

        if (Reaction.setGlobal) {
            global.GoatBot.config.prefix = Reaction.newPrefix;

            fs.writeFileSync(
                global.client.dirConfig,
                JSON.stringify(global.GoatBot.config, null, 2)
            );

            return message.reply(
                getLang("successGlobal", Reaction.newPrefix)
            );
        }

        await threadsData.set(
            event.threadID,
            Reaction.newPrefix,
            "data.prefix"
        );

        return message.reply(
            getLang("successThisThread", Reaction.newPrefix)
        );
    },

    //━━━━━━ NEW PREFIX PANEL ━━━━━━//
    onChat: async function ({
        event,
        message,
        threadsData
    }) {
        if (!event.body || event.body.trim().toLowerCase() !== "prefix")
            return;

        const systemPrefix = global.GoatBot.config.prefix;
        const groupPrefix = global.utils.getPrefix(event.threadID);

        const threadInfo = await threadsData.get(event.threadID);
        const groupName = threadInfo?.threadName || "Unknown Group";

        const now = moment().tz("Asia/Dhaka");
        const time = now.format("hh:mm A");
        const date = now.format("DD MMM YYYY");

        const owner =
            global.GoatBot.config.adminName || "𝑺𝑯𝑰𝑺𝑯𝑰𝑹";

        const uptime = moment
            .duration(process.uptime(), "seconds")
            .humanize();

        const attachment = await getGifAttachment();

        return message.reply({
            body:
`╭━━━〔 ⚜️ 𝐏𝐑𝐄𝐅𝐈𝐗 𝐏𝐀𝐍𝐄𝐋 ⚜️ 〕━━━╮
┃
┃ 🏷️ 𝙂𝙍𝙊𝙐𝙋  ➠ ${groupName}
┃ ⚙️ 𝙎𝙔𝙎𝙏𝙀𝙈 ➠ ${systemPrefix}
┃ 💬 𝘾𝙐𝙎𝙏𝙊𝙈 ➠ ${groupPrefix}
┃
┣━━━━━━━━━━━━━━━━━━━━━━
┃
┃ ⏰ 𝙏𝙄𝙈𝙀 ➠ ${time}
┃ 📅 𝘿𝘼𝙏𝙀 ➠ ${date}
┃ ⏳ 𝙐𝙋𝙏𝙄𝙈𝙀 ➠ ${uptime}
┃
┣━━━━━━━━━━━━━━━━━━━━━━
┃
┃ 👑 𝙊𝙒𝙉𝙀𝙍 ➠ ${owner}
┃ 🟢 𝙎𝙏𝘼𝙏𝙐𝙎 ➠ 𝙊𝙉𝙇𝙄𝙉𝙀
┃ 🚀 𝙎𝙔𝙎𝙏𝙀𝙈 ➠ 𝘼𝘾𝙏𝙄𝙑𝙀
┃
╰━━━〔 💠 𝘼𝙃𝙈𝙀𝘿’𝙕 𝙎𝙃𝙄’𝙎𝙃𝙄𝙍 💠 〕━━━╯`,
            attachment: attachment || undefined
        });
    }
};
