const fs = require("fs");
module.exports.config = {
	name: "suar",
    version: "1.0.1",
	hasPermssion: 2,
	credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭", //Modify by rX
	description: "jakiya's gali",
	commandCategory: "no prefix",
	usages: "suar",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
	var { threadID, messageID } = event;
	if (event.body.indexOf("suar")==0 || event.body.indexOf("Suar")==0 || event.body.indexOf("sor kuttar bacca")==0 || event.body.indexOf("সুয়ার")==0) {
		var msg = {
				body: "jaki 🎀",
				attachment: fs.createReadStream(__dirname + `/noprefix/suar.mp3`)
			}
			api.sendMessage(msg, threadID, messageID);
    api.setMessageReaction("😡", event.messageID, (err) => {}, true)
		}
	}
	module.exports.run = function({ api, event, client, __GLOBAL }) {

  }
