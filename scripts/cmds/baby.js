const axios = require('axios');

const PRIMARY_API = "https://noobs-api.top/dipto";
const SECONDARY_API = "https://baby-apisx.vercel.app";

function looksLikeErrorPayload(raw) {
    if (!raw || typeof raw !== "object") return true;
    if (raw.error) return true;
    const text = `${raw.reply ?? ""} ${raw.message ?? ""}`;
    return /cannot read propert|undefined|is not a function|internal server error|^error:/i.test(text);
}

function normalize(raw) {
    return {
        ...raw,
        reply: raw.reply ?? "🤔 I couldn't come up with a reply.",
        message: raw.message ?? "✅ Done (the API didn't send a confirmation message)."
    };
}

async function fetchWithFallback(path) {
    let primaryError;
    try {
        const res = await axios.get(`${PRIMARY_API}${path}`, { timeout: 10000 });
        if (res.data && typeof res.data === "object" && !looksLikeErrorPayload(res.data)) return normalize(res.data);
        primaryError = new Error(`Primary API returned a bad payload: ${JSON.stringify(res.data)}`);
    } catch (e) {
        primaryError = e;
    }

    try {
        const res = await axios.get(`${SECONDARY_API}${path}`, { timeout: 10000 });
        if (res.data && typeof res.data === "object" && !looksLikeErrorPayload(res.data)) return normalize(res.data);
        throw new Error(`Secondary API returned a bad payload: ${JSON.stringify(res.data)}`);
    } catch (e) {
        console.log("baby: primary failed ->", primaryError?.message);
        console.log("baby: secondary failed ->", e.message);
        throw new Error("Both baby APIs are currently unavailable. Please try again later.");
    }
}

const utils = {
    monospace: (text) => {
        if (typeof text !== "string" || !text) return text ?? "🤔 No reply received.";
        const monospaceMap = {
            'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
            'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
            'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
            'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
            'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
            'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
            '0': '𝟶', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
        };
        return text.split('').map(char => monospaceMap[char] || char).join('');
    },
    realMention: (name, uid, message) => {
        const finalMessage = `『 ${name} 』\n\n${message}`;
        return { body: finalMessage, mentions: [{ tag: name, id: uid }] };
    }
};

const triggers = ["baby", "bby", "bot", "jan", "babu", "janu", "suna", "sara", "mikasa", "hinata", "xadika", "alya"];

async function sendAttachmentReply(api, event) {
    const attType = event.attachments?.[0]?.type;
    let endpoint = null;
    if (attType === "sticker") endpoint = "sticker";
    else if (attType === "photo" || attType === "animated_image") endpoint = "picture";
    if (!endpoint) return false;

    const raw = (await axios.get(`${SECONDARY_API}/baby/${endpoint}?senderID=${event.senderID}`, { timeout: 10000 })).data;
    if (looksLikeErrorPayload(raw)) return false;
    const data = normalize(raw);
    await api.sendMessage(data.reply, event.threadID, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
            commandName: "baby",
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
    return true;
}

module.exports.config = {
    name: "baby",
    aliases: ["bby"],
    version: "11.1",
    author: "xalman",
    countDown: 0,
    role: 0,
    description: "api by dipto || aryan",
    category: "CHATTING",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach react [YourMessage] - [react1], [react2]... OR\nteach amar [YourMessage] - [reply] OR\nteach sticker - [Reply1], [Reply2]... OR\nteach picture - [Reply1], [Reply2]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nedit [YourMessage] - [NewReply] OR\nmsg [YourMessage] OR\nlist OR\nlist all"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const body = args.join(" ").toLowerCase();
    const uid = event.senderID;

    try {
        if (!args[0]) {
            if (event.attachments?.length > 0) {
                const handled = await sendAttachmentReply(api, event);
                if (handled) return;
            }
            const ran = [""];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        if (args[0] === 'remove') {
            const key = body.replace("remove ", "");
            const data = await fetchWithFallback(`/baby?remove=${encodeURIComponent(key)}&senderID=${uid}`);
            return api.sendMessage(data.message, event.threadID, event.messageID);
        }

        if (args[0] === 'rm' && body.includes('-')) {
            const [key, index] = body.replace("rm ", "").split(/\s*-\s*/);
            const data = await fetchWithFallback(`/baby?remove=${encodeURIComponent(key)}&index=${index}`);
            return api.sendMessage(data.message, event.threadID, event.messageID);
        }

        if (args[0] === 'list') {
            if (args[1] === 'all') {
                const data = await fetchWithFallback(`/baby?list=all`);
                const limit = parseInt(args[2]) || 100;
                const limited = data?.teacher?.teacherList?.slice(0, limit) || [];
                const teachers = await Promise.all(limited.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = await usersData.getName(number).catch(() => number) || "Not found";
                    return { name, value };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return api.sendMessage(`Total Teach = ${data.length}\n👑 | List of Teachers of baby\n${output}`, event.threadID, event.messageID);
            }
            const data = await fetchWithFallback(`/baby?list=all`);
            return api.sendMessage(`❇️ | Total Teach = ${data.length || "api off"}\n♻️ | Total Response = ${data.responseLength || "api off"}`, event.threadID, event.messageID);
        }

        if (args[0] === 'msg') {
            const key = body.replace("msg ", "");
            const data = await fetchWithFallback(`/baby?list=${encodeURIComponent(key)}`);
            return api.sendMessage(`Message ${key} = ${data.data}`, event.threadID, event.messageID);
        }

        if (args[0] === 'edit') {
            const parts = body.replace("edit ", "").split(/\s*-\s*/);
            if (parts.length < 2)
                return api.sendMessage('❌ | Invalid format! Use: edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
            const data = await fetchWithFallback(`/baby?edit=${encodeURIComponent(parts[0])}&replace=${encodeURIComponent(parts[1])}&senderID=${uid}`);
            return api.sendMessage(`changed ${data.message}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach' && args[1] === 'sticker') {
            const reply = body.replace("teach sticker ", "").replace(/^-\s*/, "").trim();
            if (!reply) return api.sendMessage('❌ | Invalid format! Use: teach sticker - [Reply1], [Reply2]...', event.threadID, event.messageID);
            const data = normalize((await axios.get(`${SECONDARY_API}/baby/sticker?teach=1&reply=${encodeURIComponent(reply)}&senderID=${uid}`, { timeout: 10000 })).data || {});
            return api.sendMessage(`✅ ${data.message}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach' && args[1] === 'picture') {
            const reply = body.replace("teach picture ", "").replace(/^-\s*/, "").trim();
            if (!reply) return api.sendMessage('❌ | Invalid format! Use: teach picture - [Reply1], [Reply2]...', event.threadID, event.messageID);
            const data = normalize((await axios.get(`${SECONDARY_API}/baby/picture?teach=1&reply=${encodeURIComponent(reply)}&senderID=${uid}`, { timeout: 10000 })).data || {});
            return api.sendMessage(`✅ ${data.message}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach' && args[1] === 'react') {
            const parts = body.replace("teach react ", "").split(/\s*-\s*/);
            if (parts.length < 2)
                return api.sendMessage('❌ | Invalid format! Use: teach react [YourMessage] - ❤️, 😀', event.threadID, event.messageID);
            const data = await fetchWithFallback(`/baby?teach=${encodeURIComponent(parts[0])}&react=${encodeURIComponent(parts[1])}`);
            return api.sendMessage(`✅ Reacts added: ${data.message}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach' && args[1] === 'amar') {
            const parts = body.replace("teach amar ", "").split(/\s*-\s*/);
            if (parts.length < 2)
                return api.sendMessage('❌ | Invalid format! Use: teach amar [YourMessage] - [reply]', event.threadID, event.messageID);
            const data = await fetchWithFallback(`/baby?teach=${encodeURIComponent(parts[0])}&senderID=${uid}&reply=${encodeURIComponent(parts[1])}&key=intro`);
            return api.sendMessage(`✅ Intro reply added: ${data.message}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach') {
            const parts = body.replace("teach ", "").split(/\s*-\s*/);
            if (parts.length < 2 || parts[1].length < 2)
                return api.sendMessage('❌ | Invalid format! Use: teach [YourMessage] - [Reply1], [Reply2]', event.threadID, event.messageID);
            const data = await fetchWithFallback(`/baby?teach=${encodeURIComponent(parts[0])}&reply=${encodeURIComponent(parts[1])}&senderID=${uid}&threadID=${event.threadID}`);
            let teacherName = "Unknown";
            try {
                teacherName = (await usersData.get(data.teacher || uid))?.name || await usersData.getName(uid) || "Unknown";
            } catch {
                teacherName = await usersData.getName(uid).catch(() => "Unknown");
            }
            const outputMessage = utils.monospace(`✅ Replies added: ${data.message}\n👤 Teacher: ${teacherName}\n📚 Total Teachs: ${data.teachs}`);
            return api.sendMessage(outputMessage, event.threadID, event.messageID);
        }

        if (["amar name ki", "amr nam ki", "amar nam ki", "amr name ki", "whats my name"].some(p => body.includes(p))) {
            const data = await fetchWithFallback(`/baby?text=amar name ki&senderID=${uid}&key=intro`);
            return api.sendMessage(data.reply, event.threadID, event.messageID);
        }

        const data = await fetchWithFallback(`/baby?text=${encodeURIComponent(body)}&senderID=${uid}&threadID=${event.threadID}&font=1`);
        const replyText = utils.monospace(data.reply);
        api.sendMessage(replyText, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: "baby",
                type: "reply",
                messageID: info.messageID,
                author: event.senderID
            });
        }, event.messageID);

    } catch (e) {
        console.log(e);
        api.sendMessage("Check console for error", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event }) => {
    try {
        if (event.type !== "message_reply") return;

        if (event.attachments?.length > 0) {
            const handled = await sendAttachmentReply(api, event);
            if (handled) return;
        }

        const data = await fetchWithFallback(`/baby?text=${encodeURIComponent(event.body?.toLowerCase() || "")}&senderID=${event.senderID}&threadID=${event.threadID}&font=1`);
        const replyText = utils.monospace(data.reply);
        await api.sendMessage(replyText, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: "baby",
                type: "reply",
                messageID: info.messageID,
                author: event.senderID
            });
        }, event.messageID);
    } catch (err) {
        return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event, usersData }) => {
    try {
        const body = event.body ? event.body.toLowerCase() : "";
        const hasTrigger = triggers.some(t => body.startsWith(t));
        if (!hasTrigger) return;

        if (event.attachments?.length > 0) {
            const handled = await sendAttachmentReply(api, event);
            if (handled) return;
        }

        const arr = body.replace(/^\S+\s*/, "");
        const uid = event.senderID;
        const senderName = (await usersData.getName(uid)) || "User";

        if (!arr) {
            const baseReplies = [
                "kire sali ki koibi koo fast dakis na💬",
                "@Hi..apu... Apni keno amake block korcen ami janina... Please 1 ta bar kotha bolar sojog cai ami plese 😅",
                "@Apu Ami Apnake Onek Love Kori Plz Add Koren 🐼",
                "@apnke Chara Ami bacbo na I love you 🫶🥹",
                "@Hi Apu Asole ami apnake onk din dhore pochondo kori but bolte pari na tai friend request dilam apni jodi accept na koren tahole ami bachbo na",
                "@আমার ছটো বেলার সপ্ন কলা খাবো কিন্তু টাকার ওভাবে কনোদিন খেতে পারি নাই একদিন জয়া নাম এর এক খানকিমাগির ব্যাগ থেকে একটা হিরো কনডম পরে যায় আমি তখন ওই কনডম টা বিক্রি করে একটা কলা কিনে খেয়ে ফেলি",
        "হুম? বলো 😺",
        "হ্যাঁ জানু 😚",
        "শুনছি বেবি 😘",
        "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈",
        "Boss বল boss😼",
        "আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘",
        "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣",
        "jang hanga korba😒😬",
        "আমাকে না ডেকে আমার বস শিশির কে একটা জি এফ দাও-😽🫶🌺",
        "মাইয়া হলে চিপায় আসো 🙈😘",
        "-𝙂𝙖𝙮𝙚𝙨-🤗-যৌবনের কসম দিয়ে আমাকে 𝐁𝐥𝐚𝐜𝐤𝐦𝐚𝐢𝐥 করাছে-🥲🤦‍♂️🤧",
        "-আমার গল্পে তোমার নানি সেরা-🙊🙆‍♂️",
        "বট বট করিস না তো 😑,মেয়ে হলে আমার বসের ইনবক্স এ গিয়ে উম্মা দিয়ে আসো , এই নাও বসের ইনবক্স লিংক https://www.facebook.com/profile.php?id=61595106187744",
        "এত ডাকাডাকি না করে মুড়ির সাথে গাঞ্জা মিশাইয়া খাইয়া মরে যা",
        "—যে ছেড়ে গেছে-😔-তাকে ভুলে যাও-🙂-আমার বস শিশির এর সাথে প্রেম করে তাকে দেখিয়ে দাও-🙈🐸",
        "সুন্দর মাইয়া মানেই-🥱আমার বস শিশির ' এর বউ-😽🫶আর বাকি গুলো আমার বেয়াইন-🙈🐸",
        "-𝗜 𝗟𝗢𝗩𝗢 𝗬𝗢𝗨-😽-আহারে ভাবছো তোমারে প্রোপজ করছি-🥴-থাপ্পর দিয়া কিডনী লক করে দিব-😒-ভুল পড়া বের করে দিবো-🤭🐸",
        "-হুদাই গ্রুপে আছি-🥺🐸-কেও ইনবক্সে নক দিয়ে বলে না জান তোমারে আমি অনেক ভালোবাসি-🥺🤧",
        "আজ থেকে আর কাউকে পাত্তা দিমু না -!😏-কারণ আমি ফর্সা হওয়ার ক্রিম কিনছি -!🙂🐸",
        "তোগো গ্রুপের এড়মিন রাতে বিছানায় মুতে🤧🤓",
        "দূরে যা, তোর কোনো কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣",
        "অনুমতি দিলে 𝚈𝚘𝚞𝚃𝚞𝚋𝚎-এ কল দিতাম..!😒",
        "ওই কিরে গ্রুপে দেখি সব বুইড়া বুইড়া বেড়ি 🤦🏼🍼",
        "বন্ধুর সাথে ছেকা খাওয়া গান শুনতে শুনতে-🤧 -এখন আমিও বন্ধুর 𝙴𝚇 কে অনেক 𝙼𝙸𝚂𝚂 করি-🤕",
        " পুরুষকে সবচেয়ে বেশি কষ্ট দেয় তার শখের নারী...!🥺💔",
        "তোমার লগে দেখা হবে আবার - 😌 -কোনো এক অচেনা গলির চিপায়..!😛🤣",
        "•-কিরে🫵 তরা নাকি prem করস..😐🐸•আমারে একটা করাই দিলে কি হয়-🥺",
        "-প্রিয়-🥺 -তোমাকে না পেলে আমি সত্যি-😪 -আরেকজন কে-😼 -পটাতে বাধ্য হবো-😑🤧",
        "তোর কি চোখে পড়ে না আমি বস শিশির এর সাথে ব্যাস্ত আসি😒",
        "মাইয়া হলে আমার বস শিশির কে Ummmmha দে 😒, এই নে বসের আইড়ি https://www.facebook.com/profile.php?id=61595106187744",
        "- শখের নারী বিছানায় মু'তে..!🙃🥴",
        "বার বার Disturb করেছিস কোনো😾,আমার বস শিশির এর এর সাথে ব্যাস্ত আসি😋",
        "আমি গরীব এর সাথে কথা বলি না😼",
        "কিরে বলদ এত ডাকাডাকি করিস কেনো 🐸, তোরে কি শয়তানে লারে ??",
        "হটাৎ আমাকে মনে পড়লো 🙄",
                "𝗕𝗯𝘆 বলে অসম্মান করচ্ছিছ,😰😿",
                "𝗔𝘀𝘀𝗮𝗹𝗮𝗺𝘂𝗹𝗮𝗶𝗸𝘂𝗺 🐤🐤",
                "আমি তোমার সিনিয়র আপু ওকে 😼সম্মান দেও🙁",
                "খাওয়া দাওয়া করসো 🙄",
                "এত কাছেও এসো না,প্রেম এ পরে যাবো তো 🙈",
                "আরে আমি মজা করার mood এ নাই😒",
                "𝗛𝗲𝘆 𝗛𝗮𝗻𝗱𝘀𝗼𝗺𝗲 বলো 😁😁",
                "আরে Bolo আমার জান, কেমন আসো? 😚",
                "একটা BF খুঁজে দাও 😿",
                "oi mama ar dakis na pilis 😿",
                "amr JaNu lagbe,Tumi ki single aso?",
                "আমাকে না দেকে একটু পড়তেও বসতে তো পারো 🥺🥺",
                "তোর বিয়ে হয় নি 𝗕𝗯𝘆 হইলো কিভাবে,,🙄",
                "আজ একটা ফোন নাই বলে রিপ্লাই দিতে পারলাম না_🙄",
                "চৌধুরী সাহেব আমি গরিব হতে পারি😾🤭 -কিন্তু বড়লোক না🥹 😫",
                "আমি অন্যের জিনিসের সাথে কথা বলি না__😏ওকে",         
                
                
                
            ];
            const mentionObj = utils.realMention(senderName, uid, baseReplies[Math.floor(Math.random() * baseReplies.length)]);
            return await api.sendMessage(mentionObj, event.threadID, (error, info) => {
                if (info) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: "baby",
                        type: "reply",
                        messageID: info.messageID,
                        author: event.senderID
                    });
                }
            }, event.messageID);
        }

        const data = await fetchWithFallback(`/baby?text=${encodeURIComponent(arr)}&senderID=${uid}&threadID=${event.threadID}&font=1`);
        const replyText = utils.monospace(data.reply);
        await api.sendMessage(replyText, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: "baby",
                type: "reply",
                messageID: info.messageID,
                author: event.senderID
            });
        }, event.messageID);
    } catch (err) {
        console.error("onChat Error:", err);
    }
};
