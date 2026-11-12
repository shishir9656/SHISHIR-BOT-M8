module.exports = {
  config: {
    name: "move",
    version: "1.1.0",
    author: "ARIYAN",
    countDown: 5,
    role: 2,
    description: "Source group এর members কে target group এ add করে",
    category: "group",
    guide: { en: "{pn} [target_tid]" }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      const targetTID = args[0];
      if (!targetTID) {
        return message.reply("⚠️ Target TID দিন!\nউদাহরণ: /move 1109764538632697");
      }

      const sourceTID = event.threadID;
      if (String(sourceTID) === String(targetTID)) {
        return message.reply("❌ Source ও Target TID একই।");
      }

      const source = await api.getThreadInfo(sourceTID);
      const target = await api.getThreadInfo(targetTID);

      const botID = String(api.getCurrentUserID());
      const alreadyIn = new Set((target.participantIDs || []).map(String));

      // bot নিজে ও target এ আগে থেকে থাকা সদস্য বাদ
      const toAdd = (source.participantIDs || [])
        .map(String)
        .filter(id => id !== botID && !alreadyIn.has(id));

      if (toAdd.length === 0) {
        return message.reply("ℹ️ Add করার মতো কেউ নেই।");
      }

      await message.reply(`⏳ ${toAdd.length} জনকে add করা হচ্ছে...`);

      const addOne = (uid) =>
        new Promise((resolve) => {
          api.addUserToGroup(uid, targetTID, (err) => resolve(err || null));
        });

      const sleep = (ms) => new Promise(r => setTimeout(r, ms));

      let ok = 0, fail = 0;
      const errors = [];

      for (const uid of toAdd) {
        const err = await addOne(uid);
        if (err) {
          fail++;
          if (errors.length < 3) errors.push(err.error || err.message || String(err));
        } else {
          ok++;
        }
        await sleep(2000); // rate limit এড়াতে
      }

      let report =
        "✅ কাজ শেষ!\n\n" +
        `• সফল: ${ok}\n• ব্যর্থ: ${fail}\n• মোট: ${toAdd.length}`;
      if (errors.length) report += "\n\nError নমুনা:\n" + errors.join("\n");

      return message.reply(report);
    } catch (err) {
      console.error("[move.js]", err);
      return message.reply("❌ Error: " + err.message);
    }
  }
};
