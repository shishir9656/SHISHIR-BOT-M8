const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/aura-mahmud/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "tik",
                aliases: ["tt", "tik"],
                version: "3.8",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        en: "Search and download TikTok edit videos",
                        vi: "Tìm kiếm và tải xuống các video chỉnh sửa TikTok"
                },
                category: "media",
                guide: {
                        en: '   {pn} <keyword>: Enter keyword to search (Ex: {pn} naruto)',
                        vi: '   {pn} <từ khóa>: Nhập từ khóa để tìm kiếm (VD: {pn} naruto)'
                }
        },

        langs: {
                en: {
                        noInput: "× Baby, what do you want to search? 🔍\nExample: {pn} naruto",
                        success: "• 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐓𝐢𝐤𝐓𝐨𝐤 𝐄𝐝𝐢𝐭 𝐕𝐢𝐝𝐞𝐨.\n• 𝐒𝐞𝐚𝐫𝐜𝐡: %1",
                        error: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                },
                vi: {
                        noInput: "× Cưng ơi, cưng muốn tìm kiếm gì? 🔍\nVí dụ: {pn} naruto",
                        success: "• 𝐕𝐢𝐝𝐞𝐨 𝐜𝐡𝐢̉𝐧𝐡 𝐬𝐮̛̉𝐚 𝐓𝐢𝐤𝐓𝐨𝐤 𝐜𝐮̉𝐚 𝐜𝐮̛𝐧𝐠 ᵭ𝐚̂𝐲.\n• 𝐓𝐢̀𝐦 𝐤𝐢𝐞̂́𝐦: %1",
                        error: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const search = args.join(" ");
                if (!search) return message.reply(getLang("noInput"));

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const videoUrl = `${await baseApiUrl()}/api/tiksr?sr=${encodeURIComponent(search)}`;
                        const stream = await global.utils.getStreamFromURL(videoUrl);

                        api.setMessageReaction("🪽", event.messageID, () => {}, true);

                        return message.reply({
                                body: getLang("success", search),
                                attachment: stream
                        });

                } catch (err) {
                        console.error("TikTok Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
