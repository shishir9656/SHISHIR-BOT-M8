module.exports = {
	config: {
		name: "unsend",
		aliases: ["😾","u", "uns", "r"],
		version: "2.0",
		author: "ARIYAN AI",
		countDown: 0,
		role: 0,
		description: {
			en: "Unsend bot's message by replying"
		},
		category: "box chat"
	},

	onStart: async function ({ message, event, api }) {
		if (!event.messageReply) {
			return message.reply("✨ 𝖯𝗅𝖾𝖺𝗌𝖾 𝗋𝖾𝗉𝗅𝗒 𝗍𝗈 𝗍𝗁𝖾 𝖻𝗈𝗍 𝗆𝖾𝗌𝗌𝖺𝗀𝖾 𝗒𝗈𝗎 𝗐𝖺𝗇𝗍 𝗍𝗈 𝗎𝗇𝗌𝖾𝗇𝖽.");
		}

		if (event.messageReply.senderID !== api.getCurrentUserID()) {
			return message.reply("❌ 𝖨 𝖼𝖺𝗇 𝗈𝗇𝗅𝗒 𝗎𝗇𝗌𝖾𝗇𝖽 𝗆𝗒 𝗈𝗐𝗇 𝗆𝖾𝗌𝗌𝖺𝗀𝖾𝗌!");
		}

		return api.unsendMessage(event.messageReply.messageID);
	},

	// NO-PREFIX HANDLER (সরাসরি u, r বা unsend লিখলে কাজ করবে)
	onChat: async function ({ event, api }) {
		if (!event.body || !event.messageReply) return;

		const text = event.body.toLowerCase().trim();
		const triggerKeywords = ["u", "uns", "r", "unsend", "মুছে ফেল"]; // কিছু কিউট কিউয়ার্ড অ্যাড করলাম

		if (triggerKeywords.includes(text) && event.messageReply.senderID === api.getCurrentUserID()) {
			return api.unsendMessage(event.messageReply.messageID);
		}
	}
};
