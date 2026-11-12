const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "anisr",
    version: "3.2.0",
    author: "Mr.king",
    role: 0,
    shortDescription: "Search and auto download TikTok video randomly from results",
    longDescription: "Searches TikTok videos using a query and randomly picks a video from the top results.",
    category: "media",
    guide: { en: "anisr [search query]" }
  },

  onStart: async function({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("❌ Kripya kono keyword ba search query din!", event.threadID, event.messageID);
    }

    api.setMessageReaction("⌛️", event.messageID, () => {}, true);

    try {
      const apiURL = `https://aliyaanisr.vercel.app/api/tiktok?query=${encodeURIComponent(query)}`;
      const res = await axios.get(apiURL);

      if (!res.data || !res.data.data || !Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error("Kono video paowa jayni!");
      }

      const videos = res.data.data;
      
      // Randomly select one video from the search results
      const randomIndex = Math.floor(Math.random() * videos.length);
      const selectedVideo = videos[randomIndex];
      const videoURL = selectedVideo.video_url;

      if (!videoURL) throw new Error("Video download link paowa jayni!");

      const buffer = (await axios.get(videoURL, { responseType: "arraybuffer" })).data;
      const filePath = path.join(__dirname, "cache", `anisr_${Date.now()}.mp4`);

      await fs.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, Buffer.from(buffer));

      api.setMessageReaction("🦋", event.messageID, () => {}, true);

      const infoCard = 
        `╭───────────────⬣\n` +
        `│ 🎬 ━━━━ 𝙃𝙀𝙍𝙀 𝙄𝙎 𝙔𝙊𝙐𝙍 𝙑𝙄𝘿𝙀𝙊 ━━━━ 🎬 ✦ 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 ✦\n` +
        `╰───────────────⬣`;

      api.sendMessage(
        { body: infoCard, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (error) {
      console.error("Anisr Error:", error.message);
      api.setMessageReaction("❌️", event.messageID, () => {}, true);
      api.sendMessage("❌ Kono somossa hoyeche, abar chesta korun!", event.threadID, event.messageID);
    }
  }
};
