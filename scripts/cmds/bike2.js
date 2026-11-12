const axios = require("axios");

const FOLDER_ID = "1MU8JPTt5qklFl1Rh4ORqx0fv0Erq0nBU";
const CACHE_TTL = 10 * 60 * 1000;

// 🔮 শুধু এই emoji দিলে random video আসবে
const VIDEO_EMOJIS = ["🔮"];

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
    version: "5.0.1",
    author: "𝔐𝔯.𝔎𝔦𝔫𝔤 ☠️✌🏼",
    role: 0,
    category: "media",
    guide: {
        en: "Use {p}bike2, {p}bike2 sync, or send 🔮 to get a random video."
    }
};

async function fetchFolderFiles(forceRefresh = false) {
    const now = Date.now();

    if (
        !forceRefresh &&
        cachedFiles &&
        cachedFiles.length > 0 &&
        now - lastFetchTime < CACHE_TTL
    ) {
        return cachedFiles;
    }

    let response;

    try {
        response = await apiClient.get(
            `https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`
        );
    } catch (error) {
        response = await apiClient.get(
            `https://docs.google.com/uc?export=list&id=${FOLDER_ID}`
        );
    }

    const htmlData = response.data;
    const files = [];
    const seen = new Set();

    const regexPrimary =
        /"([^"]+)"\s*,\s*\[\s*"([^"]+)"\s*,\s*([0-9]+)\s*,\s*"([^"]+)"/g;

    let match;

    while ((match = regexPrimary.exec(htmlData)) !== null) {
        if (!seen.has(match[1])) {
            seen.add(match[1]);

            files.push({
                id: match[1],
                name: match[2].toLowerCase()
            });
        }
    }

    // Fallback method
    if (files.length === 0) {
        const regexFallback =
            /\/file\/d\/([a-zA-Z0-9_-]+)\/view/g;

        while ((match = regexFallback.exec(htmlData)) !== null) {
            if (!seen.has(match[1])) {
                seen.add(match[1]);

                files.push({
                    id: match[1],
                    name: "video.mp4"
                });
            }
        }
    }

    if (files.length > 0) {
        cachedFiles = files;
        lastFetchTime = now;
    }

    return files;
}

// 🔮 Emoji দিলে random video
module.exports.onChat = async ({ api, event }) => {
    try {
        if (event.senderID == api.getCurrentUserID()) return;

        const message = event.body?.trim();

        if (VIDEO_EMOJIS.includes(message)) {
            return await handleDriveMedia(api, event);
        }
    } catch (error) {
        console.error("Bike2 onChat error:", error);
    }
};

// Command ব্যবহার করলে
module.exports.onStart = async ({ api, event, args }) => {
    const command = args[0]?.toLowerCase();

    if (command === "sync") {
        return await handleDriveSync(api, event);
    }

    return await handleDriveMedia(api, event);
};

// 📁 Google Drive sync/count
async function handleDriveSync(api, event) {
    const { threadID, messageID } = event;

    try {
        api.setMessageReaction("⏳", messageID, () => {}, true);

        const files = await fetchFolderFiles(true);

        let videoCount = 0;
        let pictureCount = 0;
        let musicCount = 0;

        for (const file of files) {
            const name = file.name.toLowerCase();

            if (
                name.endsWith(".mp4") ||
                name.endsWith(".mkv") ||
                name.endsWith(".mov") ||
                name.endsWith(".3gp")
            ) {
                videoCount++;
            }
            else if (
                name.endsWith(".jpg") ||
                name.endsWith(".jpeg") ||
                name.endsWith(".png") ||
                name.endsWith(".gif") ||
                name.endsWith(".webp")
            ) {
                pictureCount++;
            }
            else if (
                name.endsWith(".mp3") ||
                name.endsWith(".wav") ||
                name.endsWith(".m4a") ||
                name.endsWith(".ogg")
            ) {
                musicCount++;
            }
        }

        api.setMessageReaction("✅", messageID, () => {}, true);

        const report =
            `📁 𝔖𝔶𝔫𝔠 𝔖𝔲𝔠𝔠𝔢𝔰𝔰𝔣𝔲𝔩!\n\n` +
            `• 𝖳𝗈𝗍𝖺𝗅 𝖥𝗂𝗅𝖾𝗌: ${files.length}\n` +
            `• 𝖵𝗂𝖽𝖾𝗈 𝖥𝗂𝗅𝖾𝗌: ${videoCount}\n` +
            `• 𝖯𝗂𝖼𝗍𝗎𝗋𝖾 𝖥𝗂𝗅𝖾𝗌: ${pictureCount}\n` +
            `• 𝖬𝗎𝗌𝗂𝖼 𝖥𝗂𝗅𝖾𝗌: ${musicCount}`;

        return api.sendMessage(report, threadID, messageID);

    } catch (error) {
        console.error("Sync error:", error);

        api.setMessageReaction("❌", messageID, () => {}, true);

        return api.sendMessage(
            "❌ Sync failed!",
            threadID,
            messageID
        );
    }
}

// 🎬 Random media send
async function handleDriveMedia(api, event) {
    const { threadID, messageID } = event;

    try {
        api.setMessageReaction("⏳", messageID, () => {}, true);

        const files = await fetchFolderFiles(false);

        if (!files || files.length === 0) {
            api.setMessageReaction("❌", messageID, () => {}, true);

            return api.sendMessage(
                "📁 Couldn't find any file!",
                threadID,
                messageID
            );
        }

        // শুধু video file filter
        const videoFiles = files.filter(file => {
            const name = file.name.toLowerCase();

            return (
                name.endsWith(".mp4") ||
                name.endsWith(".mkv") ||
                name.endsWith(".mov") ||
                name.endsWith(".3gp")
            );
        });

        const availableFiles =
            videoFiles.length > 0 ? videoFiles : files;

        const randomFile =
            availableFiles[
                Math.floor(Math.random() * availableFiles.length)
            ];

        const downloadUrl =
            `https://docs.google.com/uc?export=download&id=${randomFile.id}`;

        api.setMessageReaction("👀", messageID, () => {}, true);

        const stream =
            await global.utils.getStreamFromURL(downloadUrl);

        return api.sendMessage(
            {
                body:
                    "🎬 ━━━━ 𝙃𝙀𝙍𝙀 𝙄𝙎 𝙔𝙊𝙐𝙍 𝙑𝙄𝘿𝙀𝙊 ━━━━ 🎬\n\n" +
                    "✦ 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 ✦ 🦖💥",
                attachment: [stream]
            },
            threadID,
            (error) => {
                if (!error) {
                    api.setMessageReaction(
                        "🔥",
                        messageID,
                        () => {},
                        true
                    );
                } else {
                    console.error("Send video error:", error);

                    api.setMessageReaction(
                        "❌",
                        messageID,
                        () => {},
                        true
                    );

                    api.sendMessage(
                        "❌ Failed to send the video! File size might be too large.",
                        threadID,
                        messageID
                    );
                }
            },
            messageID
        );

    } catch (error) {
        console.error("Drive media error:", error);

        api.setMessageReaction(
            "❌",
            messageID,
            () => {},
            true
        );

        return api.sendMessage(
            "❌ Failed to load video from Google Drive.",
            threadID,
            messageID
        );
    }
}
