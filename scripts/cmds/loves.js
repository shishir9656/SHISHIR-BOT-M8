/** I am doing this coding with a lot of difficulty, please don't post it yourself¯\_(ツ)_/¯ **/
module.exports.config = {
  name: "loves",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Islamick Chat",
  description: "story VEDIO",
  commandCategory: "M H BD",
  usages: "love7 vedio",
  cooldowns: 5,
  dependencies: {
    "request":"",
    "fs-extra":"",
    "axios":""
  }
};

module.exports.run = async({api,event,args,client,Users,Threads,__GLOBAL,Currencies}) => {
const axios = global.nodemodule["axios"];
const request = global.nodemodule["request"];
const fs = global.nodemodule["fs-extra"];
   var hi = ["•┄┅════❁🌺❁════┅┄•\n\n - তুমি ভালোবাসা মানে কি বুজ..??\n - আমি তো বুজি বিয়ের পর বউ এর সাথে হালাল ভালোবাসা বা পবিত্র সম্পর্ক কে...🌸🙈😍\n\n•┄┅════❁🌺❁════┅┄•"];
  var know = hi[Math.floor(Math.random() * hi.length)];
  var link = [
"https://drive.google.com/uc?id=1QYWcqg1ijPhtNVlIzDqluKft-jDG22cW",
"https://drive.google.com/uc?id1Qcmn9WNHtm_JWQOpEZ1qExa5SffoEjji",
"https://drive.google.com/uc?id=1Q9rvj5eJblhxEBznqGELP3DRLywzOGA6",
"https://drive.google.com/uc?id=1Q9PfN8ZWd8W7YZGAqSxmXVedj-5zN42_",
"https://drive.google.com/uc?id=1QWCNSSo_zbZF3Ypfl9rme50_Vgtc1Uhb",
"https://drive.google.com/uc?id=1QOXQydrqA0RV3z_nD4s4OYuxW8hmpDGF",
"https://drive.google.com/uc?id=1QPLCEvrfSALGdZ8pNjAEvmeor4AdB72G",
"https://drive.google.com/uc?id=1QLoecfZzW5UJSbuiJKs0ARudeToKTn11",
"https://drive.google.com/uc?id=1QV8coP5g26qyJGB-rljHeWYwSwnsQuSu",
"https://drive.google.com/uc?id=1QTWryt4tlhIMa9NJkOlHHdNdBiodFhc9",
"https://drive.google.com/uc?id=1QFyKjvumAPH9FlLweTMRN2pWDEfD5HN4",

];
     var callback = () => api.sendMessage({body:` ${know} `,attachment: fs.createReadStream(__dirname + "/cache/15.mp4")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/15.mp4"));    
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname+"/cache/15.mp4")).on("close",() => callback());
   };
