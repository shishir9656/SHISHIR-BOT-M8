const { getStreamFromURL } = global.utils;

function react(api, messageID, emoji) {
        api.setMessageReaction(emoji, messageID, () => { }, true);
}

function formatDuration(ms) {
        const total = Math.floor((Number(ms) || 0) / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
}

function formatTrack(track) {
        const duration = track.duration ? ` (${formatDuration(track.duration)})` : "";
        return `${track.title || "Unknown"}${track.artist ? ` - ${track.artist}` : ""}${duration}`;
}

async function sendAudio({ api, track, event, message, getLang }) {
        if (!track.url) {
                react(api, event.messageID, "❌");
                return message.reply(getLang("noAudio", formatTrack(track)));
        }
        try {
                const attachment = await getStreamFromURL(track.url, `track-${track.songId || track.id}.m4a`);
                attachment.mimeType = "audio/mp4";
                await message.reply({
                        body: `🎵 ${formatTrack(track)}`,
                        attachment
                });
                react(api, event.messageID, "✅");
        }
        catch (err) {
                react(api, event.messageID, "❌");
                await message.reply(getLang("error", err.error || err.message || JSON.stringify(err)));
        }
}

function parseArgs(args) {
        const rest = args.slice();
        let count = 0;
        for (let i = 0; i < rest.length; i++) {
                if (rest[i] === "-c" || rest[i] === "--count" || rest[i] === "count") {
                        const parsed = parseInt(rest[i + 1]);
                        count = isNaN(parsed) ? 5 : Math.min(Math.max(parsed, 1), 10);
                        rest.splice(i, 2);
                        break;
                }
        }
        return { count, query: rest.join(" ").trim() };
}

module.exports = {
        config: {
                name: "sing",
                aliases: ["sing", "audio"],
                version: "2.0",
                author: "Neoaz 🐊",
                countDown: 10,
                role: 0,
                description: {
                        en: "Search a song and send its audio clip"
                },
                category: "media",
                guide: {
                        en: "   {pn} <song name>: send the best matching song directly"
                                + "\n   {pn} -c <count> <song name>: show a list of songs to choose from"
                }
        },

        langs: {
                en: {
                        noResult: "No song found for \"%1\"",
                        busy: "Facebook is rate limiting music search right now, please try again in a few minutes.",
                        choose: "Reply with the number to choose the song:\n%1",
                        invalidReply: "Invalid choice",
                        noAudio: "No audio available for \"%1\"",
                        error: "An error occurred: %1"
                }
        },

        onStart: async function ({ api, args, event, message, getLang, commandName }) {
                const { count, query } = parseArgs(args);
                if (!query)
                        return message.SyntaxError();

                react(api, event.messageID, "⏳");
                let results;
                try {
                        results = await api.searchMusic(query, { limit: count || 5 });
                }
                catch (err) {
                        react(api, event.messageID, "❌");
                        if (err.error === "RATE_LIMITED")
                                return message.reply(getLang("busy"));
                        return message.reply(getLang("error", err.error || err.message || JSON.stringify(err)));
                }
                if (!results || !results.length) {
                        react(api, event.messageID, "❌");
                        return message.reply(getLang("noResult", query));
                }

                if (!count)
                        return sendAudio({ api, track: results[0], event, message, getLang });

                react(api, event.messageID, "✅");
                const list = results.map((t, i) => `${i + 1}. ${formatTrack(t)}`).join("\n");
                const thumbnails = await Promise.all(results.filter(t => t.image).map(t => getStreamFromURL(t.image)));
                message.reply({
                        body: getLang("choose", list),
                        attachment: thumbnails
                }, (err, info) => {
                        if (err)
                                return message.reply(getLang("error", err.error || err.message));
                        global.GoatBot.onReply.set(info.messageID, {
                                commandName,
                                messageID: info.messageID,
                                author: event.senderID,
                                results
                        });
                });
        },

        onReply: async function ({ api, event, message, Reply, getLang }) {
                const choice = parseInt(event.body);
                if (isNaN(choice) || choice < 1 || choice > Reply.results.length)
                        return message.reply(getLang("invalidReply"));
                react(api, event.messageID, "⏳");
                api.unsendMessage(Reply.messageID);
                await sendAudio({ api, track: Reply.results[choice - 1], event, message, getLang });
        }
};
