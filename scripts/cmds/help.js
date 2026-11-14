"use strict";

const fs = require("fs-extra");
const path = require("path");
const https = require("https");

// --- FONTS ---
const smallCapsMap = {
  a:"ᴀ", b:"ʙ", c:"ᴄ", d:"ᴅ", e:"ᴇ", f:"ꜰ",
  g:"ɢ", h:"ʜ", i:"ɪ", j:"ᴊ", k:"ᴋ", l:"ʟ",
  m:"ᴍ", n:"ɴ", o:"ᴏ", p:"ᴘ", q:"ǫ", r:"ʀ",
  s:"ꜱ", t:"ᴛ", u:"ᴜ", v:"ᴠ", w:"ᴡ", x:"x",
  y:"ʏ", z:"ᴢ"
};

const cmdFontMap = {
  ...smallCapsMap,
  0:"⁰", 1:"¹", 2:"²", 3:"³", 4:"⁴",
  5:"⁵", 6:"⁶", 7:"⁷", 8:"⁸", 9:"⁹"
};

const toSmallCaps = t =>
  String(t).toLowerCase().split("")
    .map(c => smallCapsMap[c] || c).join("");

const toCmdFont = t =>
  String(t).toLowerCase().split("")
    .map(c => cmdFontMap[c] || c).join("");

// --- VIDEO DOWNLOADER ---
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error("Video download failed"));
      }

      res.pipe(file);

      file.on("finish", () => {
        file.close(() => resolve(dest));
      });

      file.on("error", err => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on("error", err => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

module.exports = {
  config: {
    name: "help",
    aliases: ["menu"],
    version: "7.0",
    author: "𝐀𝐑𝐈𝐘𝐀𝐍",
    countDown: 3,
    role: 0,
    shortDescription: "Show all commands",
    longDescription: "Full command list with rotating video",
    category: "system",
    guide: "{pn}help [command]"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;
    const categories = {};

    const cleanCategoryName = text => {
      if (!text) return "OTHERS";

      return String(text)
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
    };

    // --- ORGANIZE COMMANDS ---
    for (const [, cmd] of allCommands) {
      if (!cmd?.config || cmd.config.name === "help") continue;

      const cat = cleanCategoryName(cmd.config.category);

      if (!categories[cat]) categories[cat] = [];

      categories[cat].push(cmd.config.name);
    }

    // --- VIDEO LIST ---
    const videoURLs = [
      "https://i.imgur.com/4PdoCGI.mp4",
      "https://i.imgur.com/dCPrqNd.mp4",
      "https://i.imgur.com/xhFp4Rc.mp4",
      "https://i.imgur.com/EXar1VY.mp4",
      "https://i.imgur.com/vWigmIF.mp4",
      "https://i.imgur.com/V6Au0p4.mp4",
      "https://i.imgur.com/qw9KVTY.mp4"
    ];

    // --- VIDEO CACHE ---
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const indexFile = path.join(cacheDir, "help_video_index.json");

    let index = 0;

    try {
      if (await fs.pathExists(indexFile)) {
        const data = await fs.readJson(indexFile);
        index = ((data.index || 0) + 1) % videoURLs.length;
      }

      await fs.writeJson(indexFile, { index });
    } catch (err) {
      console.log("Index Error:", err.message);
    }

    const videoPath = path.join(cacheDir, `help_video_${index}.mp4`);

    let attachment = null;

    try {
      if (!(await fs.pathExists(videoPath))) {
        await downloadFile(videoURLs[index], videoPath);
      }

      const stats = await fs.stat(videoPath);

      if (stats.size > 0) {
        attachment = fs.createReadStream(videoPath);
      }
    } catch (err) {
      console.log("Video Error:", err.message);
    }

    // --- SINGLE COMMAND INFO ---
    if (args[0]) {
      const query = String(args[0]).toLowerCase();

      const cmd =
        allCommands.get(query) ||
        [...allCommands.values()].find(c =>
          (c.config?.aliases || []).some(
            a => String(a).toLowerCase() === query
          )
        );

      if (!cmd || !cmd.config) {
        return message.reply(`❌ Command "${query}" not found.`);
      }

      const {
        name,
        version,
        category,
        shortDescription,
        longDescription,
        aliases,
        guide
      } = cmd.config;

      const desc =
        typeof longDescription === "string"
          ? longDescription
          : longDescription?.en ||
            shortDescription?.en ||
            shortDescription ||
            "No description";

      const usage = (
        typeof guide === "string"
          ? guide
          : guide?.en || `{pn}${name}`
      )
        .replace(/{pn}/g, prefix)
        .replace(/{name}/g, name);

      const detailMsg =
        `╭━━━━━━━━━━━━━━━╮\n` +
        `      🌸 COMMAND INFO 🌸\n` +
        `╰━━━━━━━━━━━━━━━╯\n\n` +
        `🎀 𝐍𝐚𝐦𝐞: ${toSmallCaps(name)}\n\n` +
        `🎀 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${toSmallCaps(category || "None")}\n\n` +
        `🎀 𝐃𝐞𝐬𝐜: ${desc}\n\n` +
        `🎀 𝐀𝐥𝐢𝐚𝐬𝐞𝐬: ${aliases?.length ? aliases.join(", ") : "None"}\n\n` +
        `🎀 𝐔𝐬𝐚𝐠𝐞: ${usage}\n\n` +
        `🎀 𝐀𝐮𝐭𝐡𝐨𝐫: 𝑺𝑯𝑰𝑺𝑯𝑰𝑹\n\n` +
        `🎀 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: ${version || "1.0"}\n\n` +
        `╰━━━━━━━━━━━━━━━╯`;

      return message.reply(
        attachment
          ? { body: detailMsg, attachment }
          : detailMsg
      );
    }

    // --- FULL MENU ---
    let msg =
      `┍━━━━━━━━━━━━━━━𒐬\n` +
      `┋ 𓊈🍓 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 BOT CMDS 🍓𓊉\n` +
      `┕━━━━━━━━━━━━━━━𒐬\n\n`;

    const sortedCategories = Object.keys(categories).sort();

    for (const cat of sortedCategories) {
      msg += `╭━━━𓊈 🍁 ${toSmallCaps(cat)} 𓊉\n`;

      const commands = categories[cat].sort();

      for (let i = 0; i < commands.length; i += 2) {
        const a = toCmdFont(commands[i]);
        const b = commands[i + 1]
          ? toCmdFont(commands[i + 1])
          : null;

        msg += b
          ? `┋⌬ ${a} ⌬ ${b}\n`
          : `┋⌬ ${a}\n`;
      }

      msg += `┕━━━━━━━━━━━━𒐬\n\n`;
    }

    msg +=
      `┍━━━━━━━━━━━━━━━𒐬\n` +
      ` 𓊈🎀𓊉 Total Commands: ${allCommands.size - 1}\n` +
      ` 𓊈🔑𓊉 Prefix: ${prefix}\n` +
      ` 𓊈👑𓊉 Owner:𝐒𝐇𝐈𝐒𝐇𝐈𝐑\n` +
      `┕━━━━━━━━━━━━━━━𒐬`;

    return message.reply(
      attachment
        ? { body: msg, attachment }
        : msg
    );
  }
};
