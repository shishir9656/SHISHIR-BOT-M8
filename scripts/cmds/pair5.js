 const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pair5",
    version: "1.7",
    author: "MahMUD",
    category: "love",
    guide: "{prefix}pair"
  },

  onStart: async function ({ event, threadsData, message, usersData, api }) {
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.\n", event.threadID, event.messageID);
    }

    const uidI = event.senderID;
    const name1 = await usersData.getName(uidI);
    const avatarUrl1 = await usersData.getAvatarUrl(uidI);
    const threadData = await threadsData.get(event.threadID);

    const senderInfo = threadData.members.find(mem => mem.userID == uidI);
    const gender1 = senderInfo?.gender;

    if (!gender1 || (gender1 !== "MALE" && gender1 !== "FEMALE")) {
      return message.reply("❌ Couldn't determine your gender. Please update your profile.");
    }

    const oppositeGender = gender1 === "MALE" ? "FEMALE" : "MALE";

    const candidates = threadData.members.filter(
      member => member.gender === oppositeGender && member.inGroup && member.userID !== uidI
    );

    if (candidates.length === 0) {
      return message.reply(`❌ No ${oppositeGender.toLowerCase()} members found in this group.`);
    }

    const matched = candidates[Math.floor(Math.random() * candidates.length)];

    const name2 = await usersData.getName(matched.userID);
    const avatarUrl2 = await usersData.getAvatarUrl(matched.userID);

    const lovePercent = Math.floor(Math.random() * 36) + 65;
    const compatibility = Math.floor(Math.random() * 36) + 65;

    function toBoldUnicode(name) {
      const boldAlphabet = {
        "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣",
        "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭",
        "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳", "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃",
        "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉", "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍",
        "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓", "U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗",
        "Y": "𝐘", "Z": "𝐙", "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8",
        "9": "9", " ": " ", "'": "'", ",": ",", ".": ".", "-": "-", "!": "!", "?": "?"
      };
      return name.split('').map(char => boldAlphabet[char] || char).join('');
    }

    const styledName1 = toBoldUnicode(name1);
    const styledName2 = toBoldUnicode(name2);

    const styledMessage = `
💖✨ 𝗡𝗲𝘄 𝗣𝗮𝗶𝗿 𝗔𝗹𝗲𝗿𝘁! ✨💖

🎉 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞, 𝐥𝐞𝐭'𝐬 𝐜𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐞 𝐨𝐮𝐫 𝐥𝐨𝐯𝐞𝐥𝐲 𝐧𝐞𝐰 𝐜𝐨𝐮𝐩𝐥𝐞

• ${styledName1}  
• ${styledName2}

❤  𝐋𝐨𝐯𝐞 𝐏𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞: ${lovePercent}%  
🌟 𝐂𝐨𝐦𝐩𝐚𝐭𝐢𝐛𝐢𝐥𝐢𝐭𝐲: ${compatibility}%

💍 𝐌𝐚𝐲 𝐲𝐨𝐮𝐫 𝐥𝐨𝐯𝐞 𝐛𝐥𝐨𝐨𝐦 𝐟𝐨𝐫𝐞𝐯𝐞𝐫`;

    return message.reply({
      body: styledMessage,
      attachment: [
        await getStreamFromURL(avatarUrl1),
        await getStreamFromURL(avatarUrl2)
      ]
    });
  }
};
