const fs = require("fs-extra");
const { Buffer } = require("buffer");

// --- Credit Lock ---
const _c = "clggWCBBYmR1bGxhaA==";  //don't change my cradite it's rX project
function decodeMsg(encoded) {
  return Buffer.from(encoded, "base64").toString("utf8");
}

function checkCredits(event, api) {
  if (module.exports.config.credits !== decodeMsg(_c)) {
    module.exports.config.credits = decodeMsg(_c);
    const warn = "Q3JlZGl0IGhhcyBiZWVuIG1vZGlmaWVkLiBJdCBoYXMgYmVlbiByZXNldCB0byByWCBBYmR1bGxhaC4=";
    api.sendMessage(decodeMsg(warn), event.threadID);
  }
}

// --- Config ---
const configPath = __dirname + "/actionConfig.json";
const defaultConfig = {
  enabled: false,
  targetGroupId: "61595106187744",
  bannedWords: ["matherxhod", "bokaxhuda", "madarchod", "chuda", "xhudi", "sawya", "bessa", "khanki", "tor mayek", "mgi", "abal", "চুদি", "মাগি", "খানকি", "মাদারচোদ"]
};

if (!fs.existsSync(configPath)) fs.writeJsonSync(configPath, defaultConfig, { spaces: 2 });
const loadConfig = () => fs.readJsonSync(configPath);
const saveConfig = data => fs.writeJsonSync(configPath, data, { spaces: 2 });

module.exports.config = {
  name: "actionGuard",
  version: "2.1",
  credits: decodeMsg(_c),  //rX Abdullah don't change my cradite 
  hasPermission: 0,
  cooldowns: 5,
  commandCategory: "System",
  usePrefix: true,
  description: "Detects banned words & adds offender to target group",
  usage: "!action on / !action off"
};

// --- Main Command ---
module.exports.run = async function ({ api, event, args }) {
  checkCredits(event, api);
  const cfg = loadConfig();
  const { threadID } = event;

  if (!args[0]) {
    api.sendMessage("ব্যবহার: !action on / !action off", threadID);
    return;
  }

  if (args[0].toLowerCase() === "on") {
    cfg.enabled = true;
    saveConfig(cfg);
    api.sendMessage("✅ Action চালু হয়েছে", threadID);
  } else if (args[0].toLowerCase() === "off") {
    cfg.enabled = false;
    saveConfig(cfg);
    api.sendMessage("⛔ Action বন্ধ হয়েছে", threadID);
  } else {
    api.sendMessage("❌ ভুল কমান্ড। ব্যবহার করুন: !action on / !action off", threadID);
  }
};

// --- Auto Event ---
module.exports.handleEvent = async function ({ api, event }) {
  checkCredits(event, api);
  const cfg = loadConfig();
  if (!cfg.enabled) return;

  const { body, senderID, threadID } = event;
  if (!body) return;
  const text = body.toLowerCase();

  const found = cfg.bannedWords.some(w => new RegExp(`\\b${w}\\b`, "i").test(text));
  if (!found) return;

  try {
    const info = await new Promise(res =>
      api.getUserInfo(senderID, (err, data) => res(data ? data[senderID] : null))
    );
    const name = info?.name || "User";
    const mention = [{ id: senderID, tag: name }];

    try {
      const threadInfo = await api.getThreadInfo(cfg.targetGroupId);
      const participantIds = threadInfo.participantIDs || [];

      if (participantIds.includes(senderID)) {
        api.sendMessage({ body: `⚠️ ${name} আগে থেকেই টার্গেট গ্রুপে আছে।`, mentions: mention }, threadID);
      } else {
        await api.addUserToGroup(senderID, cfg.targetGroupId);
        api.sendMessage({ body: `🎀 <\n ${name} 𝐀𝐝𝐝𝐞𝐝 𝐜𝐡𝐚𝐜𝐤 𝐢𝐧𝐛𝐨𝐱 𝐨𝐫 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐫𝐢𝐪𝐮𝐞𝐬𝐭।।`, mentions: mention }, threadID);
        api.sendMessage({ body: `🎀 <\n ${name} গালি দেওয়ার জন্য এই গ্রুপে যুক্ত করা হয়েছে।`, mentions: mention }, cfg.targetGroupId);
      }
    } catch (err) {
      api.sendMessage(
        { body: `🎀 <\n ${name} 𝐮𝐟𝐟𝐬 𝐩𝐚𝐫𝐥𝐚𝐦 𝐧𝐚`, mentions: mention },
        threadID
      );
    }
  } catch (err) {
    console.error("Error in actionGuard:", err);
  }
};
