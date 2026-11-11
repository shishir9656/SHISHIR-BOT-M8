const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "ytb",
    aliases: ["youtube"],
    version: "10.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "YouTube Audio/Video Downloader with fast stream response",
    longDescription: "Search and download YouTube audio/video with fast streaming support",
    category: "ANIME & MEDIA",
    guide: {
      en: "{pn} -v <song name>\n{pn} -a <song name>\n{pn} <youtube link>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    if (!args[0]) {
      return api.sendMessage(
        `╭──〔 YOUTUBE DOWNLOADER 〕──╮\n│\n├─ 🎥 ${this.config.name} -v believer\n├─ 🎵 ${this.config.name} -a believer\n├─ 🔗 ${this.config.name} <youtube link>\n│\n╰──────────────────╯`,
        threadID,
        messageID
      );
    }
    const input = args.join(" ");
    const ytRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/i;
    if (ytRegex.test(input)) {
      api.setMessageReaction("⏳", messageID, () => {}, true);
      return downloadMedia(api, threadID, messageID, input, "video");
    }
    let mode = "video";
    if (args[0] === "-a") mode = "audio";
    const query = args[0].startsWith("-") ? args.slice(1).join(" ") : args.join(" ");
    if (!query) {
      return api.sendMessage("❌ Please enter search query", threadID, messageID);
    }
    api.setMessageReaction("🔍", messageID, () => {}, true);
    try {
      const res = await axios.get(`https://xalman-apis.vercel.app/api/ytsearch?q=${encodeURIComponent(query)}`);
      if (!res.data.status || !res.data.results || !res.data.results.length) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ No result found", threadID, messageID);
      }
      const results = res.data.results;
      const searchQuery = res.data.search_query || query;
      const totalPages = Math.ceil(results.length / 5);
      if (!global.ytbSearch) global.ytbSearch = {};
      global.ytbSearch[senderID] = {
        results,
        mode,
        searchQuery,
        currentPage: 1,
        totalPages
      };
      await sendSearchPage(api, threadID, senderID, 1);
    } catch (e) {
      console.log(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ Search failed", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, body, senderID } = event;
    if (senderID != Reply.author) return;
    const data = global.ytbSearch?.[senderID];
    if (!data) return api.sendMessage("⚠️ Search session expired. Please search again.", threadID, messageID);
    const lower = body.toLowerCase().trim();
    if (lower === "next" || lower === "n") {
      if (data.currentPage < data.totalPages) {
        data.currentPage++;
        await sendSearchPage(api, threadID, senderID, data.currentPage);
      } else {
        api.sendMessage("📄 You are on the last page.", threadID, messageID);
      }
      return;
    }
    if (lower === "prev" || lower === "p") {
      if (data.currentPage > 1) {
        data.currentPage--;
        await sendSearchPage(api, threadID, senderID, data.currentPage);
      } else {
        api.sendMessage("📄 You are on the first page.", threadID, messageID);
      }
      return;
    }
    const num = parseInt(body);
    if (isNaN(num) || num < 1 || num > 5) {
      return api.sendMessage("❌ Invalid number. Choose 1-5, or type 'next'/'prev'.", threadID, messageID);
    }
    const pageStart = (data.currentPage - 1) * 5;
    const index = pageStart + num - 1;
    if (index >= data.results.length) {
      return api.sendMessage("❌ That result doesn't exist.", threadID, messageID);
    }
    const video = data.results[index];
    try {
      if (Reply.searchMessageID) {
        await api.unsendMessage(Reply.searchMessageID, threadID);
      }
    } catch {}
    api.setMessageReaction("⏳", messageID, () => {}, true);
    return downloadMedia(api, threadID, messageID, video.url, data.mode);
  }
};

async function sendSearchPage(api, threadID, senderID, page) {
  const data = global.ytbSearch?.[senderID];
  if (!data) return;
  const results = data.results;
  const pageStart = (page - 1) * 5;
  const pageResults = results.slice(pageStart, pageStart + 5);
  let msg = `╭──〔 SEARCH RESULT 〕──╮\n│ 🔎 Query: ${data.searchQuery || "..."}\n│ 📦 Mode: ${data.mode.toUpperCase()}\n│ 📄 Page ${page}/${data.totalPages}\n╰──────────────────╯\n\n`;
  for (let i = 0; i < pageResults.length; i++) {
    const idx = pageStart + i + 1;
    msg += `${idx}. ${pageResults[i].title}\n⏱ ${pageResults[i].duration}\n📺 ${pageResults[i].channel}\n\n`;
  }
  msg += "💬 Reply with a number (1-5) to select, or 'next'/'prev' to navigate.";
  const thumbnails = [];
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) {
