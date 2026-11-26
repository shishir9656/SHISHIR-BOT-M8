const { join } = require('path');
const { writeFileSync, existsSync, createReadStream } = require('fs-extra');
const moment = require("moment-timezone");
const axios = require('axios')
module.exports.config = {
    name: "dating",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Dũng, Modded: TuấnDzz",
    description: "Hẹn hò qua messenger?",
    commandCategory: "game",
    usages: "[shop/info/breakup/daily]",
    cooldowns: 0
};

const _1DAY = 1000 * 60 * 60 * 24;

const thinh = ["Chocolate đắng đầu lưỡi nhưng ngọt ở cuống họng, như tình yêu em dành cho anh.", "Bên em thôi, đừng bên ai. Yêu em thôi, đừng thêm ai.", "Như lon coca mùa hè, hạt cacao mùa đông. Em đến bên anh thật nhanh và đúng lúc.", "Một cách đơn giản để hạnh phúc là tôn trọng những gì mình đang có.", "Khi yêu ai đó cách mà người ấy gọi tên bạn cũng khiến bạn mỉm cười hạnh phúc.", "Tình yêu không phải là những lời thề non hẹn biển, chỉ đơn giản là cùng nhau bình yên qua ngày.", "Muốn hạnh phúc trong tình yêu hãy cho đi nhiều hơn, hãy tha thứ, hãy thông cảm, và hãy yêu thương nhiều hơn.", "Em không cần một tình yêu quá lớn, nhưng em cần một tình yêu vừa đủ… để em cảm thấy an tâm.", "Yêu chính là muốn ở cạnh người đó không rời dù chỉ một phút một giây.", "Trăng dưới nước là trăng ngụ trên trời. Người đứng trước mặt là người ngụ ở trong tim.", "Chỉ cần chúng ta yêu ai đó bằng cả trái tim thì đó luôn được gọi là mối tình đầu.", "Nếu phải lựa chọn giữa việc yêu em và không khí để thở. Anh sẽ dùng hơi thở cuối cùng để nói lời yêu em.", "Anh thà làm một hồn ma, ở bên em như một linh hồn vất vưởng còn hơn là lên thiên đàng mà không có em.", "Mỗi ngày thức dậy anh được nghĩ đến em, khi đi ngủ anh có thể mơ về em đối với anh đó là 1 ngày trọn vẹn!", "Tình yêu giống như thiên đường, nhưng nỗi đau nó gây ra thì như địa ngục vậy.", "Đừng vì quá cô đơn mà nắm nhầm 1 bàn tay. Đừng vì quá lạnh mà vội ôm 1 bờ vai", "Sâu thẳm như mối tình đầu và điên cuồng bằng tất cả niềm nuối tiếc.", "Hãy chọn một kết thúc buồn thay vì một nỗi buồn không bao giờ kết thúc.", "Nếu mọi nỗi đau đều có thể quyên đi, thì đâu tồn tại làm gì cái thứ gọi là nước mắt…"];
const TextForHouse = ["Gia đình là điều quan trọng nhất trên thế giới này","Nhà là nơi để trở về","Nhà không cần quá lớn, miễn là trong đó có đủ yêu thương.","Gia đình – đó là nơi bình yên và an toàn nhất trong cuộc đời.","Gia đình là nơi mà khi nghĩ về bạn thấy tâm hồn mình thật bình yên…","Gia đình là nơi cuộc sống bắt đầu và tình yêu không bao giờ kết thúc.","Nhà không phải nơi trú ẩn tạm thời: điều cốt lõi của nó nằm trong tính cách của những người sống trong đó.","Bạn được sinh ra từ gia đình của mình và gia đình được sinh ra từ trong bạn. Không mưu cầu. Không đổi chác.","Yêu thương gia đình nhiều nhất bạn có thể vì đó là điều tuyệt vời nhất mà thượng đế ban tặng cho mỗi người.","Hãy dành thời gian cho gia đình ngay cả khi bạn không hề biết điều gì đã và đang xảy đến với cuộc đời của mình.","Điểm tựa quan trọng nhất trong cuộc đời bạn luôn là gia đình dù bạn có muốn thừa nhận hay không . Đó vẫn là sự thật.","Gia đình là duy nhất trên cuộc đời mà không gì có thể thay thế được, và cho dù bạn có đi bất cứ nơi đâu thì đây cũng là nơi duy nhất chờ mong bạn trở về."];

module.exports.onLoad = function () {
    const path = join(__dirname, 'game', 'dating.json');
    if (!existsSync(path)) { writeFileSync(path, JSON.stringify([], null, 4)) }
    const dataDating = require('./game/dating.json');


    //UPDATE JSON FOR VERSION 1.1.0
    for (let user of dataDating) {
        if (user.data && user.data.pet) {
            for (let pet of user.data.pet) {
                if (!pet.health) pet.health = 'good';
            }
        }
    }
    writeFileSync(path, JSON.stringify(dataDating, null, 4));

    const get_day_of_time = (d1, d2) => {
        let ms1 = d1.getTime();
        let ms2 = d2.getTime();
        return Math.ceil((ms2 - ms1) / (24 * 60 * 60 * 1000));
    };
    setInterval(function () {
        for (let i of dataDating) {
            if (dataDating.length == 0) continue;
            let dayStart = new Date(i.data.timestamp);
            let today = new Date();
            let time = get_day_of_time(dayStart, today);
            i.data.countDays = time;
            //pet check
            if (i.data.pet && i.data.pet.length > 0 && i.data.petLastFeed) {
                if (Date.now() - i.data.petLastFeed > (_1DAY * 2)) {
                    i.data.pet = [];
                    delete i.data.petLastFeed;
                }
                for (pet of i.data.pet) {
                    if (!pet.timeHealtStartBeingBad) continue;
                    if (Date.now() - pet.timeHealtStartBeingBad > (_1DAY * 3)) {
                        delete pet.timeHealtStartBeingBad;
                    }
                }
            }
            writeFileSync(path, JSON.stringify(dataDating, null, 4));
        }
    }, 1000);

    setInterval(() => {
        for (let i of dataDating) {
            if (!i.data.pet) continue;
            for (const petData of i.data.pet) {
                if (Math.random() > 0.7) {
                    if (petData.health == 'good') {
                        petData.health = 'normal';
                    } else {
                        petData.health = 'bad';
                        petData.timeHealtStartBeingBad = Date.now();
                    }
                }
            }
            writeFileSync(path, JSON.stringify(dataDating, null, 4));
        }
    }, 4 * 60 * 60 * 1000);
}

function msgBreakup() {
    var msg = ['Thật sự 2 người không thể làm lành được sao?', 'Cứ như vậy mà buông tay nhau?', 'Không đau sao? Có chứ? Vậy sao còn muốn buông?', 'Vì một lí do nào đó... 2 người có thể cố gắng được không? ^^', 'Tình yêu là khi hai người quan tâm, chăm sóc lẫn nhau. Bây giờ cả 2 bạn đã hiều điều gì đã xảy ra, 2 bạn có thể quay về bên nhau được không', 'Giận để biết yêu nhau nhiều hơn phải không, cả 2 làm lành nhé vì khi giận nhau mới biết đối phương không thể sống thiếu nhau']
    return msg[Math.floor(Math.random() * msg.length)];
}

function getMsg() {
    return `𝐌𝐨̣𝐢 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐮̀𝐧𝐠 𝐭𝐨̛́𝐢 𝐜𝐡𝐮́𝐜 𝐦𝐮̛̀𝐧𝐠 𝐡𝐚̣𝐧𝐡 𝐩𝐡𝐮́𝐜 𝐜𝐡𝐨 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐧𝐚̀𝐲 𝐧𝐚̀𝐨 🥰\n\𝐋𝐮̛𝐮 𝐘́:\n- 𝐂𝐚̉ 𝟐 𝐛𝐚̣𝐧 𝐬𝐞̃ 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐜𝐡𝐢𝐚 𝐭𝐚𝐲 𝐭𝐫𝐨𝐧𝐠 𝐯𝐨̀𝐧𝐠 𝟕 𝐧𝐠𝐚̀𝐲 𝐤𝐞̂̉ 𝐭𝐮̛̀ 𝐤𝐡𝐢 𝐲𝐞̂𝐮 𝐧𝐡𝐚𝐮\n- 𝐂𝐮𝐨̂́𝐢 𝐜𝐮̀𝐧𝐠 𝐜𝐡𝐮́𝐜 𝐜𝐚̉ 𝟐 𝐛𝐚̣𝐧 𝐜𝐨́ 𝐧𝐡𝐢𝐞̂̀𝐮 𝐧𝐢𝐞̂̀𝐦 𝐡𝐚̣𝐧𝐡 𝐩𝐡𝐮́𝐜 𝐤𝐡𝐢 𝐨̛̉ 𝐛𝐞̂𝐧 𝐧𝐡𝐚𝐮, 𝐜𝐚̉𝐦 𝐨̛𝐧 𝐯𝐢̀ 𝐭𝐢𝐧 𝐭𝐮̛𝐨̛̉𝐧𝐠 𝐯𝐚̀ 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐛𝐨𝐭 𝐜𝐮̉𝐚 𝐦𝐢̀𝐧𝐡\n- 𝐊𝐲́ 𝐭𝐞̂𝐧: 𝑵𝒈𝒖𝒚𝒆̂̃𝒏 𝑷𝒉𝒂̣𝒎 𝑴𝒊𝒏𝒉 𝑻𝒖𝒂̂́𝒏 ❤️`
}
module.exports.run = async function ({ api, event, args, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const dataDating = require('./game/dating.json');
    const type = (args[0] || 'false').toLowerCase();
    const input = type
        .replace('nữ', 1)
        .replace('gái', 1)
        .replace('nam', 2)
        .replace('trai', 2)
        .replace('breakup', 3)
        .replace('chiatay', 3)
        .replace('ct', 3)
        .replace('info', 4)
        .replace('-i', 4)
        .replace('shop', 5)
        .replace('-s', 5)
        .replace('daily', 6)
        .replace('diemdanh', 6)
        .replace('top', 7)
        .replace('rank', 7)
        .replace('-r', 7)
        .replace('-t', 7)
        .replace('house', 8)
        .replace('-h', 8)
        .replace('pet', 9)
        .replace('-p', 9)
        .replace('exchange', 10)
        .replace('-e', 10)

    const dataUser = await Users.getData(senderID)
    const author = dataDating.find(i => i.ID_one == senderID || i.ID_two == senderID);
    switch (input) {
        case '1': {
            if (author == undefined) break
            if (author.status == true) return api.sendMessage(`𝐌𝐮𝐨̂́𝐧 𝐜𝐚̆́𝐦 𝐬𝐮̛̀𝐧𝐠 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐚 𝐡𝐚𝐲 𝐬𝐚𝐨 ?, 𝐡𝐚̃𝐲 𝐥𝐚̀𝐦 𝐦𝐨̣̂𝐭 𝐜𝐨𝐧 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐨́ 𝐭𝐫𝐚́𝐜𝐡 𝐧𝐡𝐢𝐞̣̂𝐦 𝐧𝐚̀𝐨. 𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐨̛̉ 𝐭𝐫𝐚̣𝐧𝐠 𝐭𝐡𝐚́𝐢 𝐃𝐚𝐭𝐢𝐧𝐠 𝐫𝐨̂̀𝐢 𝐜𝐨̀𝐧 𝐦𝐮𝐨̂́𝐧 𝐤𝐢𝐞̂́𝐦 𝐭𝐡𝐞̂𝐦 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐤𝐡𝐚́𝐜 𝐚̀ 😈`, threadID, messageID);
            break;
        }
        case '2': {
            if (author == undefined) break
            if (author.status == true) return api.sendMessage(`𝐌𝐮𝐨̂́𝐧 𝐜𝐚̆́𝐦 𝐬𝐮̛̀𝐧𝐠 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐚 𝐡𝐚𝐲 𝐬𝐚𝐨 ?, 𝐡𝐚̃𝐲 𝐥𝐚̀𝐦 𝐦𝐨̣̂𝐭 𝐜𝐨𝐧 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐨́ 𝐭𝐫𝐚́𝐜𝐡 𝐧𝐡𝐢𝐞̣̂𝐦 𝐧𝐚̀𝐨. 𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐨̛̉ 𝐭𝐫𝐚̣𝐧𝐠 𝐭𝐡𝐚́𝐢 𝐃𝐚𝐭𝐢𝐧𝐠 𝐫𝐨̂̀𝐢 𝐜𝐨̀𝐧 𝐦𝐮𝐨̂́𝐧 𝐤𝐢𝐞̂́𝐦 𝐭𝐡𝐞̂𝐦 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐤𝐡𝐚́𝐜 𝐚̀ 😈`, threadID, messageID);
            break;
        }
        case '3': {
            if (author == undefined || author.status == false) return api.sendMessage(`𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐡𝐞̣𝐧 𝐡𝐨̀ 𝐯𝐨̛́𝐢 𝐚𝐢 𝐭𝐡𝐢̀ 𝐜𝐡𝐢𝐚 𝐭𝐚𝐲 𝐜𝐚́𝐢 𝐠𝐢̀ ?`, threadID, messageID);
            if (author.data.countDays < 3) return api.sendMessage(`𝐂𝐨̀𝐧 𝐜𝐡𝐮̛𝐚 𝐭𝐨̛́𝐢 3 𝐧𝐠𝐚̀𝐲 𝐦𝐚̀ 𝐦𝐮𝐨̂́𝐧 𝐜𝐡𝐢𝐚 𝐭𝐚𝐲 𝐥𝐚̀ 𝐬𝐚𝐨? 🥺\n\n${msgBreakup()}\n\n𝐇𝐚̃𝐲 𝐜𝐮̛́ 𝐛𝐢̀𝐧𝐡 𝐭𝐢̃𝐧𝐡 𝐬𝐮𝐲 𝐧𝐠𝐡𝐢̃, 𝐜𝐡𝐨 𝐦𝐨̣𝐢 𝐜𝐡𝐮𝐲𝐞̣̂𝐧 𝐝𝐚̂̀𝐧 𝐥𝐚̆́𝐧𝐠 𝐱𝐮𝐨̂́𝐧𝐠 𝐫𝐨̂̀𝐢 𝐠𝐢𝐚̉𝐢 𝐪𝐮𝐲𝐞̂́𝐭 𝐜𝐮̀𝐧𝐠 𝐧𝐡𝐚𝐮 𝐧𝐡𝐞́ 𝐯𝐢̀ 𝐭𝐢̀𝐧𝐡 𝐲𝐞̂𝐮 𝐤𝐡𝐨̂𝐧𝐠 𝐩𝐡𝐚̉𝐢 𝐚𝐢 𝐜𝐮̃𝐧𝐠 𝐦𝐚𝐲 𝐦𝐚̆́𝐧 𝐭𝐢̀𝐦 𝐭𝐡𝐚̂́𝐲 𝐧𝐡𝐚𝐮 𝐦𝐚̀ ^^`, threadID, messageID);
            return api.sendMessage(`𝐂𝐚̉ 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐡𝐚̣̂𝐭 𝐬𝐮̛̣ 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐢𝐞̂́𝐩 𝐭𝐮̣𝐜 𝐧𝐮̛̃𝐚 𝐡𝐚𝐲 𝐬𝐚𝐨 ?\n𝐂𝐡𝐨 𝐛𝐨𝐭 𝐱𝐢𝐧 𝐩𝐡𝐞́𝐩 𝐱𝐞𝐧 𝐯𝐚̀𝐨 𝐦𝐨̣̂𝐭 𝐜𝐡𝐮́𝐭 𝐧𝐡𝐞́:\n\n${msgBreakup()}\n\n𝐍𝐞̂́𝐮 𝐜𝐨́ 𝐱𝐞𝐦 𝐭𝐡𝐚̂́𝐲 𝐝𝐨̀𝐧𝐠 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲, 𝐡𝐚̃𝐲 𝐜𝐮̛́ 𝐜𝐡𝐨 𝐦𝐨̣𝐢 𝐜𝐡𝐮𝐲𝐞̣̂𝐧 𝐥𝐚̆́𝐧𝐠 𝐱𝐮𝐨̂́𝐧𝐠...𝐘𝐞̂𝐧 𝐥𝐚̣̆𝐧𝐠 𝐦𝐨̣̂𝐭 𝐜𝐡𝐮́𝐭, 𝐬𝐮𝐲 𝐧𝐠𝐡𝐢̃ 𝐜𝐡𝐨 𝐤𝐢̃ 𝐧𝐚̀𝐨...\n𝐂𝐨́ 𝐧𝐡𝐢𝐞̂̀𝐮 𝐭𝐡𝐮̛́...𝐌𝐨̣̂𝐭 𝐤𝐡𝐢 𝐦𝐚̂́𝐭 đ𝐢 𝐭𝐡𝐢̀ 𝐬𝐞̃ 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐢̀𝐦 𝐥𝐚̣𝐢 𝐧𝐮̛̃𝐚. ^^\n\n𝐂𝐨̀𝐧 𝐧𝐞̂́𝐮...𝐕𝐚̂̃𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐢𝐞̂́𝐩 𝐭𝐮̣𝐜 𝐜𝐮̀𝐧𝐠 𝐧𝐡𝐚𝐮 𝐧𝐮̛̃𝐚...𝐂𝐚̉ 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐡𝐚̃𝐲 𝐭𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 𝐯𝐚̀𝐨 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐧𝐡𝐞́ !`, threadID, (error, info) => {
                global.client.handleReaction.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    senderID: senderID,
                    type: input,
                    data: {
                        ID_one: author.ID_one,
                        accept_one: false,
                        ID_two: author.ID_two,
                        accept_two: false
                    }
                });
            }, messageID);
        }
        case '4': {
            if (author == undefined || author.status == false) return api.sendMessage(`𝐁𝐚̣𝐧 𝐅.𝐀 𝐬𝐦𝐥 𝐫𝐚 𝐦𝐚̀ 𝐱𝐞𝐦 𝐢𝐧𝐟𝐨 𝐜𝐚́𝐢 𝐠𝐢̀ 𝐳𝐚̣̂𝐲 𝐡𝐮̛̉ ?`, threadID, messageID);
            const your_name = author.ID_one == senderID ? author.name_one : author.name_two;
            const partner_name = author.ID_two == senderID ? author.name_one : author.name_two;
            var msg = `💓==『 𝐁𝐞𝐞𝐧 𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 』==💓\n\n` + `» ❤️ 𝗧𝗲̂𝗻 𝗰𝘂̉𝗮 𝗯𝗮̣𝗻: ${your_name}\n` + `» 🤍 𝗧𝗲̂𝗻 𝗰𝘂̉𝗮 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗮̂́𝘆: ${partner_name}\n` + `» 💌 𝗛𝗲̣𝗻 𝗵𝗼̀ 𝘃𝗮̀𝗼 𝗹𝘂́𝗰: \n${author.data.days}\n` + `» 📆 𝗬𝗲̂𝘂 𝗻𝗵𝗮𝘂: ${author.data.countDays} 𝗻𝗴𝗮̀𝘆\n` + `» 🎁 𝗘𝘅𝗽 𝘁𝗵𝗮̂𝗻 𝗺𝗮̣̂𝘁: ${author.data.point} 𝗲𝘅𝗽\n` + `» 🎐 𝗫𝗲̂́𝗽 𝗵𝗮̣𝗻𝗴: ${getRank(senderID)}\n` + `──────────────\n` + `» 💘 𝗖𝗵𝗮̂𝗺 𝗻𝗴𝗼̂𝗻 𝘁𝗶̀𝗻𝗵 𝘆𝗲̂𝘂: ${thinh[Math.floor(Math.random() * thinh.length)]}`;
            return api.sendMessage({ body: msg, attachment: await this.canvas(author.ID_two, author.ID_one, 1) }, threadID, messageID);
        }
        case '5': {
            if (author == undefined || author.status == false) return api.sendMessage(`𝐁𝐚̣𝐧 𝐅.𝐀 𝐬𝐦𝐥 𝐫𝐚 𝐦𝐚̀ 𝗺𝘂𝗮 𝐜𝐚́𝐢 𝐠𝐢̀ 𝐳𝐚̣̂𝐲 𝐡𝐮̛̉ ?`, threadID, messageID);
            var shop = [
                { name: 'Hoa', point: 10, money: 1000 },
                { name: 'Nhẫn', point: 20, money: 2000 },
                { name: 'Socola', point: 30, money: 3000 },
                { name: 'Mỹ phẩm', point: 40, money: 4000 },
                { name: 'Vé xem phim', point: 50, money: 5500 },
                { name: 'Sextoy', point: 100, money: 10000 }
            ]
            return api.sendMessage({
                body: "== 𝐒𝐖𝐄𝐄𝐓 𝐋𝐎𝐕𝐄 𝐒𝐇𝐎𝐏 ==\n\n𝟭. 𝗛𝗼𝗮 (𝟭𝟬𝟬𝟬$)\n𝟮. 𝗡𝗵𝗮̂̃𝗻 (𝟮𝟬𝟬𝟬$)\n𝟯. 𝗦𝗼𝗰𝗼𝗹𝗮 (𝟯𝟬𝟬𝟬$)\n𝟰. 𝗠𝘆̃ 𝗽𝗵𝗮̂̉𝗺 (𝟰𝟬𝟬𝟬$)\n𝟱. 𝗩𝗲́ 𝘅𝗲𝗺 𝗽𝗵𝗶𝗺 (𝟱𝟬𝟬𝟬$)\n𝟲. 𝗦𝗲𝘅𝘁𝗼𝘆 (𝟭𝟬𝟬𝟬𝟬$)\n\n\n𝐑𝐞𝐩𝐥𝐲 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐭𝐡𝐞𝐨 𝐬𝐨̂́ 𝐭𝐡𝐮̛ 𝐭𝐮̛̣",
                attachment: await this.image('https://i.imgur.com/lYLFJ8G.jpg')
            },
                threadID, (error, info) => global.client.handleReply.push({
                    type: input,
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    shop,
                    data: author
                }), messageID);
        }
        case '6': {
            if (author == undefined || author.status == false) return api.sendMessage(`𝐅𝐀 𝐦𝐚̀ 𝐝𝐢𝐞𝐦𝐝𝐚𝐧𝐡 𝐜𝐚́𝐢 𝐠𝐢̀ 𝐜𝐨̛ ?`, threadID, messageID);
            if (author.data.daily != null && Date.now() - author.data.daily < 86400000)
                return api.sendMessage(`𝐇𝐨̂𝐦 𝐧𝐚𝐲 𝐜𝐚̉ 𝟐 𝐛𝐚̣𝐧 𝐝𝐢𝐞𝐦𝐝𝐚𝐧𝐡 𝐫𝐨̂̀𝐢 𝐡𝐚̃𝐲 𝐪𝐮𝐚𝐲 𝐥𝐚̣𝐢 𝐬𝐚𝐮 𝟐𝟒 𝐭𝐢𝐞̂́𝐧𝐠 𝐧𝐮̛̃𝐚 𝐧𝐡𝐞́`, threadID, messageID)
            return api.sendMessage(`𝐂𝐚̉ 𝟐 𝐜𝐮̀𝐧𝐠 𝐭𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 [❤] 𝐯𝐚̀𝐨 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐚̀ 𝐜𝐮̀𝐧𝐠 𝐝𝐢𝐞𝐦𝐝𝐚𝐧𝐡 !`, threadID, (error, info) => {
                global.client.handleReaction.push({
                    name: this.config.name,
                    type: input,
                    messageID: info.messageID,
                    senderID: senderID,
                    author: author,
                    data: {
                        ID_one: author.ID_one,
                        accept_one: false,
                        ID_two: author.ID_two,
                        accept_two: false
                    }
                })
            }, messageID);
        }
        case '7': {
            if (dataDating.length == 0) return api.sendMessage('𝐂𝐡𝐮̛𝐚 𝐜𝐨́ 𝐜𝐚̣̆𝐩 𝐧𝐚̀𝐨 𝐭𝐫𝐨𝐧𝐠 𝐝𝐮̛̃ 𝐥𝐢𝐞̣̂𝐮 𝐜𝐮̉𝐚 𝐛𝐨𝐭', threadID, messageID);
            dataDating.sort(function (a, b) { return b.data.point - a.data.point });
            var msg = '️🏆=== [ 𝐓𝐎𝐏 𝐂𝐎𝐔𝐏𝐋𝐄 ] ===️🏆\n\n'
            for (let i = 0; i <= 10; i++) {
                if (dataDating[i] == undefined) continue
                msg += `${i + 1}. ${dataDating[i].name_one} 💓 ${dataDating[i].name_two}\nSố điểm: ${dataDating[i].data.point}\nSố ngày: ${dataDating[i].data.countDays}\n\n`
            }
            return api.sendMessage(msg, threadID, messageID);
        }
        case '8': {
            if (author == undefined || author.status == false) return api.sendMessage(`𝐁𝐚̣𝐧 𝐅.𝐀 𝐬𝐦𝐥 𝐫𝐚 𝐦𝐚̀ 𝗺𝘂𝗮 𝐜𝐚́𝐢 𝐠𝐢̀ 𝐳𝐚̣̂𝐲 𝐡𝐮̛̉ ?`, threadID, messageID);
            var msg = "🏚==== [ 𝐇𝐎𝐔𝐒𝐄 ] ====🏚\n\n𝟏. 𝐍𝐡𝐚̀ 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 🏡\n𝟐. 𝐍𝐚̂𝐧𝐠 𝐂𝐚̂́𝐩/𝐌𝐮𝐚 𝐧𝐡𝐚̀ 🏗\n𝟑. 𝐁𝐚́𝐧 𝐧𝐡𝐚̀ 💸\n\n𝐑𝐞𝐩𝐥𝐲 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐭𝐡𝐞𝐨 𝐬𝐨̂́ 𝐭𝐡𝐮̛́ 𝐭𝐮̛̣";
            return api.sendMessage(msg, threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    type: 'house',
                    messageID: info.messageID,
                    author: senderID,
                    authorData: author
                });
            }, messageID);
        }
        case '9': {
            if (author == undefined || author.status == false) return api.sendMessage(`𝐁𝐚̣𝐧 𝐅.𝐀 𝐬𝐦𝐥 𝐫𝐚 𝐦𝐚̀ 𝗺𝘂𝗮 𝐜𝐚́𝐢 𝐠𝐢̀ 𝐳𝐚̣̂𝐲 𝐡𝐮̛̉ ?`, threadID, messageID);
            var msg = "🐰 ==== [ 𝐏𝐄𝐓 ] ==== 🐰\n\n𝟏. 𝐏𝐞𝐭 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧\n𝟐. 𝐊𝐡𝐚́𝐦 𝐁𝐞̣̂𝐧𝐡\n𝟑. 𝐌𝐮𝐚 𝐏𝐞𝐭\n\n𝐑𝐞𝐩𝐥𝐲 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐭𝐡𝐞𝐨 𝐬𝐨̂́ 𝐭𝐡𝐮̛ 𝐭𝐮̛̣";
            return api.sendMessage(msg, threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    type: 'pet',
                    messageID: info.messageID,
                    author: senderID,
                    authorData: author
                });
            }, messageID);
        }
        case '10': {
            if (!author) return;
            let authorPoint = author.data.point;
            var msg = `𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐜𝐨́ ${authorPoint} 𝐩𝐨𝐢𝐧𝐭, 𝐫𝐞𝐩𝐥𝐲 𝐬𝐨̂́ 𝐩𝐨𝐢𝐧𝐭 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐭𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐞̂̀𝐧 𝐦𝐚̣̆𝐭 💵`;
            return api.sendMessage(msg, threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    type: 'convertToMoney',
                    messageID: info.messageID,
                    authorPoint,
                    author: senderID,
                });
            }, messageID);
        }
        default:
            return api.sendMessage(`𝐁𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐧𝐡𝐚̣̂𝐩 𝐠𝐢𝐨̛́𝐢 𝐭𝐢́𝐧𝐡 𝐜𝐮̉𝐚 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐦𝐚̀ 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐃𝐚𝐭𝐢𝐧𝐠 [𝐧𝐚𝐦/𝐧𝐮̛̃]`, threadID, messageID);
    }
    var { money } = await Currencies.getData(senderID);
    if (money < 2000) return api.sendMessage(`𝐁𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝟐𝟎𝟎𝟎 𝐕𝐍𝐃 𝐭𝐢𝐞̂̀𝐧 𝐩𝐡𝐢́ 𝐦𝐮𝐚 𝐧𝐡𝐚̂̃𝐧 𝐏𝐍𝐉 𝐭𝐚̣̆𝐧𝐠 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐚𝐭𝐢𝐧𝐠 𝐯𝐨̛́𝐢 𝐛𝐚̣𝐧 💍`, threadID, messageID);
    return api.sendMessage(`𝐁𝐚̣𝐧 𝐬𝐞̃ 𝐛𝐢̣ 𝐭𝐫𝐮̛̀ 𝟐𝟎𝟎𝟎 𝐕𝐍𝐃 𝐭𝐢𝐞̂̀𝐧 𝐩𝐡𝐢́ 𝐦𝐮𝐚 𝐧𝐡𝐚̂̃𝐧 𝐏𝐍𝐉 𝐭𝐚̣̆𝐧𝐠 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐚𝐭𝐢𝐧𝐠 𝐯𝐨̛́𝐢 𝐛𝐚̣𝐧 💍\n𝐒𝐨̂́ 𝐭𝐢𝐞̂̀𝐧 𝐧𝐚̀𝐲 𝐬𝐞̃ 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨𝐚̀𝐧 𝐭𝐫𝐚̉ 𝐧𝐞̂́𝐮 𝟏 𝐭𝐫𝐨𝐧𝐠 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧 𝐭𝐢𝐞̂́𝐧 𝐯𝐚̀𝐨 𝐭𝐫𝐚̣𝐧𝐠 𝐭𝐡𝐚́𝐢 𝐃𝐚𝐭𝐢𝐧𝐠 💜\n\n𝐓𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 𝐯𝐚̀𝐨 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐧𝐞̂́𝐮 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧 𝐭𝐢̀𝐦 𝐤𝐢𝐞̂́𝐦 𝐦𝐨̣̂𝐭 𝐧𝐠𝐮̛𝐨̛̀𝐢.`, threadID, (error, info) => {
        global.client.handleReaction.push({
            name: this.config.name,
            type: input,
            messageID: info.messageID,
            senderID: senderID,
            author: dataUser
        });
    }, messageID);
}
function getRank(senderID) {
    var dataDating = require('./noprefix/dating.json');
    dataDating.sort(function (a, b) { return b.data.point - a.data.point })
    var rank = dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID);
    return rank + 1
}
module.exports.handleReply = async function ({ api, event, handleReply, utils, Currencies }) {
    const { threadID, messageID, body, senderID } = event;
    if (handleReply.author != senderID) return
    var { money } = await Currencies.getData(senderID);
    const dataDating = require('./noprefix/dating.json');
    var path = join(__dirname, 'noprefix', 'dating.json');
    var data = handleReply.data;
    var chosenIndex = parseInt(body - 1);
    let type = handleReply.type;
    if (type == 'house') {
        if ((!chosenIndex && chosenIndex != 0) || chosenIndex == NaN || isNaN(chosenIndex) || chosenIndex > 2 || chosenIndex < 0) return api.sendMessage("𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂.", threadID, messageID);

        const Houses = {
            'house-0': {
                image: 'https://i.imgur.com/CuCrUEi.jpg',
                baseImage: 'https://i.imgur.com/hUpEEx4.png',
                cost: 10000000,
                requiredExp: 500,
            },
            'house-1': {
                image: 'https://i.imgur.com/GHlJL6e.jpg',
                baseImage: 'https://i.imgur.com/tnGoXnN.jpg',
                cost: 20000000,
                requiredExp: 1200
            },
            'house-2': {
                image: 'https://i.imgur.com/YOARts2.jpg',
                baseImage: 'https://i.imgur.com/I4ulZBb.jpg',
                cost: 35000000,
                requiredExp: 3000
            },
            'house-3': {
                image: 'https://i.imgur.com/bNQJsmN.jpg',
                baseImage: 'https://i.imgur.com/G8tkgvS.jpg',
                cost: 60000000,
                requiredExp: 5000
            }
        }

        if (chosenIndex == 0) {
            const currentHouse = handleReply.authorData.data.house;
            if ((!currentHouse && currentHouse != 0) || currentHouse < 0 || currentHouse > (Houses.length - 1)) {
                return api.sendMessage('𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐜𝐨́ 𝐜𝐚̆𝐧 𝐧𝐡𝐚̀ 𝐧𝐚̀𝐨 𝐜𝐚̉.', threadID, messageID);
            } else {
                const houseBonus = this.getHouseBonus(currentHouse);
                let msg = `🏡 𝐋𝐞𝐯𝐞𝐥: ${currentHouse == (Houses.length - 1) ? '𝐌𝐀𝐗' : currentHouse}\n💈 𝐄𝐱𝐩 𝐁𝐨𝐧𝐮𝐬: ${houseBonus * 100}%`;

                msg += '\n💟 ' + TextForHouse[Math.floor(Math.random() * TextForHouse.length)];
                let houseBaseImageStream;
                try {
                    houseBaseImageStream = (await axios.get(Houses[`house-${currentHouse}`].baseImage, { responseType: "stream" })).data;
                } catch (e) {
                    return console.log(e);
                }
                api.unsendMessage(handleReply.messageID);

                return api.sendMessage({
                    body: msg,
                    attachment: houseBaseImageStream
                }, threadID, messageID);
            }
        } else if (chosenIndex == 1) {
            let houseImages = [];
            for (const house in Houses) {
                try {
                    let imageStream = (await axios.get(Houses[house].image, { responseType: 'stream' })).data;
                    houseImages.push(imageStream);
                } catch (e) {
                    return api.sendMessage("Đ𝐚̃ 𝐜𝐨́ 𝐥𝐨̂̃𝐢 𝐱𝐚̉𝐲 𝐫𝐚..", threadID, () => console.log(e), messageID);
                }
            }
            var msg = {
                body: '𝐇𝐚̃𝐲 𝐜𝐡𝐨̣𝐧 𝐜𝐡𝐨 𝐦𝐢̀𝐧𝐡 𝐦𝐨̣̂𝐭 𝐜𝐚̆𝐧 🏡\n\n𝟏. 𝟏𝟎𝟎𝟎𝟎𝟎𝟎𝟎$ (500 𝐞𝐱𝐩)\n𝟐. 𝟐𝟎𝟎𝟎𝟎𝟎𝟎𝟎$ (1200 𝐞𝐱𝐩)\n𝟑. 𝟑𝟓𝟎𝟎𝟎𝟎𝟎𝟎$ (3000 𝐞𝐱𝐩)\n𝟒. 𝟔𝟎𝟎𝟎𝟎𝟎𝟎𝟎$ (5000 𝐞𝐱𝐩)\n\n𝐁𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐨̛̉ 𝐦𝐨̣̂𝐭 𝐦𝐨̂́𝐜 𝐞𝐱𝐩 𝐭𝐡𝐚̂𝐧 𝐦𝐚̣̂𝐭 𝐧𝐡𝐚̂́𝐭 𝐭𝐮̛𝐨̛𝐧𝐠 𝐮̛́𝐧𝐠 𝐧𝐞̂́𝐮 𝐦𝐮𝐨̂́𝐧 𝐦𝐮𝐚 𝐧𝐡𝐚̀, 𝐬𝐞̃ 𝐤𝐡𝐨̂𝐧𝐠 𝐦𝐚̂́𝐭 𝐞𝐱𝐩 𝐤𝐡𝐢 𝐦𝐮𝐚.\n𝐑𝐞𝐩𝐥𝐲 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐭𝐡𝐞𝐨 𝐬𝐨̂́ 𝐭𝐡𝐮̛́ 𝐭𝐮̛̣',
                attachment: houseImages
            }

            return api.sendMessage(msg, threadID, (err, info) => {
                if (err) return console.log(err);
                global.client.handleReply.push({
                    name: this.config.name,
                    type: 'shop-house',
                    messageID: info.messageID,
                    author: senderID,
                    data: Houses,
                    authorData: handleReply.authorData
                });
                api.unsendMessage(handleReply.messageID);
            }, messageID);
        } else {
            const currentHouse = handleReply.authorData.data.house;
            if (!currentHouse || currentHouse < 0 || currentHouse > (Houses.length - 1)) {
                return api.sendMessage('𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐜𝐨́ 𝐜𝐚̆𝐧 𝐧𝐡𝐚̀ 𝐧𝐚̀𝐨 𝐜𝐚̉.', threadID, messageID);
            } else {
                const houseCost = Houses[`house-${currentHouse}`].cost * this.houseSellCostPercent(Houses[`house-${currentHouse}`].cost);
                return api.sendMessage(`𝐁𝐚̣𝐧 𝐜𝐨́ 𝐜𝐡𝐚̆́𝐜 𝐦𝐮𝐨̂́𝐧 𝐛𝐚́𝐧 𝐧𝐡𝐚̀?\n𝐓𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 [👍] 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐧𝐞̂́𝐮 𝐦𝐮𝐨̂́𝐧 𝐛𝐚́𝐧 𝐯𝐚̀ 𝐛𝐚̣𝐧 𝐬𝐞̃ 𝐧𝐡𝐚̣̂𝐧 𝐯𝐞̂̀ ${houseCost} 𝐕𝐍𝐃`, threadID, (err, info) => {
                    if (err) return console.log(err);
                    global.client.handleReaction.push({
                        name: this.config.name,
                        type: '9',
                        messageID: info.messageID,
                        houseCost,
                        senderID,
                        authorData: handleReply.authorData
                    });
                    api.unsendMessage(handleReply.messageID);
                }, messageID);
            }
        }
    }
    else if (type == 'pet') {
        if ((!chosenIndex && chosenIndex != 0) || chosenIndex == NaN || isNaN(chosenIndex) || chosenIndex > 2 || chosenIndex < 0) return api.sendMessage("𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂.", threadID, messageID);

        const Pets = {
            'dog': {
                image: 'https://i.imgur.com/KNu7vtI.png',
                expCost: 600
            },
            'cat': {
                image: 'https://i.imgur.com/xsrk4b5.png',
                expCost: 800
            },
            'fox': {
                image: 'https://i.imgur.com/76m6vFL.png',
                expCost: 1000
            },
            'unicorn': {
                image: 'https://i.imgur.com/jVZMVAI.png',
                expCost: 1200
            }
        }

        if (chosenIndex == 0) {
            if ((!handleReply.authorData.data.pet && handleReply.authorData.data.pet != 0) || handleReply.authorData.data.pet.length == 0) return api.sendMessage("𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐜𝐨́ 𝐩𝐞𝐭 𝐧𝐚̀𝐨 𝐜𝐚̉.", threadID, messageID);
            else {
                const pet = handleReply.authorData.data.pet;
                const petImages = [], petNames = [];
                const PetKeys = Object.keys(Pets);
                let moneyForFeed = 0;
                if (handleReply.authorData.data.petLastFeed && handleReply.authorData.data.petLastFeed < Date.now() - (_1DAY / 6)) {
                    moneyForFeed = this.getPetFeedCost(pet);
                }
                
                for (let i = 0; i < pet.length; i++) {
                    try {
                        let petImageStream = (await axios.get(Pets[PetKeys[pet[i].id]].image, { responseType: "stream" })).data;
                        petNames.push(PetKeys[pet[i].id]);
                        petImages.push(petImageStream);
                    } catch (e) {
                        return console.log(e);
                    }
                }
                let msg = '🐰== [ 𝐓𝐇𝐔́ 𝐂𝐔̛𝐍𝐆 ] ==🐰\n';
                for (eachPet of pet) {
                    msg += `\n• ${eachPet.name.charAt(0).toUpperCase() + eachPet.name.slice(1)}\n» 𝐓𝐢̀𝐧𝐡 𝐓𝐫𝐚̣𝐧𝐠: ${eachPet.health == 'good' ? '𝐊𝐡𝐨̉𝐞 𝐌𝐚̣𝐧𝐡' : eachPet.health == 'normal' ? '𝐁𝐢̀𝐧𝐡 𝐓𝐡𝐮̛𝐨̛̀𝐧𝐠' : '𝐍𝐠𝐮𝐲 𝐊𝐢̣𝐜𝐡'}\n`;
                }
                msg += `\n→ 𝐄𝐱𝐩 𝐁𝐨𝐧𝐮𝐬: ${this.getPetBonus(pet, handleReply.authorData) * 100}%`;
                if (moneyForFeed > 0) {
                    msg += `\n𝐏𝐞𝐭 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐜𝐨́ 𝐯𝐞̉ 𝐜𝐚̂̀𝐧 𝐜𝐡𝐨 𝐚̆𝐧\n𝐓𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 [👍] 𝐜𝐡𝐨 𝐩𝐞𝐭 𝐚̆𝐧, 𝐓𝐨̂̉𝐧𝐠 𝐭𝐢𝐞̂̀𝐧 𝐦𝐮𝐚 𝐭𝐡𝐮̛́𝐜 𝐚̆𝐧 𝐜𝐡𝐨 𝐩𝐞𝐭 𝐥𝐚̀: ${moneyForFeed} 𝐕𝐍𝐃`;
                }
                api.sendMessage({
                    body: msg,
                    attachment: petImages
                }, threadID, (err, info) => {
                    if (err) return console.log(err);
                    global.client.handleReaction.push({
                        name: this.config.name,
                        type: '10',
                        messageID: info.messageID,
                        moneyForFeed,
                        senderID,
                        authorData: handleReply.authorData
                    });
                    api.unsendMessage(handleReply.messageID);
                }, messageID);
            }
        } else if (chosenIndex == 1) {
            if ((!handleReply.authorData.data.pet && handleReply.authorData.data.pet != 0) || handleReply.authorData.data.pet.length == 0) return api.sendMessage("𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐜𝐨́ 𝐩𝐞𝐭 𝐧𝐚̀𝐨 𝐜𝐚̉.", threadID, messageID);
            else {
                const pets = handleReply.authorData.data.pet;
                let BAD_HEALTH_COUNT = pets.reduce((pre, pet) => {
                    return pre += pet.health == 'bad' ? 1 : 0;
                }, 0);

                let msg = '🐰== [ 𝐓𝐇𝐔́ 𝐂𝐔̛𝐍𝐆 ] ==🐰\n',
                    medicalCost;
                for (let pet of pets) {
                    msg += `\n• ${pet.name.charAt(0).toUpperCase() + pet.name.slice(1)}\n» 𝐓𝐢̀𝐧𝐡 𝐓𝐫𝐚̣𝐧𝐠: ${pet.health == 'good' ? '𝐊𝐡𝐨̉𝐞 𝐌𝐚̣𝐧𝐡' : pet.health == 'normal' ? '𝐁𝐢̀𝐧𝐡 𝐓𝐡𝐮̛𝐨̛̀𝐧𝐠' : '𝐍𝐠𝐮𝐲 𝐊𝐢̣𝐜𝐡'}\n`;
                }
                if (BAD_HEALTH_COUNT > 0) {
                    medicalCost = this.getMedicalCost(pets);
                    msg += `\n\n𝐇𝐢𝐞̣̂𝐧 𝐜𝐨́ ${BAD_HEALTH_COUNT} 𝐩𝐞𝐭 𝐛𝐢̣ 𝐛𝐞̣̂𝐧𝐡,𝐓𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 [👍] 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐜𝐡𝐮̛̃𝐚 𝐛𝐞̣̂𝐧𝐡 𝐯𝐨̛́𝐢 𝐜𝐡𝐢 𝐩𝐡𝐢́ 𝐥𝐚̀ ${medicalCost} 𝐕𝐍𝐃`
                }

                api.sendMessage(msg, threadID, (err, info) => {
                    if (err) return console.log(err);
                    if (BAD_HEALTH_COUNT > 0) {
                        global.client.handleReaction.push({
                            name: this.config.name,
                            type: '12',
                            messageID: info.messageID,
                            senderID,
                            authorData: handleReply.authorData,
                            medicalCost
                        });
                        api.unsendMessage(handleReply.messageID);
                    }
                }, messageID);
            }
        } else {
            let petStoreImage, petStoreImageURL = 'https://i.imgur.com/osx3yjH.jpg';
            try {
                let imageStream = (await axios.get(petStoreImageURL, { responseType: 'stream' })).data;
                petStoreImage = imageStream;
            } catch (e) {
                return api.sendMessage("Đ𝐚̃ 𝐜𝐨́ 𝐥𝐨̂̃𝐢 𝐱𝐚̉𝐲 𝐫𝐚..", threadID, () => console.log(e), messageID);
            }
            var msg = {
                body: '𝐇𝐚̃𝐲 𝐜𝐡𝐨̣𝐧 𝐜𝐡𝐨 𝐦𝐢̀𝐧𝐡 𝟏 𝐩𝐞𝐭\n\n𝟏. 𝐃𝐨𝐠 🐶 (𝟔𝟎𝟎 𝐄𝐱𝐩)\n𝟐. 𝐂𝐚𝐭 🐱 (𝟖𝟎𝟎 𝐄𝐱𝐩)\n𝟑. 𝐅𝐨𝐱 🦊 (𝟏𝟎𝟎𝟎 𝐄𝐱𝐩)\n𝟒. 𝐊𝐢̀ 𝐥𝐚̂𝐧 🦄 (𝟏𝟐𝟎𝟎 𝐄𝐱𝐩)\n\n𝐑𝐞𝐩𝐥𝐲 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐭𝐡𝐞𝐨 𝐬𝐨̂́ 𝐭𝐡𝐮̛́ 𝐭𝐮̛̣',
                attachment: petStoreImage
            }

            api.sendMessage(msg, threadID, (err, info) => {
                if (err) return console.log(err);
                global.client.handleReply.push({
                    name: this.config.name,
                    type: 'shop-pet',
                    messageID: info.messageID,
                    author: senderID,
                    data: Pets,
                    authorData: handleReply.authorData
                });
                api.unsendMessage(handleReply.messageID);
            }, messageID);
        }
    }
    else if (type == 'shop-house') {
        if ((!chosenIndex && chosenIndex != 0) || chosenIndex == NaN || isNaN(chosenIndex) || chosenIndex > (data.length - 1) || chosenIndex < 0) {
            return api.sendMessage("𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂.", threadID, messageID);
        }
        const currentHouse = handleReply.authorData.data.house;
        if (currentHouse == chosenIndex && currentHouse == data.length) {
            return api.sendMessage("𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐬𝐨̛̉ 𝐡𝐮̛̃𝐮 𝐜𝐚̆𝐧 𝐧𝐡𝐚̀ 𝐱𝐢̣𝐧 𝐧𝐡𝐚̂́𝐭 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐫𝐨̂̀𝐢.", threadID, messageID);
        } else if (currentHouse == chosenIndex) {
            return api.sendMessage("𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐬𝐨̛̉ 𝐡𝐮̛̃𝐮 𝐜𝐚̆𝐧 𝐧𝐡𝐚̀ 𝐧𝐚̀𝐲 𝐫𝐨̂̀𝐢!", threadID, messageID);
        } else {
            const cost = this.houseUpgrade(currentHouse, chosenIndex);
            if (money < cost) {
                return api.sendMessage(`𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 đ𝐮̉ 𝐭𝐢𝐞̂̀𝐧 đ𝐞̂̉ 𝐦𝐮𝐚/𝐧𝐚̂𝐧𝐠 𝐜𝐚̂́𝐩 𝐧𝐡𝐚̀, 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐭𝐡𝐞̂𝐦: ${cost - money}$`, threadID, messageID);
            } else if (handleReply.authorData.data.point < handleReply.data[`house-${chosenIndex}`].requiredExp) {
                return api.sendMessage(`𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 đ𝐮̉ 𝐞𝐱𝐩 𝐭𝐡𝐚̂𝐧 𝐦𝐚̣̂𝐭 đ𝐞̂̉ 𝐦𝐮𝐚, 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐭𝐡𝐞̂𝐦 ${handleReply.data[`house-${chosenIndex}`].requiredExp - handleReply.authorData.data.point} 𝐞𝐱𝐩`, threadID, messageID);
            } else {
                await Currencies.setData(senderID, { money: money - cost });
                api.unsendMessage(handleReply.messageID);
                dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.house = chosenIndex;
                writeFileSync(path, JSON.stringify(dataDating, null, 2));
                return api.sendMessage(`𝐌𝐮𝐚/𝐧𝐚̂𝐧𝐠 𝐜𝐚̂́𝐩 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠!\n𝐓𝐮̛̀ 𝐠𝐢𝐨̛̀ 𝐦𝐨̣𝐢 𝐄𝐱𝐩 𝐭𝐡𝐚̂𝐧 𝐦𝐚̣̂𝐭 𝐧𝐡𝐚̣̂𝐧 𝐯𝐚̀𝐨 đ𝐞̂̀𝐮 đ𝐮̛𝐨̛̣𝐜 𝐭𝐚̆𝐧𝐠 𝐭𝐡𝐞̂𝐦: ${this.getHouseBonus(chosenIndex) * 100}%`, threadID, messageID);
            }
        }
    }
    else if (type == 'shop-pet') {
        if ((!chosenIndex && chosenIndex != 0) || chosenIndex == NaN || isNaN(chosenIndex) || chosenIndex > (data.length - 1) || chosenIndex < 0) {
            return api.sendMessage("𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂.", threadID, messageID);
        }
        const currentPet = handleReply.authorData.data.pet || [];
        const currentExp = handleReply.authorData.data.point;
        const dataKeys = Object.keys(data);
        const chosenPet = data[dataKeys[chosenIndex]];
        if (currentPet.some(e => e.id == chosenIndex)) {
            return api.sendMessage("𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐬𝐨̛̉ 𝐡𝐮̛̃𝐮 𝐩𝐞𝐭 𝐧𝐚̀𝐲 𝐫𝐨̂̀𝐢!", threadID, messageID);
        } else if (currentExp < chosenPet.expCost) {
            return api.sendMessage(`𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 đ𝐮̉ 𝐞𝐱𝐩 𝐭𝐡𝐚̂𝐧 𝐦𝐚̣̂𝐭 đ𝐞̂̉ 𝐦𝐮𝐚, 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐭𝐡𝐞̂𝐦 ${chosenPet.expCost - currentExp} 𝐞𝐱𝐩`, threadID, messageID);
        } else {
            currentPet.push({
                id: chosenIndex,
                name: dataKeys[chosenIndex],
                health: 'good'
            });
            if (!dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.hasOwnProperty('petLastFeed')) {
                dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.petLastFeed = Date.now();
            }
            api.unsendMessage(handleReply.messageID);
            dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.pet = currentPet;
            dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.point -= chosenPet.expCost;
            writeFileSync(path, JSON.stringify(dataDating, null, 2));
            let petImage;
            try {
                petImage = (await axios.get(chosenPet.image, { responseType: 'stream' })).data;
            } catch (e) {
                return console.log(e);
            }
            return api.sendMessage({
                body: `𝐌𝐮𝐚 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠!\n𝐓𝐮̛̀ 𝐠𝐢𝐨̛̀ 𝐦𝐨̣𝐢 𝐄𝐱𝐩 𝐭𝐡𝐚̂𝐧 𝐦𝐚̣̂𝐭 𝐧𝐡𝐚̣̂𝐧 𝐯𝐚̀𝐨 đ𝐞̂̀𝐮 đ𝐮̛𝐨̛̣𝐜 𝐭𝐚̆𝐧𝐠 𝐭𝐡𝐞̂𝐦: ${this.getPetBonus(currentPet) * 100}%`,
                attachment: petImage
            }, threadID, messageID);
        }
    }
    else if (type == 'convertToMoney') {
        chosenIndex++;
        if (!chosenIndex || chosenIndex == NaN || isNaN(chosenIndex) || chosenIndex > handleReply.authorPoint || chosenIndex < 0) {
            return api.sendMessage("𝐒𝐨̂́ 𝐩𝐨𝐢𝐧𝐭 𝐛𝐚̣𝐧 𝐧𝐡𝐚̣̂𝐩 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂.", threadID, messageID);
        } else {
            api.unsendMessage(handleReply.messageID);
            return api.sendMessage(`𝐁𝐚̣𝐧 𝐬𝐞̃ 𝐝𝐮̀𝐧𝐠 ${chosenIndex} 𝐞𝐱𝐩 𝐯𝐚̀ 𝐧𝐡𝐚̣̂𝐧 𝐥𝐚̣𝐢 ${chosenIndex * 20}$\n𝐓𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 [👍] 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐧𝐞̂́𝐮 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧`, threadID, (err, info) => {
                if (err) return console.log(err);
                global.client.handleReaction.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    chosenPoint: chosenIndex,
                    senderID,
                    type: '11'
                });
            }, messageID);
        }
    }
    else {
        if (money < handleReply.shop[parseInt(body) - 1].money) return api.sendMessage(`Bạn không đủ ${handleReply.shop[parseInt(body) - 1].money} để mua vật phẩm`, threadID, messageID);
        await Currencies.setData(senderID, { money: money - handleReply.shop[parseInt(body) - 1].money });
        let pointToIncrease = handleReply.shop[parseInt(body) - 1].point;
        let bonusPercent = 0;
        let isHungry = false;
        let lastFeed = handleReply.data.data.petLastFeed;
        if (lastFeed && lastFeed != NaN && !isNaN(lastFeed)) {
            let timeNow = Date.now();
            if (lastFeed < timeNow - (24 * 60 * 60 * 1000)) {
                isHungry = true;
            }
        }
        if (handleReply.data.data.pet && handleReply.data.data.pet.length > 0 && isHungry == false) {
            bonusPercent += this.getPetBonus(handleReply.data.data.pet, handleReply.data);
        }
        if (handleReply.data.data.house && handleReply.data.data.house != NaN && !isNaN(handleReply.data.data.house)) {
            bonusPercent += this.getHouseBonus(handleReply.data.data.house);
        }

        handleReply.data.data.point += Math.floor(pointToIncrease * (1 + bonusPercent));
        dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)] = handleReply.data;
        writeFileSync(path, JSON.stringify(dataDating, null, 4));
        api.unsendMessage(handleReply.messageID);
        return api.sendMessage(`𝐌𝐮𝐚 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐯𝐚̀ 𝐭𝐚̣̆𝐧𝐠 𝐪𝐮𝐚̀ 𝐜𝐡𝐨 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐲𝐞̂𝐮 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠\n𝐄𝐱𝐩 𝐭𝐡𝐚̂𝐧 𝐦𝐚̣̂𝐭 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐯𝐚̀ 𝐧𝐲 𝐭𝐚̆𝐧𝐠 ${pointToIncrease} (+${Math.floor(pointToIncrease * bonusPercent)}), 𝐭𝐨̂̉𝐧𝐠: ${handleReply.data.data.point}`, threadID, () => {
            if (isHungry == true) api.sendMessage(`𝐂𝐨́ 𝐯𝐞̉ 𝐩𝐞𝐭 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐜𝐡𝐨 𝐚̆𝐧, 𝐧𝐞̂́𝐮 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐡𝐨 𝐩𝐞𝐭 𝐚̆𝐧 𝐪𝐮𝐚́ 𝐦𝐨̣̂𝐭 𝐧𝐠𝐚̀𝐲 𝐛𝐚̣𝐧 𝐬𝐞̃ 𝐦𝐚̂́𝐭 𝐩𝐞𝐭`, threadID);
        })
    }
}
module.exports.handleReaction = async function ({ api, event, Threads, Users, Currencies, handleReaction }) {
    var { threadID, reaction, messageID, userID } = event;
    var { type, senderID, author, love, data, houseCost, moneyForFeed, chosenPoint, medicalCost } = handleReaction;
    var dataDating = require('./game/dating.json');
    var path = join(__dirname, 'game', 'dating.json');
    var { money } = await Currencies.getData(senderID);
    switch (type) {
        case '1': {
            if (senderID != userID) return;
            api.unsendMessage(handleReaction.messageID)
            var dataGroup = (await Threads.getInfo(threadID)).userInfo;
            await Currencies.setData(senderID, { money: money - 2000 });
            var genderFilter = [];
            for (var i of dataGroup) {
                if (i.gender == 'FEMALE' && i.id != api.getCurrentUserID() && i.id != senderID) {
                    var a = dataDating.some(i => i.ID_one == i.id || i.ID_two == i.id);
                    if (a != true) {
                        genderFilter.push({
                            ID: i.id,
                            name: i.name
                        })
                    }
                }
            }
            if (genderFilter.length == 0) return api.sendMessage(`𝐑𝐚̂́𝐭 𝐭𝐢𝐞̂́𝐜, 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐦𝐚̀ 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐭𝐢̀𝐦 𝐡𝐨𝐚̣̆𝐜 𝐡𝐨̣ 𝐜𝐨́ 𝐡𝐞̣𝐧 𝐡𝐨̀ 𝐯𝐨̛́𝐢 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐤𝐡𝐚́𝐜 𝐦𝐚̂́𝐭 𝐫𝐨̂̀𝐢 ^^`, threadID);
            var random = genderFilter[Math.floor(Math.random() * genderFilter.length)];
            var msg = {
                body: `[💏] ${author.name} - 𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐦𝐚̀ 𝐡𝐞̣̂ 𝐭𝐡𝐨̂́𝐧𝐠 𝐜𝐡𝐨̣𝐧 𝐜𝐡𝐨 𝐛𝐚̣𝐧 𝐥𝐚̀: ${random.name}\n[💌] 𝐏𝐡𝐮̀ 𝐇𝐨̛̣𝐩: ${Math.floor(Math.random() * (80 - 30) + 30)}%\n\n𝐍𝐞̂́𝐮 𝐜𝐚̉ 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧 𝐝𝐚𝐭𝐢𝐧𝐠, 𝐡𝐚̃𝐲 𝐜𝐮̀𝐧𝐠 𝐧𝐡𝐚𝐮 𝐭𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 𝐭𝐫𝐚́𝐢 𝐭𝐢𝐦 [❤] 𝐯𝐚̀𝐨 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐚̀ 𝐜𝐡𝐢́𝐧𝐡 𝐭𝐡𝐮̛́𝐜 𝐭𝐫𝐚̣𝐧𝐠 𝐭𝐡𝐚́𝐢 𝐝𝐚𝐭𝐢𝐧𝐠 𝐯𝐨̛́𝐢 𝐧𝐡𝐚𝐮`,
                mentions: [{ tag: random.name, id: random.ID }, { tag: author.name, id: senderID }]
            }
            return api.sendMessage(msg, threadID, (error, info) => {
                global.client.handleReaction.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    senderID: senderID,
                    type: "8",
                    author: {
                        ID: senderID,
                        name: author.name,
                        accept: false
                    },
                    love: {
                        ID: random.ID,
                        name: random.name,
                        accept: false
                    }
                });
            });
        }
        case '2': {
            if (senderID != userID) return;
            api.unsendMessage(handleReaction.messageID)
            var dataGroup = (await Threads.getInfo(threadID)).userInfo;
            await Currencies.setData(senderID, { money: money - 2000 });
            var genderFilter = [];
            for (var i of dataGroup) {
                if (i.gender == 'MALE' && i.id != api.getCurrentUserID() && i.id != senderID) {
                    var a = dataDating.some(i => i.ID_one == i.id || i.ID_two == i.id);
                    if (a != true) {
                        genderFilter.push({
                            ID: i.id,
                            name: i.name
                        })
                    }
                }
            }
            if (genderFilter.length == 0) return api.sendMessage(`𝐑𝐚̂́𝐭 𝐭𝐢𝐞̂́𝐜, 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐦𝐚̀ 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐭𝐢̀𝐦 𝐡𝐨𝐚̣̆𝐜 𝐡𝐨̣ 𝐜𝐨́ 𝐡𝐞̣𝐧 𝐡𝐨̀ 𝐯𝐨̛́𝐢 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐤𝐡𝐚́𝐜 𝐦𝐚̂́𝐭 𝐫𝐨̂̀𝐢 ^^`, threadID);
            var random = genderFilter[Math.floor(Math.random() * genderFilter.length)];
            var msg = {
                body: `[💏] ${author.name} - 𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐦𝐚̀ 𝐡𝐞̣̂ 𝐭𝐡𝐨̂́𝐧𝐠 𝐜𝐡𝐨̣𝐧 𝐜𝐡𝐨 𝐛𝐚̣𝐧 𝐥𝐚̀: ${random.name}\n[💌] 𝐏𝐡𝐮̀ 𝐇𝐨̛̣𝐩: ${Math.floor(Math.random() * (80 - 30) + 30)}%\n\n𝐍𝐞̂́𝐮 𝐜𝐚̉ 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧 𝐝𝐚𝐭𝐢𝐧𝐠, 𝐡𝐚̃𝐲 𝐜𝐮̀𝐧𝐠 𝐧𝐡𝐚𝐮 𝐭𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 𝐭𝐫𝐚́𝐢 𝐭𝐢𝐦 [❤] 𝐯𝐚̀𝐨 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐚̀ 𝐜𝐡𝐢́𝐧𝐡 𝐭𝐡𝐮̛́𝐜 𝐭𝐫𝐚̣𝐧𝐠 𝐭𝐡𝐚́𝐢 𝐝𝐚𝐭𝐢𝐧𝐠 𝐯𝐨̛́𝐢 𝐧𝐡𝐚𝐮`,
                mentions: [{ tag: random.name, id: random.ID }, { tag: author.name, id: senderID }]
            }
            return api.sendMessage(msg, threadID, (error, info) => {
                global.client.handleReaction.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    senderID: senderID,
                    type: "8",
                    author: {
                        ID: senderID,
                        name: author.name,
                        accept: false
                    },
                    love: {
                        ID: random.ID,
                        name: random.name,
                        accept: false
                    }
                });
            });
        }
        case '3': {
            if (userID == data.ID_one) data.accept_one = true;
            if (userID == data.ID_two) data.accept_two = true;
            var findIndex = dataDating.find(i => i.ID_one == userID || i.ID_two == userID);
            if (data.accept_one == true && data.accept_two == true) {
                api.changeNickname('', threadID, data.ID_one);
                api.changeNickname('', threadID, data.ID_two);
                dataDating.splice(findIndex, 1);
                writeFileSync(path, JSON.stringify(dataDating, null, 4));
                var msg = { body: '𝐁𝐞̂𝐧 𝐧𝐡𝐚𝐮 𝐯𝐚̀𝐨 𝐧𝐡𝐮̛̃𝐧𝐠 𝐥𝐮́𝐜 𝐠𝐢𝐨̂𝐧𝐠 𝐛𝐚̃𝐨, 𝐧𝐡𝐮̛𝐧𝐠 𝐥𝐚̣𝐢 𝐜𝐡𝐚̆̉𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐜𝐨́ 𝐧𝐡𝐚𝐮 𝐯𝐚̀𝐨 𝐥𝐮́𝐜 𝐦𝐮̛𝐚 𝐭𝐚𝐧 🙁\n𝐇𝐚̃𝐲 𝐯𝐮𝐢 𝐥𝐞̂𝐧 𝐧𝐡𝐞́, 𝐜𝐨́ 𝐧𝐡𝐮̛̃𝐧𝐠 𝐥𝐮́𝐜 𝐡𝐨̛̣𝐩 𝐫𝐨̂̀𝐢 𝐥𝐚̣𝐢 𝐭𝐚𝐧 𝐦𝐨̛́𝐢 𝐤𝐡𝐢𝐞̂́𝐧 𝐛𝐚̉𝐧 𝐭𝐡𝐚̂𝐧 𝐦𝐢̀𝐧𝐡 𝐦𝐚̣𝐧𝐡 𝐦𝐞̃ 𝐡𝐨̛𝐧 𝐧𝐮̛̃𝐚 𝐜𝐡𝐮̛́', attachment: await this.canvas(data.ID_one, data.ID_two, 0) }
                return api.sendMessage(msg, threadID, messageID)
            }
            break
        }
        case '8': {
            if (reaction != '❤') return;
            if (userID == author.ID) author.accept = true;
            if (userID == love.ID) love.accept = true;
            if (author.accept == true && love.accept == true) {
                api.unsendMessage(handleReaction.messageID);
                const dataUser = await Users.getData(love.ID);
                var userTwo = {
                    name_one: dataUser.name,
                    ID_one: love.ID,
                    name_two: author.name,
                    ID_two: author.ID,
                    status: true,
                    data: {
                        days: moment.tz("Asia/Ho_Chi_minh").format("hh:mm:ss DD/MM/YYYY"),
                        countDays: 0,
                        point: 0,
                        daily: null,
                        timestamp: Date.now()
                    }
                }
                dataDating.push(userTwo)
                writeFileSync(path, JSON.stringify(dataDating, null, 4));
                return api.sendMessage(`𝐂𝐚̉ 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐯𝐮̛̀𝐚 𝐜𝐮̀𝐧𝐠 𝐧𝐡𝐚𝐮 𝐭𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜, 𝐧𝐠𝐡𝐢̃𝐚 𝐥𝐚̀ 𝐜𝐚̉ 𝟐 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧 𝐭𝐢𝐞̂́𝐧 𝐭𝐨̛́𝐢 𝐡𝐞̣𝐧 𝐡𝐨̀ 💓`, threadID, async (error, info) => {
                    let one_name = await Users.getNameUser(userTwo.ID_one);
                    let two_name = await Users.getNameUser(userTwo.ID_two);
                    api.changeNickname(`𝐃𝐚𝐭𝐢𝐧𝐠 𝐰𝐢𝐭𝐡 - ${one_name}`, threadID, userTwo.ID_two);
                    api.changeNickname(`𝐃𝐚𝐭𝐢𝐧𝐠 𝐰𝐢𝐭𝐡 - ${two_name}`, threadID, userTwo.ID_one);
                    api.sendMessage({ body: getMsg(), attachment: await this.canvas(love.ID, author.ID, 1) }, threadID);
                });
            }
            break;
        }
        case '6': {
            if (reaction != '❤') return;
            if (userID == data.ID_one) data.accept_one = true;
            if (userID == data.ID_two) data.accept_two = true;
            if (data.accept_one && data.accept_two) {
                api.unsendMessage(handleReaction.messageID);
                let pointToIncrease = 10;
                let bonusPercent = 0;
                let isHungry = false;
                let lastFeed = dataDating.find(i => i.ID_one == data.ID_one).data.petLastFeed;
                if (lastFeed && lastFeed != NaN && !isNaN(lastFeed)) {
                    let timeNow = Date.now();
                    if (lastFeed < timeNow - (24 * 60 * 60 * 1000)) {
                        isHungry = true;
                    }
                }
                if (author.data.pet && author.data.pet.length > 0 && isHungry == false) {
                    bonusPercent += this.getPetBonus(author.data.pet, author);
                }
                if (author.data.house && author.data.house != NaN && !isNaN(author.data.house)) {
                    bonusPercent += this.getHouseBonus(author.data.house);
                }
                pointToIncrease = Math.floor(pointToIncrease * (1 + bonusPercent));
                author.data.point += pointToIncrease;
                author.data.daily = Date.now();
                dataDating[dataDating.findIndex(i => i.ID_one == author.ID_one)] = author;
                writeFileSync(path, JSON.stringify(dataDating, null, 4));
                return api.sendMessage(`𝐃𝐢𝐞𝐦𝐝𝐚𝐧𝐡 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠! 𝐄𝐱𝐩 𝐭𝐡𝐚̂𝐧 𝐦𝐚̣̂𝐭 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐛𝐚̣𝐧 𝐭𝐚̆𝐧𝐠 𝐭𝐡𝐞̂𝐦 ${pointToIncrease}, 𝐭𝐨̂̉𝐧𝐠: ${author.data.point} 💜`, threadID, () => {
                    if (isHungry == true) api.sendMessage(`𝐂𝐨́ 𝐯𝐞̉ 𝐩𝐞𝐭 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐜𝐡𝐨 𝐚̆𝐧, 𝐧𝐞̂́𝐮 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐡𝐨 𝐩𝐞𝐭 𝐚̆𝐧 𝐪𝐮𝐚́ 𝐦𝐨̣̂𝐭 𝐧𝐠𝐚̀𝐲 𝐛𝐚̣𝐧 𝐬𝐞̃ 𝐦𝐚̂́𝐭 𝐩𝐞𝐭`, threadID);
                });
            }
        }
        case '9': {
            if (reaction != '👍') return;
            else if (userID == senderID) {
                api.unsendMessage(handleReaction.messageID);
                await Currencies.setData(senderID, { money: money + houseCost });
                delete dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.house;
                writeFileSync(path, JSON.stringify(dataDating, null, 4));
                return api.sendMessage(`𝐁𝐚́𝐧 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐯𝐚̀ 𝐧𝐡𝐚̣̂𝐧 𝐯𝐞̂̀ ${houseCost}$`, threadID);
            }
            break;
        }
        case '10': {
            if (reaction != '👍' || moneyForFeed === 0) return;
            else if (userID == senderID) {
                api.unsendMessage(handleReaction.messageID);
                await Currencies.setData(senderID, { money: money - moneyForFeed });
                dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.petLastFeed = Date.now();
                writeFileSync(path, JSON.stringify(dataDating, null, 4));
                return api.sendMessage(`𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐜𝐡𝐨 𝐩𝐞𝐭 𝐚̆𝐧 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠!`, threadID);
            }
            break;
        }
        case '11': {
            if (reaction != '👍') return;
            else if (userID == senderID) {
                let authorPoint = dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.point;
                api.unsendMessage(handleReaction.messageID);
                if (authorPoint < chosenPoint) return api.sendMessage("𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 đ𝐮̉ 𝐞𝐱𝐩 đ𝐞̂̉ đ𝐨̂̉𝐢!", threadID);
                await Currencies.setData(senderID, { money: money + (chosenPoint * 20) });
                dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.point -= chosenPoint;
                writeFileSync(path, JSON.stringify(dataDating, null, 4));
                return api.sendMessage(`𝐁𝐚̣𝐧 đ𝐚̃ đ𝐨̂̉𝐢 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 ${chosenPoint} 𝐞𝐱𝐩 𝐯𝐚̀ 𝐧𝐡𝐚̣̂𝐧 ${chosenPoint * 20}$`, threadID);
            }
        }
        case '12': {
            if (reaction != '👍') return;
            else if (userID == senderID) {
                api.unsendMessage(handleReaction.messageID);
                await Currencies.setData(senderID, { money: money - medicalCost });
                for (i of dataDating[dataDating.findIndex(i => i.ID_one == senderID || i.ID_two == senderID)].data.pet) {
                    i.health = 'good';
                }
                writeFileSync(path, JSON.stringify(dataDating, null, 4));
                return api.sendMessage(`𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐜𝐡𝐮̛̃𝐚 𝐛𝐞̣̂𝐧𝐡 𝐜𝐡𝐨 𝐩𝐞𝐭 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠!`, threadID);
            }
        }
        default:
            break;
    }
}
module.exports.image = async function (link) {
    var images = [];
    let download = (await axios.get(link, { responseType: "arraybuffer" })).data;
    writeFileSync(__dirname + `/cache/dating.png`, Buffer.from(download, "utf-8"));
    images.push(createReadStream(__dirname + `/cache/dating.png`));
    return images
}
module.exports.circle = async (image) => {
    const jimp = require('jimp')
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
}
module.exports.canvas = async function (idOne, idTwo, type) {
    const { loadImage, createCanvas } = require("canvas");
    let path = __dirname + "/cache/ghep.png";
    let pathAvata = __dirname + `/cache/avtghep2.png`;
    let pathAvataa = __dirname + `/cache/avtghep.png`;
    let getAvatarOne = (await axios.get(`https://graph.facebook.com/${idOne}/picture?height=250&width=250&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${idTwo}/picture?height=250&width=250&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    let bg = (await axios.get(type == 0 ? `https://i.imgur.com/fq4kzXk.jpg` : 'https://i.imgur.com/dfuCwFS.jpg', { responseType: "arraybuffer" })).data;
    writeFileSync(pathAvata, Buffer.from(getAvatarOne, 'utf-8'));
    writeFileSync(pathAvataa, Buffer.from(getAvatarTwo, 'utf-8'));
    writeFileSync(path, Buffer.from(bg, "utf-8"));
    avataruser = await this.circle(pathAvata);
    avataruser2 = await this.circle(pathAvataa);
    let imgB = await loadImage(path);
    let baseAvata = await loadImage(avataruser);
    let baseAvataa = await loadImage(avataruser2);
    let canvas = createCanvas(imgB.width, imgB.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(imgB, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvata, type == 0 ? 91 : 82, type == 0 ? 82 : 95, type == 0 ? 166 : 129, type == 0 ? 166 : 129);
    ctx.drawImage(baseAvataa, type == 0 ? 519 : 443, type == 0 ? 81 : 95, type == 0 ? 166 : 129, type == 0 ? 166 : 129);
    ctx.beginPath();
    const imageBuffer = canvas.toBuffer();
    writeFileSync(path, imageBuffer);
    return createReadStream(path)
};

module.exports.houseUpgrade = (from, to) => {
    const cost = [
        10000000,
        20000000,
        35000000,
        60000000
    ];
    const cost_current = cost[from] || 0;
    let upgrade = (cost[to] - cost_current),
        percent = 0;
    upgrade >= 40000000 ? percent = 0.1 : upgrade >= 25000000 ? percent = 0.2 : percent = 0.3;
    if (cost_current > 0) return upgrade + (upgrade * percent);
    else return upgrade;
}

module.exports.houseSellCostPercent = (level) => {
    if (!level) return 0;
    let cost = 0;
    level == 3 ? cost = 0.8 : level == 2 ? cost = 0.7 : level == 1 ? cost = 0.6 : cost = 0.5;
    return cost;
}

module.exports.getHouseBonus = (level) => {
    if (!level && level != 0) return 0;
    let bonus = 0;
    level == 3 ? bonus = 0.5 : level == 2 ? bonus = 0.3 : level == 1 ? bonus = 0.15 : bonus = 0.05;
    return bonus;
}

module.exports.getPetBonus = (pet, dataAuthor) => {
    const bonusPet = [0.1, 0.15, 0.3, 0.5];
    let bonus = 0,
        timeNow = new Date(),
        lastFeed = dataAuthor ? dataAuthor.data.petLastFeed : timeNow;

    for (let i = 0; i < pet.length; i++) {
        let getPetCost = bonusPet[pet[i].id];
        if (pet[i].health == 'bad') {
            getPetCost *= 0.3;
        } else if (pet[i].health == 'good') {
            getPetCost += 0.2;
        }
        bonus += getPetCost;
    }

    const NOT_FED_HOURS = Math.floor((timeNow - lastFeed) / (1000 * 60 * 60)) - 24;
    if (NOT_FED_HOURS > 0) {
        bonus /= NOT_FED_HOURS <= 6 ? 1.5 : NOT_FED_HOURS <= 16 ? 2 : 5;
    }

    return bonus.toFixed(2);
}

module.exports.getPetFeedCost = (pet) => {
    const costPerPet = [400, 300, 150, 100];
    let cost = 0;
    for (let i = 0; i < pet.length; i++) {
        let getPetCost = costPerPet[pet[i].id];
        if (pet[i].health == 'bad') {
            getPetCost *= 2;
        }
        cost += getPetCost;
    }
    return cost;
}

module.exports.getMedicalCost = (pet) => {
    const costPerPet = [1200, 2000, 1500, 3000];
    let cost = 0;
    for (let i = 0; i < pet.length; i++) {
        if (pet[i].health == 'bad') {
            cost += costPerPet[pet[i].id];
        }
    }
    return cost;
                }
