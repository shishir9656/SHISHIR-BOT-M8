const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_CONFIG_URL = "https://raw.githubusercontent.com/xalmandevv/xalmanx210/refs/heads/main/apis.json";

const apiKey = () => `${module.exports?.config?.[String.fromCharCode(...[68,80,81,77,74,87].map(v => v ^ 37))]}-hub`;
const FALLBACK = () => `https://${module.exports?.config?.[String.fromCharCode(...[68,80,81,77,74,87].map(v => v ^ 37))]}-apis.vercel.app`;

let apiBaseUrl = null;
let apiConfigRequest = null;

async function getApiBaseUrl() {
  if (apiBaseUrl) return apiBaseUrl;

  if (!apiConfigRequest) {
    apiConfigRequest = axios
      .get(API_CONFIG_URL, { timeout: 15000 })
      .then(({ data }) => {
        const key = apiKey();
        const baseUrl = data?.[key];

        if (typeof baseUrl !== "string" || !baseUrl.trim()) {
          throw new Error(`Missing API key in apis.json: ${key}`);
        }

        apiBaseUrl = baseUrl.replace(/\/+$/, "");
        return apiBaseUrl;
      })
      .catch((error) => {
        const fallback = FALLBACK();
        if (fallback && fallback.trim()) {
          apiBaseUrl = fallback.replace(/\/+$/, "");
          return apiBaseUrl;
        }
        throw error;
      })
      .finally(() => {
        apiConfigRequest = null;
      });
  }

  return apiConfigRequest;
}

module.exports = {
  config: {
    name: "song",
    aliases: ["soundclocud", "sc"],
    version: "6.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search and play a song" },
    longDescription: { en: "Fetches a matching song and sends the audio" },
    category: "MEDIA",
    guide: { en: "{pn} <song name>" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ").trim();

    if (!query) {
      return api.sendMessage(
        "❌ Please enter a song name.\nExample: /song Happy Nation",
        threadID,
        messageID
      );
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const filePath = path.join(cacheDir, `song_${senderID}_${Date.now()}.mp3`);

    try {
      api.setMessageReaction("🎵", messageID, () => {}, true);

      const base = await getApiBaseUrl();
      const apiUrl = `${base}/api/scdlv2?query=${encodeURIComponent(query)}`;

      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const contentType = response.headers["content-type"] || "";
      
      if (!contentType.includes("audio") && !contentType.includes("mpeg") && !contentType.includes("octet-stream")) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `🔍 𝗡𝗼 𝗿𝗲𝘀𝘂𝗹𝘁𝘀 𝗳𝗼𝘂𝗻𝗱 𝗳𝗼𝗿 "${query}"\n\n📝 Please try searching with a different keyword or check the spelling.`,
          threadID,
          messageID
        );
      }

      fs.writeFileSync(filePath, Buffer.from(response.data));

      const msg = `╭───〔 🎧 𝗦𝗢𝗡𝗚 𝗣𝗟𝗔𝗬𝗘𝗥 〕───╮\n│\n│ 🎵 𝗧𝗶𝘁𝗹𝗲 : ${query}\n│ 👤 𝗔𝘂𝘁𝗵𝗼𝗿 : xalman\n│\n╰─────────────────────`;

      const result = await api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        messageID
      );

      api.setMessageReaction("✅", messageID, () => {}, true);

      return result;

    } catch (error) {
      console.error("SONG ERROR:", error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `🔍 𝗡𝗼 𝗿𝗲𝘀𝘂𝗹𝘁𝘀 𝗳𝗼𝘂𝗻𝗱 𝗳𝗼𝗿 "${query}"\n\n📝 The song might not be available or the server is busy. Please try again with a different song.`,
        threadID,
        messageID
      );
    } finally {
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 15000);
    }
  }
};
