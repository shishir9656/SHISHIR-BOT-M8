const axios = require("axios");

const FF_API = "https://eryxenx.agi.bd/api/ffinfo";

module.exports = {
  config: {
    name: "ffinfo",
    aliases: ["freefireinfo", "ffstats"],
    version: "2.4.0",
    author: "SHISHIR",
    role: 0,
    premium: false,
    description: "Stylish Free Fire Player Information",
    category: "game",
    guide: {
      en: "{p}ffinfo <uid>"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const uid = args[0];

      if (!uid) {
        return api.sendMessage(
          "⚠️ 𝐏𝐋𝐄𝐀𝐒𝐄 𝐏𝐑𝐎𝐕𝐈𝐃𝐄 𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄 𝐔𝐈𝐃\n\n📌 𝐄𝐗𝐀𝐌𝐏𝐋𝐄: ffinfo 3060644273\n\n⚡ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑",
          event.threadID,
          event.messageID
        );
      }

      const wait = await api.sendMessage(
        "⏳ 𝐅𝐄𝐓𝐂𝐇𝐈𝐍𝐆 𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄 𝐏𝐋𝐀𝐘𝐄𝐑 𝐃𝐀𝐓𝐀...\n\n♛ 𝐏𝐋𝐄𝐀𝐒𝐄 𝐖𝐀𝐈𝐓 ♛",
        event.threadID
      );

      const res = await axios.get(FF_API, {
        params: { uid, region: args[1] || undefined },
        timeout: 90000
      });

      const data = res.data;

      if (!data || !data.basicInfo) {
        return api.editMessage(
          "❌ 𝐅𝐀𝐈𝐋𝐄𝐃 𝐓𝐎 𝐅𝐄𝐓𝐂𝐇 𝐏𝐋𝐀𝐘𝐄𝐑 𝐃𝐀𝐓𝐀",
          wait.messageID
        );
      }

      const b = data.basicInfo;
      const clan = data.clanBasicInfo || {};
      const pet = data.petInfo || {};
      const social = data.socialInfo || {};
      const credit = data.creditScoreInfo || {};
      const cap = data.captainBasicInfo || {};

      const fmtDate = ts =>
        ts ? new Date(ts * 1000).toLocaleDateString("en-GB") : "N/A";

      const enumName = (v, prefix) =>
        v === null || v === undefined ? "N/A" : String(v).replace(prefix, "");

      const sig = social.signature || b.signature || "";

      const msg = `
╭━━━〔 🎮 𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄 𝐈𝐍𝐅𝐎 〕━━━╮

👤 𝐍𝐀𝐌𝐄: ${b.nickname || "N/A"}
🆔 𝐔𝐈𝐃: ${b.accountId || uid}
🌍 𝐑𝐄𝐆𝐈𝐎𝐍: ${b.region || "N/A"}
⭐ 𝐋𝐄𝐕𝐄𝐋: ${b.level ?? "N/A"}
❤️ 𝐋𝐈𝐊𝐄𝐒: ${b.liked ?? 0}
📈 𝐄𝐗𝐏: ${b.exp ?? 0}

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 🏆 𝐑𝐀𝐍𝐊 𝐈𝐍𝐅𝐎 〕━━╮

🏆 𝐑𝐀𝐍𝐊: ${b.rank ?? "N/A"}
🎯 𝐑𝐀𝐍𝐊 𝐏𝐎𝐈𝐍𝐓𝐒: ${b.rankingPoints ?? 0}
⚔️ 𝐂𝐒 𝐑𝐀𝐍𝐊: ${b.csRank ?? "N/A"}
🎮 𝐂𝐒 𝐏𝐎𝐈𝐍𝐓𝐒: ${b.csRankingPoints ?? 0}
👑 𝐌𝐀𝐗 𝐑𝐀𝐍𝐊: ${b.maxRank ?? "N/A"}
👑 𝐌𝐀𝐗 𝐂𝐒 𝐑𝐀𝐍𝐊: ${b.csMaxRank ?? "N/A"}
🎟️ 𝐄𝐋𝐈𝐓𝐄 𝐏𝐀𝐒𝐒: ${b.hasElitePass ? "✅ YES" : "❌ NO"}
🏅 𝐁𝐀𝐃𝐆𝐄𝐒: ${b.badgeCnt ?? 0}

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 📅 𝐀𝐂𝐂𝐎𝐔𝐍𝐓 𝐈𝐍𝐅𝐎 〕━━╮

📅 𝐒𝐄𝐀𝐒𝐎𝐍: ${b.seasonId ?? "N/A"}
🛠️ 𝐑𝐄𝐋𝐄𝐀𝐒𝐄: ${b.releaseVersion || "N/A"}
👁️ 𝐁𝐑 𝐑𝐀𝐍𝐊 𝐒𝐇𝐎𝐖: ${b.showBrRank ? "YES" : "NO"}
👁️ 𝐂𝐒 𝐑𝐀𝐍𝐊 𝐒𝐇𝐎𝐖: ${b.showCsRank ? "YES" : "NO"}
⏳ 𝐂𝐑𝐄𝐀𝐓𝐄𝐃: ${fmtDate(b.createAt)}
🕒 𝐋𝐀𝐒𝐓 𝐋𝐎𝐆𝐈𝐍: ${fmtDate(b.lastLoginAt)}

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 🛡️ 𝐆𝐔𝐈𝐋𝐃 𝐈𝐍𝐅𝐎 〕━━╮

🏷️ 𝐆𝐔𝐈𝐋𝐃: ${clan.clanName || "None"}
🆔 𝐆𝐔𝐈𝐋𝐃 𝐈𝐃: ${clan.clanId ?? "N/A"}
📊 𝐆𝐔𝐈𝐋𝐃 𝐋𝐄𝐕𝐄𝐋: ${clan.clanLevel ?? "N/A"}
👥 𝐌𝐄𝐌𝐁𝐄𝐑𝐒: ${clan.memberNum || 0}/${clan.capacity || 0}
👑 𝐋𝐄𝐀𝐃𝐄𝐑: ${cap.nickname || "N/A"}
⭐ 𝐋𝐄𝐀𝐃𝐄𝐑 𝐋𝐄𝐕𝐄𝐋: ${cap.level ?? "N/A"}

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 🐾 𝐏𝐄𝐓 𝐈𝐍𝐅𝐎 〕━━╮

🐶 𝐏𝐄𝐓 𝐍𝐀𝐌𝐄: ${pet.name || "None"}
📈 𝐏𝐄𝐓 𝐋𝐄𝐕𝐄𝐋: ${pet.level ?? "N/A"}
⭐ 𝐏𝐄𝐓 𝐄𝐗𝐏: ${pet.exp ?? 0}
🎨 𝐒𝐊𝐈𝐍 𝐈𝐃: ${pet.skinId ?? "N/A"}

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 🌐 𝐒𝐎𝐂𝐈𝐀𝐋 𝐈𝐍𝐅𝐎 〕━━╮

🚻 𝐆𝐄𝐍𝐃𝐄𝐑: ${enumName(social.gender, "Gender_")}
🗣️ 𝐋𝐀𝐍𝐆𝐔𝐀𝐆𝐄: ${enumName(social.language, "Language_")}
✍️ 𝐒𝐈𝐆𝐍𝐀𝐓𝐔𝐑𝐄:
${sig ? sig.replace(/\\[B\\]|\\[C\\]|\\[ff[0-9a-f]+]/gi, "") : "None"}

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 💯 𝐂𝐑𝐄𝐃𝐈𝐓 𝐒𝐂𝐎𝐑𝐄 〕━━╮

🛡️ 𝐒𝐂𝐎𝐑𝐄: ${credit.creditScore ?? "N/A"}
🎁 𝐑𝐄𝐖𝐀𝐑𝐃: ${enumName(credit.rewardState, "REWARD_STATE_")}
📆 𝐏𝐄𝐑𝐈𝐎𝐃 𝐄𝐍𝐃: ${fmtDate(credit.periodicSummaryEndTime)}

╰━━━━━━━━━━━━━━━━━━╯

       ♛ 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 ♛
  ⚡ 𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄 𝐈𝐍𝐅𝐎 𝐒𝐘𝐒𝐓𝐄𝐌 ⚡
`;

      await api.editMessage(msg, wait.messageID);

    } catch (err) {
      const reason = err.response?.data?.error || err.message;
      api.sendMessage(
        `❌ 𝐄𝐑𝐑𝐎𝐑: ${reason}\n\n⚡ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑`,
        event.threadID,
        event.messageID
      );
    }
  }
};
