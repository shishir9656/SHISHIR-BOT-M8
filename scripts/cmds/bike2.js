const axios = require("axios");

const FOLDER_ID = "1MU8JPTt5qklFl1Rh4ORqx0fv0Erq0nBU";
const CACHE_TTL = 10 * 60 * 1000;

let cachedFiles = null;
let lastFetchTime = 0;

const apiClient = axios.create({
    timeout: 8000,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
});

module.exports.config = {
    name: "bike2",
    aliases: ["bk2", "bikecount"],
    version: "5.0.0",
    author: "𝔐𝔯.𝔎𝔦𝔫𝔤 ☠️✌🏼",
    role: 0,
    category: "media",
    guide: { en: "Use {p}bike, {p}bike sync to count files, or send '🔮' to get a random video." }
};

async function fetchFolderFiles(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedFiles && cachedFiles.length > 0 && (now - lastFetchTime < CACHE_TTL)) {
        return cachedFiles;
    }

    const response = await apiClient.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`).catch(async () => {
        return await apiClient.get(`https://docs.google.com/uc?export=list&id=${FOLDER_ID}`);
    });

    const htmlData = response.data;
    const files = [];
    const seen = new Set();

    const regexPrimary = /"([^"]+)"\s*,\s*\[\s*"([^"]+)"\s*,\s*([0-9]+)\s*,\s*"([^"]+)"/g;
    let match;
    while ((match = regexPrimary.exec(htmlData)) !== null) {
        if (!seen.has(match[1])) {
            seen.add(match[1]);
            files.push({ id: match[1], name: match[2].toLowerCase() });
        }
    }

    if (files.length === 0) {
        const regexFallback = /\/file\/d\/([a-zA-Z0-9_-]+)\/view/g;
        while ((match = regexFallback.exec(htmlData)) !== null) {
            if (!seen.has(match[1])) {
                seen.add(match[1]);
                files.push({ id: match[1], name: "video.mp4" });
            }
        }
    }

    if (files.length > 0) {
        cachedFiles = files;
        lastFetchTime = now;
    }

    return files;
}

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID()) return;
    if (event.body && event.body.trim() === "🏍") {
        return handleDriveMedia(api, event);
    }
};

module.exports.onStart = async ({ api, event, args }) => {
    if (args[0] && args[0].toLowerCase() === "sync") {
        return handleDriveSync(api, event);
    }
    return handleDriveMedia(api, event);
};

async function handleDriveSync(api, event) {
    const { threadID, messageID } = event;
    try {
        api.setMessageReaction("⏳", messageID, () => {}, true);

        const files = await fetchFolderFiles(true);
        let videoCount = 0;
        let pictureCount = 0;
        let musicCount = 0;

        for (let i = 0; i < files.length; i++) {
            const name = files[i].name;
            if (name.endsWith(".mp4") || name.endsWith(".mkv") || name.endsWith(".mov") || name.endsWith(".3gp")) {
                videoCount++;
            } else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif") || name.endsWith(".webp")) {
                pictureCount++;
            } else if (name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a") || name.endsWith(".ogg")) {
                musicCount++;
            }
        }

        api.setMessageReaction("✅", messageID, () => {}, true);

        const report = `📁 𝔖𝔶𝔫𝔠 𝔖𝔲𝔠𝔠𝔢𝔰𝔰𝔣𝔲𝔩!\n\n` +
                       `• 𝖳𝗈𝗍𝖺𝗅 𝖥𝗂𝗅𝖾𝗌: ${files.length}\n` +
                       `• 𝖵𝗂𝖽𝖾𝗈 / 𝖬𝖯𝖦 𝖥𝗂𝗅𝖾𝗌: ${videoCount}\n` +
                       `• 𝖯𝗂𝖼𝗍𝗎𝗋𝖾 𝖥𝗂𝗅𝖾𝗌: ${pictureCount}\n` +
                       `• 𝖬𝖯𝟥 / 𝖲𝗈𝗇𝗀 𝖥𝗂𝗅𝖾𝗌: ${musicCount}`;

        return api.sendMessage(report, threadID, messageID);
    } catch (err) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Sync failed!", threadID, messageID);
    }
}

async function handleDriveMedia(api, event) {
    const { threadID, messageID } = event;
    try {
        api.setMessageReaction("⏳", messageID, () => {}, true);

        const files = await fetchFolderFiles(false);
        if (!files || files.length === 0) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("📁 Couldn't find any file!", threadID, messageID);
        }

        const randomFile = files[Math.floor(Math.random() * files.length)];
        const downloadUrl = `https://docs.google.com/uc?export=download&id=${randomFile.id}`;

        api.setMessageReaction("👀", messageID, () => {}, true);

        const stream = await global.utils.getStreamFromURL(downloadUrl);

        api.sendMessage({
            body: `🎬 ━━━━ 𝙃𝙀𝙍𝙀 𝙄𝙎 𝙔𝙊𝙐𝙍 𝙑𝙄𝘿𝙀𝙊 ━━━━ 🎬 ✦ 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 ✦ 🦖💥`,
            attachment: [stream]
        }, threadID, (err) => {
            if (!err) {
                api.setMessageReaction("🔥", messageID, () => {}, true);
            } else {
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage("❌ Failed to send the video (file size might be too large)!", threadID, messageID);
            }
        }, messageID);
    } catch (err) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("❌ Failed to load video from Google Drive.", threadID, messageID);
    }
        }
