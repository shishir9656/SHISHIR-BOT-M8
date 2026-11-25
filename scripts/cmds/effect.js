module.exports = {
	config: {
		name: "effect",
		version: "1.0",
		author: "Neoaz 🐊",
		countDown: 5,
		role: 0,
		description: {
			en: "Send a message with a Messenger effect"
		},
		category: "fun",
		guide: {
			en: "   {pn} <effect> <message>"
				+ "\n   {pn} list: show all available effects"
				+ "\n   Example: {pn} fire hello"
		}
	},

	langs: {
		en: {
			list: "Available effects:\n%1",
			missingText: "Please enter the message to send with the effect",
			unknownEffect: "Unknown effect \"%1\", use {pn} list to view available effects",
			error: "An error occurred: %1"
		}
	},

	onStart: async function ({ api, args, event, message, getLang }) {
		const effectNames = [
			"love", "gift_wrap", "celebration", "fire", "halloween",
			"nom_nom_dash", "new_years", "valentines_day", "anti_valentines",
			"avatar_love", "avatar_anger", "avatar_laugh", "avatar_cry"
		];
		if (!args[0] || args[0] == "list")
			return message.reply(getLang("list", effectNames.join(", ")));

		const effect = args[0].toLowerCase();
		if (!effectNames.includes(effect))
			return message.reply(getLang("unknownEffect", effect));

		const isAvatar = effect.startsWith("avatar_");
		const body = args.slice(1).join(" ");
		if (!body && !isAvatar)
			return message.reply(getLang("missingText"));

		api.setMessageReaction("⏳", event.messageID, () => { }, true);
		try {
			await message.reply({ body: body || " ", effect });
			api.setMessageReaction("✅", event.messageID, () => { }, true);
		}
		catch (err) {
			api.setMessageReaction("❌", event.messageID, () => { }, true);
			return message.reply(getLang("error", err.message || JSON.stringify(err)));
		}
	}
};
