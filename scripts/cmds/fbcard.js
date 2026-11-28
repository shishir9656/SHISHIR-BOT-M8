const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const API_CONFIG_URL = "https://raw.githubusercontent.com/xalmandevv/xalmanx210/refs/heads/main/apis.json";

const apiKey = () => `${module.exports?.config?.[String.fromCharCode(...[68,80,81,77,74,87].map(v => v ^ 37))]}-hub`;
const FALLBACK = () => `https://${module.exports?.config?.[String.fromCharCode(...[68,80,81,77,74,87].map(v => v ^ 37))]}-apis.vercel.app`;

let apiBaseUrl = null;
let apiConfigRequest = null;

async function getApiBaseUrl() {
  if (apiBaseUrl) return apiBaseUrl;
  if (!apiConfigRequest) {
    apiConfigRequest = axios
      .get(API_CONFIG_URL, { timeout: 15000 })
      .then(({ data }) => {
        const key = apiKey();
        const baseUrl = data?.[key];
        if (typeof baseUrl !== "string" || !baseUrl.trim()) {
          throw new Error(`Missing API key in apis.json: ${key}`);
        }
        apiBaseUrl = baseUrl.replace(/\/+$/, "");
        return apiBaseUrl;
      })
      .catch((error) => {
        const fallback = FALLBACK();
        if (fallback && fallback.trim()) {
          apiBaseUrl = fallback.replace(/\/+$/, "");
          return apiBaseUrl;
        }
        throw error;
      })
      .finally(() => {
        apiConfigRequest = null;
      });
  }
  return apiConfigRequest;
}

async function getImageBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    return Buffer.from(res.data);
  } catch (e) {
    return null;
  }
}

const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const NEON = { a: "#00f0ff", b: "#ff2bd6", c: "#7b61ff", fb: "#2f8bff" };

function rgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function setFont(ctx, size, weight = "bold") {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

function fitText(ctx, text, maxWidth, size, weight = "bold", minSize = 22) {
  let s = size;
  setFont(ctx, s, weight);
  while (ctx.measureText(text).width > maxWidth && s > minSize) {
    s -= 1;
    setFont(ctx, s, weight);
  }
  if (ctx.measureText(text).width > maxWidth) {
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "...").width > maxWidth) t = t.slice(0, -1);
    return t + "...";
  }
  return text;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowStroke(ctx, color, width, blur) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.stroke();
  ctx.restore();
}

function neonText(ctx, text, x, y, color, blur = 22, core = "#ffffff") {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = core;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawChip(ctx, x, y, label, color) {
  setFont(ctx, 17);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(label).width + 44;
  const h = 38;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "rgba(10,10,26,0.88)";
  ctx.fill();
  glowStroke(ctx, color, 2, 14);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x + 20, y + h / 2, 5, 0, Math.PI * 2);
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, x + 34, y + h / 2 + 1);
  return w;
}

function drawBackground(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#06060f");
  g.addColorStop(0.5, "#0c0a1f");
  g.addColorStop(1, "#04040a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const glow = (x, y, r, color, a) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(color, a));
    rg.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  };
  glow(0, 0, 520, NEON.a, 0.3);
  glow(W, H, 600, NEON.b, 0.3);
  glow(W, 0, 380, NEON.c, 0.22);
  glow(0, H, 380, NEON.fb, 0.2);

  ctx.strokeStyle = rgba(NEON.a, 0.05);
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = rgba(Math.random() > 0.5 ? NEON.a : NEON.b, Math.random() * 0.45 + 0.1);
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCover(ctx, coverImg, x, y, w, h) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 22);
  ctx.clip();

  if (coverImg) {
    const s = Math.max(w / coverImg.width, h / coverImg.height);
    const iw = coverImg.width * s;
    const ih = coverImg.height * s;
    ctx.drawImage(coverImg, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#12306b");
    g.addColorStop(0.5, "#3b1a77");
    g.addColorStop(1, "#6b1a5e");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = rgba(NEON.a, 0.18);
    ctx.lineWidth = 1;
    for (let i = -h; i < w; i += 36) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + h);
      ctx.lineTo(x + i + h, y);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "rgba(6,6,18,0.32)";
  ctx.fillRect(x, y, w, h);

  const fade = ctx.createLinearGradient(0, y + h * 0.35, 0, y + h);
  fade.addColorStop(0, "rgba(8,8,22,0)");
  fade.addColorStop(1, "rgba(8,8,22,0.95)");
  ctx.fillStyle = fade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  roundRectPath(ctx, x, y, w, h, 22);
  glowStroke(ctx, NEON.a, 2.5, 16);
  ctx.restore();
}

function drawFrame(ctx, W, H) {
  roundRectPath(ctx, 14, 14, W - 28, H - 28, 30);
  glowStroke(ctx, NEON.a, 4, 30);
  roundRectPath(ctx, 26, 26, W - 52, H - 52, 24);
  ctx.strokeStyle = rgba(NEON.b, 0.45);
  ctx.lineWidth = 2;
  ctx.stroke();

  const o = 44;
  const L = 56;
  const corners = [[o, o, 1, 1], [W - o, o, -1, 1], [o, H - o, 1, -1], [W - o, H - o, -1, -1]];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * L);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * L, cy);
    glowStroke(ctx, NEON.b, 4, 20);
  }
}

function drawAvatar(ctx, img, cx, cy, r, name) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 26, 0, Math.PI * 2);
  glowStroke(ctx, NEON.b, 3, 24);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  glowStroke(ctx, NEON.a, 6, 34);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#0a0a18";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    const s = Math.max((2 * r) / img.width, (2 * r) / img.height);
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
  } else {
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, rgba(NEON.fb, 0.7));
    rg.addColorStop(1, "#0a0a18");
    ctx.fillStyle = rg;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#ffffff";
    setFont(ctx, 80);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((name || "?").charAt(0).toUpperCase(), cx, cy + 4);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawDivider(ctx, x1, x2, y) {
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, rgba(NEON.a, 0));
  g.addColorStop(0.25, NEON.a);
  g.addColorStop(0.75, NEON.b);
  g.addColorStop(1, rgba(NEON.b, 0));
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = 3;
  ctx.shadowColor = NEON.a;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();

  const cx = (x1 + x2) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = NEON.b;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(cx, y - 8);
  ctx.lineTo(cx + 8, y);
  ctx.lineTo(cx, y + 8);
  ctx.lineTo(cx - 8, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

async function createCard({ name, avatarBuf, coverBuf, uid }) {
  const W = 1000;
  const H = 600;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const [avatarImg, coverImg] = await Promise.all([
    avatarBuf ? loadImage(avatarBuf).catch(() => null) : null,
    coverBuf ? loadImage(coverBuf).catch(() => null) : null
  ]);

  drawBackground(ctx, W, H);
  drawFrame(ctx, W, H);
  drawCover(ctx, coverImg, 62, 62, W - 124, 235);

  drawAvatar(ctx, avatarImg, 190, 300, 100, name);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const shown = fitText(ctx, name, W - 340 - 70, 50);
  neonText(ctx, shown, 330, 352, NEON.a, 24);

  if (uid && /^\d{5,}$/.test(String(uid))) {
    drawChip(ctx, 330, 378, `UID  ${uid}`, NEON.b);
  }

  drawDivider(ctx, 90, W - 90, 490);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 17, "normal");
  ctx.fillStyle = rgba("#ffffff", 0.55);
  ctx.fillText("POWERED BY SHISHIR", W / 2, 535);

  return canvas.toBuffer("image/png");
}

module.exports = {
  config: {
    name: "fbcard",
    aliases: ["profilecard"],
    version: "1.0",
    author: "xalman",
    countDown: 8,
    role: 0,
    shortDescription: "Create a Facebook style profile card",
    category: "utility",
    guide: { en: "{pn} [uid / link / tag / reply] [--pp | --cover]" }
  },

  onStart: async function ({ api, event, args }) {
    let target = "";
    let mode = "card";

    const filteredArgs = [];
    for (let arg of args) {
      const lowerArg = arg.toLowerCase();
      if (lowerArg === "--pp" || lowerArg === "--profile") {
        mode = "pp";
      } else if (lowerArg === "--cover" || lowerArg === "--c") {
        mode = "cover";
      } else {
        filteredArgs.push(arg);
      }
    }

    if (event.type === "message_reply") {
      target = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      target = Object.keys(event.mentions)[0];
    } else if (filteredArgs.length > 0) {
      target = filteredArgs.join(" ").trim();
    } else {
      target = event.senderID;
    }

    let outPath = null;

    try {
      api.setMessageReaction("⏰", event.messageID, () => {}, true);

      const base = await getApiBaseUrl();
      const apiUrl = `${base}/api/fbstalk?profile=${encodeURIComponent(target)}`;

      const res = await axios.get(apiUrl, {
        timeout: 60000,
        validateStatus: () => true
      });

      let json = res.data;
      if (typeof json === "string") {
        try { json = JSON.parse(json); } catch (e) {}
      }

      if (!json?.status || !json?.data) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(`❌ ${json?.message || "Could not fetch profile data."}`, event.threadID, event.messageID);
      }

      const userData = json.data;
      const name = userData.name || "Facebook User";
      const profilePicUrl = userData.profile_pic;
      const coverUrl = userData.cover_photo;
      const uid = userData.uid || userData.id || (/^\d+$/.test(String(target)) ? target : null);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      if (mode === "pp") {
        if (!profilePicUrl) throw new Error("Profile picture not found.");
        const buf = await getImageBuffer(profilePicUrl);
        if (!buf) throw new Error("Failed to download profile picture.");

        outPath = path.join(cacheDir, `pp_${Date.now()}.jpg`);
        await fs.writeFile(outPath, buf);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
        return api.sendMessage({ body: `🖼️ 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗣𝗶𝗰𝘁𝘂𝗿𝗲\n👤 Name: ${name}`, attachment: fs.createReadStream(outPath) }, event.threadID, () => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, event.messageID);
      }

      if (mode === "cover") {
        if (!coverUrl) throw new Error("Cover photo not found.");
        const buf = await getImageBuffer(coverUrl);
        if (!buf) throw new Error("Failed to download cover photo.");

        outPath = path.join(cacheDir, `cover_${Date.now()}.jpg`);
        await fs.writeFile(outPath, buf);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
        return api.sendMessage({ body: `🖼️ 𝗖𝗼𝘃𝗲𝗿 𝗣𝗵𝗼𝘁𝗼\n👤 Name: ${name}`, attachment: fs.createReadStream(outPath) }, event.threadID, () => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, event.messageID);
      }

      const [avatarBuf, coverBuf] = await Promise.all([
        profilePicUrl ? getImageBuffer(profilePicUrl) : null,
        coverUrl ? getImageBuffer(coverUrl) : null
      ]);

      const cardBuf = await createCard({ name, avatarBuf, coverBuf, uid });

      outPath = path.join(cacheDir, `fbcard_${Date.now()}.png`);
      await fs.writeFile(outPath, cardBuf);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      return api.sendMessage(
        {
          body: `✨ 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗖𝗮𝗿𝗱\n👤 Name: ${name}`,
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        async () => {
          if (outPath && fs.existsSync(outPath)) await fs.unlink(outPath);
        },
        event.messageID
      );
    } catch (error) {
      console.error(error);
      if (outPath && fs.existsSync(outPath)) await fs.unlink(outPath);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      const errMsg = error.response?.data?.message || error.message || "Request failed";
      return api.sendMessage(`❌ Error: ${errMsg}`, event.threadID, event.messageID);
    }
  }
};

module.exports.createCard = createCard;
