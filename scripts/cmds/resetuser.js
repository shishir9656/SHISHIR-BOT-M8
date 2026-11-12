"use strict";

module.exports = {
  config: {
    name: "resetuser",
    aliases: ["resetbaluser"],
    version: "1.0.1",
    author: "Ariyan",
    countDown: 5,
    role: 2,
    shortDescription: "Reset one user's balance",
    longDescription: "Reset a user's money balance to 0.",
    category: "owner",

    guide: {
      en: "{pn} <userID>"
    }
  },

  onStart: async function ({ args, message, usersData }) {
    try {
      const uid = args[0];

      if (!uid) {
        return message.reply(
          "❌ User ID দিন।\n\n" +
          "Example:\n" +
          "resetuser 1000123456789"
        );
      }

      const user = await usersData.get(uid);

      if (!user) {
        return message.reply(
          "❌ এই User ID database-এ পাওয়া যায়নি।"
        );
      }

      await usersData.set(uid, {
        money: 0
      });

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "     🧹 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 𝐑𝐄𝐒𝐄𝐓\n" +
        "╰━━━━━━━━━━━━━━━━━━╯\n\n" +
        `👤 User: ${user.name || "Unknown"}\n` +
        `🆔 ID: ${uid}\n` +
        "💰 Balance: $0\n\n" +
        "✅ Successfully reset."
      );

    } catch (error) {
      console.error("[RESETUSER ERROR]", error);

      return message.reply(
        "❌ Balance reset করতে সমস্যা হয়েছে.\n\n" +
        `Error: ${error.message}`
      );
    }
  }
};
