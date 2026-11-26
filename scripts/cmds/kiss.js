const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/aura-mahmud/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "kiss",
                aliases: ["চুমা", "কিস"],
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        bn: "কাউকে মেনশন দিয়ে একটি রোমান্টিক কিস ইমেজ তৈরি করুন",
                        en: "Generate a romantic kiss image by mentioning someone",
                        vi: "Tạo hình ảnh hôn lãng mạn bằng cách gắn thẻ ai đó"
                },
                category: "love",
                guide: {
                        bn: '   {pn} <@tag>: কাউকে কিস করতে ট্যাগ করুন',
                        en: '   {pn} <@tag>: Tag someone to kiss',
                        vi: '   {pn} <@tag>: Gắn thẻ ai đó để hôn'
                }
        },

        langs: {
                bn: {
                        noTarget: "× বেবি, কিস করার জন্য কাউকে তো মেনশন দাও! 💋",
                        wait: "তোমার কিস ইমেজটি তৈরি করছি... একটু অপেক্ষা করো বেবি! <😘",
                        success: "এই নাও তোমাদের কিস ইমেজ বেবি! 🙈",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।"
                },
                en: {
                        noTarget: "× Baby, please mention someone to kiss! 💋",
                        wait: "Generating your kiss image... Please wait a moment baby! <😘",
                        success: "Here’s your kiss image baby! 🙈",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noTarget: "× Cưng ơi, hãy gắn thẻ ai đó để hôn đi! 💋",
                        wait: "Đang tạo hình ảnh hôn cho cưng... Chờ chút nhé! <😘",
                        success: "Ảnh hôn của cưng đây! 🙈",
                        error: "× Lỗi: %1. Liên hệ MahMUD để hỗ trợ."
                }
        },

        onStart: async function ({ api, event, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const mentions = Object.keys(event.mentions);
                if (mentions.length === 0) return message.reply(getLang("noTarget"));

                const senderID = event.senderID;
                const targetID = mentions[0];
                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const imgPath = path.join(cacheDir, `kiss_${senderID}_${targetID}.png`);

                try {
                        api.setMessageReaction("😘", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const base = await mahmud();
                        const response = await axios.post(`${base}/api/kiss`, 
                                { senderID, targetID }, 
                                { responseType: "arraybuffer" }
                        );

                        fs.writeFileSync(imgPath, Buffer.from(response.data));

                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(imgPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        });

                } catch (err) {
                        console.error("Kiss Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
