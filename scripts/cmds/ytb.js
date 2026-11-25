const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { getStreamFromURL } = global.utils;

const API = "https://dl.neokex.xyz";
const TMP_DIR = path.join(process.cwd(), "scripts", "cmds", "tmp");
const AUDIO_MAX_SIZE = 26 * 1024 * 1024;
const VIDEO_MAX_SIZE = 83 * 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36";

function react(api, messageID, emoji) {
        api.setMessageReaction(emoji, messageID, () => { }, true);
}

function videoId(input) {
        if (!input)
                return null;
        const match = String(input).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/))([\w-]{11})/);
        if (match)
                return match[1];
        if (/^[\w-]{11}$/.test(input))
                return input;
        return null;
}

function watchUrl(input) {
        const id = videoId(input);
        return id ? `https://www.youtube.com/watch?v=${id}` : String(input).trim();
}

function formatDuration(seconds) {
        const s = Math.floor(Number(seconds) || 0);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h ? h + ":" : ""}${h ? String(m).padStart(2, "0") : m}:${String(sec).padStart(2, "0")}`;
}

function safeName(name) {
        return String(name || "media").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim().slice(0, 60) || "media";
}

async function search(query, limit = 6) {
        const { data } = await axios.get(`${API}/yts`, {
                params: { q: query },
                timeout: 30000,
                headers: { "user-agent": USER_AGENT }
        });
        if (!data || data.status === false || !data.result)
                throw new Error((data && data.message) || "Search failed");
        const items = data.result.items || [];
        return items.slice(0, limit).map(item => ({
                id: videoId(item.url) || item.url,
                url: item.url,
                title: item.title,
                thumbnail: item.thumbnail,
                time: item.duration ? formatDuration(item.duration) : "",
                duration: item.duration || 0,
                channel: (item.author && item.author.name) || ""
        }));
}

async function fetchMedia(input) {
        const { data } = await axios.get(`${API}/dl`, {
                params: { url: watchUrl(input) },
                timeout: 90000,
                headers: { "user-agent": USER_AGENT }
        });
        if (!data || data.status === false || !data.result)
                throw new Error((data && data.message) || "Download failed");
        const result = data.result;
        const media = (result.media || []).filter(m => m && m.url);
        if (!media.length)
                throw new Error("No downloadable media was returned for this video");
        return {
                title: result.title || "Unknown",
                thumbnail: result.thumbnail,
                channel: (result.author && result.author.name) || "",
                link: data.url || watchUrl(input),
                media
        };
}

function pickMedia(media, type) {
        const wanted = media.filter(m => m.type === type);
        const pool = wanted.length ? wanted : media;
        const quality = { video: ["hd", "sd"], audio: ["high", "low"] };
        for (const q of quality[type] || [])
                if (pool.some(m => m.quality === q))
                        return pool.find(m => m.quality === q);
        return pool[0];
}

async function downloadToFile(url, filePath, maxSize) {
        const response = await axios({
                url,
                method: "GET",
                responseType: "stream",
                timeout: 120000,
                maxRedirects: 5,
                headers: { "user-agent": USER_AGENT, range: "bytes=0-" }
        });
        const declared = Number(response.headers["content-length"]) || 0;
        if (maxSize && declared > maxSize) {
                response.data.destroy();
                throw new Error("too large");
        }
        let received = 0;
        await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(filePath);
                response.data.on("data", chunk => {
                        received += chunk.length;
                        if (maxSize && received > maxSize) {
                                response.data.destroy();
                                writer.destroy();
                                reject(new Error("too large"));
                        }
                });
                response.data.on("error", reject);
                writer.on("finish", resolve);
                writer.on("error", reject);
                response.data.pipe(writer);
        });
        if (!fs.existsSync(filePath))
                throw new Error("Download produced no file");
        return filePath;
}

async function downloadMedia(input, type, maxSize) {
        const info = await fetchMedia(input);
        const media = pickMedia(info.media, type);
        if (!media)
                throw new Error("No downloadable media was returned for this video");
        fs.ensureDirSync(TMP_DIR);
        const ext = media.extension || (type === "audio" ? "m4a" : "mp4");
        const filePath = path.join(TMP_DIR, `${Date.now()}_${safeName(info.title)}.${ext}`);
        await downloadToFile(media.url, filePath, maxSize);
        return {
                path: filePath,
                title: info.title,
                thumbnail: info.thumbnail,
                channel: info.channel,
                link: info.link
        };
}

function removeFile(filePath) {
        try {
                if (filePath && fs.existsSync(filePath))
                        fs.unlinkSync(filePath);
        }
        catch (err) {
        }
}

module.exports = {
        config: {
                name: "ytb",
                aliases: ["youtube", "yt"],
                version: "2.0",
                author: "Neoaz 🐊",
                countDown: 5,
                role: 0,
                description: {
                        en: "Download video, audio or view video information on YouTube"
                },
                category: "media",
                guide: {
                        en: "   {pn} [video|-v] [<video name>|<video link>]"
                                + "\n   {pn} [audio|-a] [<video name>|<video link>]"
                                + "\n   {pn} [info|-i] [<video name>|<video link>]"
                }
        },

        langs: {
                en: {
                        error: "An error occurred: %1",
                        noResult: "No search results match the keyword %1",
                        choose: "%1Reply to the message with a number to choose or any content to cancel",
                        video: "video",
                        audio: "audio",
                        noVideo: "Sorry, no video was found with a size less than 83MB",
                        noAudio: "Sorry, no audio was found with a size less than 26MB",
                        info: "💠 Title: %1\n🏪 Channel: %2\n📦 Formats: %3\n🔠 ID: %4\n🔗 Link: %5"
                }
        },

        onStart: async function ({ api, args, event, message, commandName, getLang }) {
                let type;
                switch (args[0]) {
                        case "-v":
                        case "video":
                                type = "video";
                                break;
                        case "-a":
                        case "-s":
                        case "audio":
                        case "sing":
                                type = "audio";
                                break;
                        case "-i":
                        case "info":
                                type = "info";
                                break;
                        default:
                                return message.SyntaxError();
                }

                const input = args.slice(1).join(" ").trim();
                if (!input)
                        return message.SyntaxError();

                if (videoId(input)) {
                        react(api, event.messageID, "⏳");
                        return handle({ api, type, input, event, message, getLang });
                }

                react(api, event.messageID, "⏳");
                let result;
                try {
                        result = await search(input, 6);
                }
                catch (err) {
                        react(api, event.messageID, "❌");
                        return message.reply(getLang("error", err.message || JSON.stringify(err)));
                }
                if (!result.length) {
                        react(api, event.messageID, "❌");
                        return message.reply(getLang("noResult", input));
                }

                react(api, event.messageID, "✅");
                const msg = result.map((info, i) => `${i + 1}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel}\n`).join("\n");
                const thumbnails = await Promise.all(result.filter(r => r.thumbnail).map(r => getStreamFromURL(r.thumbnail)));
                message.reply({
                        body: getLang("choose", msg),
                        attachment: thumbnails
                }, (err, info) => {
                        if (err)
                                return message.reply(getLang("error", err.message));
                        global.GoatBot.onReply.set(info.messageID, {
                                commandName,
                                messageID: info.messageID,
                                author: event.senderID,
                                result,
                                type
                        });
                });
        },

        onReply: async ({ event, api, Reply, message, getLang }) => {
                const { result, type } = Reply;
                const choice = parseInt(event.body);
                if (!isNaN(choice) && choice >= 1 && choice <= result.length) {
                        api.unsendMessage(Reply.messageID);
                        react(api, event.messageID, "⏳");
                        await handle({ api, type, input: result[choice - 1].url, event, message, getLang });
                }
                else
                        api.unsendMessage(Reply.messageID);
        }
};

async function handle({ api, type, input, event, message, getLang }) {
        let downloaded;
        try {
                if (type == "video") {
                        downloaded = await downloadMedia(input, "video", VIDEO_MAX_SIZE);
                        await message.reply({
                                body: downloaded.title,
                                attachment: fs.createReadStream(downloaded.path)
                        });
                        react(api, event.messageID, "✅");
                }
                else if (type == "audio") {
                        downloaded = await downloadMedia(input, "audio", AUDIO_MAX_SIZE);
                        await message.reply({
                                body: downloaded.title,
                                attachment: fs.createReadStream(downloaded.path)
                        });
                        react(api, event.messageID, "✅");
                }
                else if (type == "info") {
                        const info = await fetchMedia(input);
                        const id = videoId(input) || "";
                        const qualities = info.media.map(m => `${m.type}${m.quality ? ` (${m.quality})` : ""}`).join(", ");
                        const msg = getLang(
                                "info",
                                info.title,
                                info.channel || "-",
                                qualities || "-",
                                id,
                                info.link
                        );
                        await message.reply({
                                body: msg,
                                attachment: info.thumbnail ? await getStreamFromURL(info.thumbnail) : []
                        });
                        react(api, event.messageID, "✅");
                }
        }
        catch (err) {
                react(api, event.messageID, "❌");
                const key = type == "video" ? "noVideo" : type == "audio" ? "noAudio" : "error";
                return message.reply(getLang(key, err.message || JSON.stringify(err)));
        }
        finally {
                if (downloaded)
                        removeFile(downloaded.path);
        }
}
