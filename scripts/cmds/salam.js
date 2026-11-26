module.exports.config = {
  name: "salam",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Islamick Cyber Chat",
  description: "Auto reply to Salam",
  commandCategory: "noprefix",
  usages: "assalamu alaikum",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.languages = {
  "vi": {
    "on": "Đã bật tự động trả lời Salam",
    "off": "Đã tắt tự động trả lời Salam",
    "successText": "✅"
  },
  "en": {
    "on": "Auto Salam reply is now ON",
    "off": "Auto Salam reply is now OFF",
    "successText": "✅"
  },
  "ar": {
    "on": "تم تفعيل الرد التلقائي على السلام",
    "off": "تم تعطيل الرد التلقائي على السلام",
    "successText": "✅"
  }
};

const salamList = [
  "assalamu alaikum", "Assalamu alaikum", "Assalamu Alaikum", "assalamualaikum",
  "Assalamualaikum", "আসসালামু আলাইকুম", "ASSALAMUALAIKUM", "salam", "সালাম", "আসসালামু"
];

const imgLinks = [
  "https://i.imgur.com/JtenMLO.jpeg",
  "https://i.imgur.com/kjvZ9iO.jpeg",
  "https://i.imgur.com/uq1X7A4.jpeg",
  "https://i.imgur.com/dMRDrVv.jpeg",
  "https://i.imgur.com/cgtD9cs.jpeg",
  "https://i.imgur.com/YCVtjm3.jpeg",
  "https://i.imgur.com/RGUxNFG.jpeg",
  "https://i.imgur.com/dA3rT0E.jpeg",
  "https://i.imgur.com/oalGZL4.jpeg",
  "https://i.imgur.com/zhSVly7.jpeg",
  "https://i.imgur.com/1dCjbJt.jpeg",
  "https://i.imgur.com/q9TICm1.jpeg",
  "https://i.imgur.com/IlYTb8a.jpeg"
];

module.exports.handleEvent = async ({ api, event, Threads, Users }) => {
  const { threadID, senderID, body } = event;
  if (!body) return;

  const data = (await Threads.getData(threadID)).data || {};
  if (data["salam"] === false) return;

  const lowerBody = body.toLowerCase();
  if (!salamList.some(phrase => lowerBody.startsWith(phrase.toLowerCase()))) return;

  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  const request = global.nodemodule["request"];
  const name = await Users.getNameUser(senderID);
  const path = __dirname + "/cache/salam.jpg";
  const imgURL = imgLinks[Math.floor(Math.random() * imgLinks.length)];

  request(encodeURI(imgURL)).pipe(fs.createWriteStream(path)).on("close", () => {
    api.sendMessage({
      body: `╭•┄┅═══❁🌺❁═══┅┄•╮\n ওয়ালাইকুম সালাম-!!🖤\n╰•┄┅═══❁🌺❁═══┅┄•╯\n\n✿🦋༎প্রি্ঁয়্ঁ গ্রুপ্ঁ মে্ঁম্ঁবা্ঁর্ঁ ${name}༎✨🧡\n⋆✦⋆⎯⎯⎯⎯⎯⎯⎯⎯⎯⋆✦⋆`,
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), event.messageID);
  });
};

module.exports.run = async ({ api, event, Threads, getText }) => {
  const { threadID, messageID } = event;
  const threadData = (await Threads.getData(threadID)).data || {};

  threadData["salam"] = !threadData["salam"];
  await Threads.setData(threadID, { data: threadData });
  global.data.threadData.set(threadID, threadData);

  return api.sendMessage(
    `${getText(threadData["salam"] ? "on" : "off")} ${getText("successText")}`,
    threadID,
    messageID
  );
};
