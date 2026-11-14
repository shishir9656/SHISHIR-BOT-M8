const fs = require("fs");
const path = require("path");

/* ================= CREATOR LOCK ================= */
const CREATOR_LOCK = (() => {
  const encoded = "QVJJRi1CQUJV"; 
  
  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
  name: "war",
  version: "1.6.0",
  hasPermssion: 2,
  credits: "ARIF-BABU",
  description: "MADE BY ARIF BABU 🤠🙃",
  commandCategory: "Admin",
  usages: "warg on [UID] / warg off",
  cooldowns: 5,
};

// 🔐 Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits cannot be changed.");
  module.exports.run = () => {};
  module.exports.handleEvent = () => {};
  return;
}

/* =======================
   📁 FOLDER SYSTEM
======================= */

const DATA_DIR = path.join(__dirname, "ARIF-BABU");
const DATA_FILE = path.join(DATA_DIR, "FYT_GROUP.txt");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load lines
function loadGaali() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "TERI MAA KO CHOD DUN!\n");
  }
  return fs.readFileSync(DATA_FILE, "utf8").split(/\r?\n/).filter(Boolean);
}

let gaaliLines = loadGaali();

/* =======================
   👑 ADMINS
======================= */

const botAdminUIDs = ["61595106187744"];

/* =======================
   ⚔️ WAR STATE (MEMORY ONLY)
======================= */

let warMode = false;
let targetUID = null;

/* =======================
   📩 HANDLE EVENT
======================= */

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, isGroup } = event;
  if (!isGroup) return;
  if (!warMode || senderID !== targetUID) return;

  const gaali = gaaliLines[Math.floor(Math.random() * gaaliLines.length)];

  let name = "User";
  try {
    const info = await api.getUserInfo(senderID);
    name = info[senderID]?.name || "User";
  } catch {}

  const finalMsg = `${name} ${gaali}`;
  return api.sendMessage(finalMsg, threadID);
};

/* =======================
   🧠 COMMAND
======================= */

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, isGroup } = event;

  if (!isGroup)
    return api.sendMessage("❌ Group only command.", threadID, messageID);

  if (!botAdminUIDs.includes(senderID))
    return api.sendMessage("❌ Admin only command.", threadID, messageID);

  if (args[0] === "on") {
    if (!args[1])
      return api.sendMessage(
        "⚠️ UID required.\nUsage: warg on [UID]",
        threadID,
        messageID
      );

    warMode = true;
    targetUID = args[1];

    return api.sendMessage(
      `✅ WAR MODE ON\n🎯 Target UID: ${targetUID}`,
      threadID,
      messageID
    );
  }

  if (args[0] === "off") {
    warMode = false;
    targetUID = null;
    return api.sendMessage("✅ WAR MODE OFF", threadID, messageID);
  }

  return api.sendMessage(
    "Usage:\nwarg on [UID]\nwarg off",
    threadID,
    messageID
  );
};
