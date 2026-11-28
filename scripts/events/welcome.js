const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "3.0.0",
    author: "AhmeD’z SHI’SHIR",
    category: "events"
  },

  handleEvent: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const users = logMessageData?.addedParticipants || [];
    const botID = api.getCurrentUserID();

    if (!users.length) return;
    if (users.some(u => String(u.userFbId) === String(botID))) return;

    let groupName = "Our Group";
    let memberCount = 0;

    try {
      const info = await api.getThreadInfo(threadID);
      groupName = info.threadName || groupName;
      memberCount = info.participantIDs.length;
    } catch (e) {
      console.log("Thread info error:", e.message);
    }

    const cache = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cache);

    for (const user of users) {
      const uid = user.userFbId;
      const name = user.fullName || "New Member";
      const imagePath = path.join(cache, `welcome_${uid}_${Date.now()}.png`);

      try {
        const time = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka",
          dateStyle: "full",
          timeStyle: "short"
        });

        const apiURL =
          "https://welcome-v2.vercel.app/api/welcome-arafat" +
          `?name=${encodeURIComponent(name)}` +
          `&uid=${encodeURIComponent(uid)}` +
          `&threadname=${encodeURIComponent(groupName)}` +
          `&members=${memberCount}`;

        let attachment;

        try {
          const response = await axios.get(apiURL, {
            responseType: "arraybuffer",
            timeout: 45000
          });

          const buffer = Buffer.from(response.data);

          if (
            response.status === 200 &&
            buffer.length > 100 &&
            (response.headers["content-type"] || "").includes("image")
          ) {
            await fs.writeFile(imagePath, buffer);
            attachment = fs.createReadStream(imagePath);
          }
        } catch (imageError) {
          console.log("Welcome image error:", imageError.message);
        }

        const message =
          `╭━━━〔 𝐍𝐄𝐖 𝐀𝐑𝐑𝐈𝐕𝐀𝐋 〕━━━╮\n` +
          `┃ 👑 𝐇𝐄𝐋𝐋𝐎: ${name}\n` +
          `┃ 💎 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎\n` +
          `┃ ${groupName}\n` +
          `┃ 👥 𝐌𝐄𝐌𝐁𝐄𝐑: ${memberCount}\n` +
          `┃ 🎉 𝐄𝐍𝐉𝐎𝐘 𝐘𝐎𝐔𝐑 𝐒𝐓𝐀𝐘\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n` +
          `📅 ${time}\n` +
          `⚡ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑`;

        const msg = {
          body: message,
          mentions: [{ tag: name, id: uid }]
        };

        if (attachment) {
          msg.attachment = attachment;
        }

        await api.sendMessage(msg, threadID);

      } catch (error) {
        console.error("Welcome Error:", error);
      } finally {
        await fs.remove(imagePath).catch(() => {});
      }
    }
  }
};
