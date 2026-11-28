const axios = require("axios");
const fs = require("fs-extra");
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
    name: "gen",
    version: "1.0",
    author: "xalman",
    countDown: 5,
    role: 3,
    shortDescription: "AI Image & Video Generation with style support",
    category: "NSFW",
    guide: {
      en: "{pn} <prompt> [--ar 9:16] [--s angel]\n" +
          "{pn} (reply to an image) [prompt] [--s undress]\n" +
          "{pn} (reply to an image) [prompt] --v video\n" +
          "{pn} list (shows available ratios & styles)"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;
    let promptArgs = [];
    let ratio = null;
    let style = null;
    let isVideo = false;
    let imageUrl = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i].toLowerCase();
      if ((arg === "--ratio" || arg === "--ar") && i + 1 < args.length) {
        ratio = args[i + 1];
        i++;
      } else if ((arg === "--style" || arg === "--s") && i + 1 < args.length) {
        style = args[i + 1];
        i++;
      } else if (arg === "--video" || arg === "--v") {
        isVideo = true;
      } else {
        promptArgs.push(args[i]);
      }
    }

    const prompt = promptArgs.join(" ").trim();

    if (event.type === "message_reply" && event.messageReply?.attachments?.length > 0) {
      const att = event.messageReply.attachments[0];
      if (att.type === "photo") imageUrl = att.url;
    }

    if (!prompt && !imageUrl && args[0] !== "list") {
      return message.reply("⚠️ Please provide a prompt or reply to an image.\nExample: /gen a cute girl --ratio 9:16 --style angel\nType /gen list to see available styles.");
    }

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const base = await getApiBaseUrl();

      if (args[0] === "list" || (!prompt && !imageUrl)) {
        const listRes = await axios.get(`${base}/api/gen`, { 
          timeout: 15000,
          validateStatus: () => true 
        });
        
        let d = listRes.data;
        if (typeof d === "string") {
          try { d = JSON.parse(d); } catch (e) {}
        }

        const ratioList = d?.available_ratios ? d.available_ratios.join(", ") : "Unknown";
        const styleList = d?.available_styles ? d.available_styles.join("\n• ") : "Unknown";

        const listMsg = `🎨 𝗚𝗘𝗡 𝗦𝗧𝗔𝗧𝗨𝗦\n━━━━━━━━━━━━━━━━━━\n📐 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗥𝗮𝘁𝗶𝗼𝘀:\n• ${ratioList}\n\n👗 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗦𝘁𝘆𝗹𝗲𝘀:\n• ${styleList}\n\n📝 𝗨𝘀𝗮𝗴𝗲:\n/gen <prompt> [--ratio 1:1] [--style angel]\n/gen [--video] (reply to image)`;

        api.setMessageReaction("✅", messageID, () => {}, true);
        return message.reply(listMsg);
      }

      let apiUrl = `${base}/api/gen?`;
      const query = [];

      if (prompt) query.push(`prompt=${encodeURIComponent(prompt)}`);
      if (imageUrl) query.push(`imageUrl=${encodeURIComponent(imageUrl)}`);
      if (ratio) query.push(`ratio=${encodeURIComponent(ratio)}`);
      if (style) query.push(`style=${encodeURIComponent(style)}`);
      if (isVideo) query.push(`type=video`);

      apiUrl += query.join("&");

      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 180000,
        validateStatus: () => true,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const contentType = res.headers["content-type"] || "";
      
      if (!contentType.includes("image") && !contentType.includes("video")) {
        let errMsg = "Failed to generate media.";
        try {
          const jsonStr = Buffer.from(res.data).toString();
          const json = JSON.parse(jsonStr);
          
          if (json.message) errMsg = json.message;
          if (json.available_ratios && json.available_styles) {
             const rList = json.available_ratios.join(", ");
             const sList = json.available_styles.join("\n• ");
             errMsg += `\n\n📐 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗥𝗮𝘁𝗶𝗼𝘀:\n• ${rList}\n\n👗 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗦𝘁𝘆𝗹𝗲𝘀:\n• ${sList}`;
          }
        } catch (e) { 
          errMsg += `\n(Status: ${res.status})`;
        }
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply(`❌ ${errMsg}`);
      }

      const isVideoRes = contentType.includes("video");
      const ext = isVideoRes ? "mp4" : "png";

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const outPath = path.join(cacheDir, `gen_${Date.now()}.${ext}`);
      await fs.writeFile(outPath, Buffer.from(res.data));

      api.setMessageReaction("✅", messageID, () => {}, true);

      let caption = `🎨 𝗚𝗘𝗡 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗\n━━━━━━━━━━━━━━━━━━`;
      if (isVideoRes) {
        caption += `\n🎬 Type: Video`;
        if (style) caption += `\n👗 Style: ${style}`;
      } else if (imageUrl) {
        caption += `\n🖼️ Mode: image2image`;
        if (style) caption += `\n👗 Style: ${style}`;
      } else {
        caption += `\n🖼️ Mode: Text2Image`;
        if (ratio) caption += `\n📐 Ratio: ${ratio}`;
        if (style) caption += `\n👗 Style: ${style}`;
      }

      return message.reply({
        body: caption,
        attachment: fs.createReadStream(outPath)
      }, async () => {
        if (fs.existsSync(outPath)) await fs.unlink(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("❌ Error: " + err.message);
    }
  }
};
