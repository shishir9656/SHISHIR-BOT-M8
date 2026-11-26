const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

let createCanvas, loadImage, registerFont, GIFEncoder;
try {
	({ createCanvas, loadImage, registerFont } = require("canvas"));
	GIFEncoder = require("gif-encoder-2");
} catch (e) {
	console.error("[welcomeGif] প্যাকেজ নেই, চালাও: npm i canvas gif-encoder-2  →", e.message);
}

let sharp = null;
try { sharp = require("sharp"); } catch (e) {}

// ------------------------------------------------------------
// সেটিংস
// ------------------------------------------------------------
// ব্যাকগ্রাউন্ড ফাইল (বটের রুট ফোল্ডারে রাখো): welcome_bg.gif (অ্যানিমেটেড) অথবা .jpg / .png / .webp
const BG_CANDIDATES = ["welcome_bg.gif", "welcome_bg.webp", "welcome_bg.jpg", "welcome_bg.png"]
	.map(f => path.join(process.cwd(), f));
const FONT_FILE = path.join(process.cwd(), "welcome_font.ttf"); // ঐচ্ছিক: সুন্দর ফন্ট
const BG_URL = "https://i.imgur.com/S1FHyui.jpeg"; // চাইলে ছবি/GIF এর সরাসরি লিংকও দিতে পারো
const FONT = "WelcomeFont, serif";

const DW = 960, DH = 540; // ডিজাইনের মাপ
const SCALE = 0.75; // আউটপুট 720x405 (Render এ হালকা রাখতে)
const OW = Math.round(DW * SCALE), OH = Math.round(DH * SCALE);
const FRAMES = 14;
const TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

if (registerFont && fs.existsSync(FONT_FILE)) {
	try { registerFont(FONT_FILE, { family: "WelcomeFont" }); } catch (e) {}
}

// ফন্টে না থাকা ফ্যান্সি অক্ষর (বক্স) এড়াতে ASCII তে নামানো
function clean(s, fallback) {
	const n = String(s || "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
	return n || fallback || String(s || "");
}
function cut(s, n) {
	return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

async function fetchImg(url) {
	try {
		const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
		return await loadImage(Buffer.from(res.data));
	} catch (e) {
		return null;
	}
}
const avatarOf = (id) => fetchImg(`https://graph.facebook.com/${id}/picture?height=500&width=500&access_token=${TOKEN}`);

function circleImage(ctx, img, cx, cy, r, ring, glow) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();
	if (img) ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
	else {
		ctx.fillStyle = "#171747";
		ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
	}
	ctx.restore();
	ctx.save();
	ctx.shadowColor = glow || ring;
	ctx.shadowBlur = 14;
	ctx.strokeStyle = ring;
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();
}

function coverDraw(ctx, img, w, h) {
	const s = Math.max(w / img.width, h / img.height);
	const iw = img.width * s, ih = img.height * s;
	ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
}

// ব্যাকগ্রাউন্ড লোড: GIF হলে ফ্রেমে ভেঙে (সর্বোচ্চ FRAMES টা), নইলে একটাই ছবি
async function loadBackground() {
	try {
		let buf = null;
		const file = BG_CANDIDATES.find(f => fs.existsSync(f));
		if (file) buf = await fs.readFile(file);
		else if (BG_URL) {
			const res = await axios.get(BG_URL, { responseType: "arraybuffer", timeout: 15000 });
			buf = Buffer.from(res.data);
		}
		if (!buf) return [];

		if (sharp) {
			const meta = await sharp(buf, { animated: true }).metadata();
			const pages = meta.pages || 1;
			const count = Math.min(pages, FRAMES);
			const frames = [];
			for (let i = 0; i < count; i++) {
				const page = count === 1 ? 0 : Math.floor((i * pages) / count);
				const png = await sharp(buf, { page })
					.resize(OW, OH, { fit: "cover" })
					.png()
					.toBuffer();
				frames.push(await loadImage(png));
			}
			return frames;
		}
		return [await loadImage(buf)];
	} catch (e) {
		console.error("[welcomeGif] ব্যাকগ্রাউন্ড লোড হয়নি:", e.message);
		return [];
	}
}

// ------------------------------------------------------------
async function handle({ api, event }) {
	if (!createCanvas || !GIFEncoder) return;
	if (event.logMessageType !== "log:subscribe") return;

	const { threadID, logMessageData, author } = event;
	const users = (logMessageData && logMessageData.addedParticipants) || [];
	const botID = String(api.getCurrentUserID());
	const members = users.filter(u => String(u.userFbId) !== botID);
	if (!members.length) return;

	let info = {};
	try { info = await api.getThreadInfo(threadID); } catch (e) {}

	const rawGroup = info.threadName || "Our Group";
	const groupName = cut(clean(rawGroup, "Our Group"), 26);
	const total = (info.participantIDs || []).length;
	const admins = (info.adminIDs || []).length;

	let male = 0, female = 0;
	for (const u of info.userInfo || []) {
		const g = String(u.gender || "").toUpperCase();
		if (g === "MALE" || g === "MALE_SINGULAR") male++;
		else if (g === "FEMALE" || g === "FEMALE_SINGULAR") female++;
	}
	const showGender = male + female > 0;
	const botName = clean((global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) || "GoatBot V2", "GoatBot V2");

	// গ্রুপ আইকন ও ব্যাকগ্রাউন্ড (সব সদস্যের জন্য একবারই)
	const groupImg = info.imageSrc ? await fetchImg(info.imageSrc) : null;
	const bgFrames = await loadBackground();
	const bgImg = bgFrames.length === 1 ? bgFrames[0] : null; // একটাই ছবি হলে স্ট্যাটিক
	const bgAnimated = bgFrames.length > 1;

	for (const user of members) {
		const uid = String(user.userFbId);
		const name = cut(clean(user.fullName, "New Member"), 22);
		const selfJoin = !author || String(author) === uid;
		const gifPath = path.join(os.tmpdir(), `welcome_${threadID}_${uid}_${Date.now()}.gif`);

		try {
			const avatar = await avatarOf(uid);
			let adderImg = null, adderName = "";
			if (!selfJoin) {
				adderImg = await avatarOf(author);
				try {
					const u = await api.getUserInfo(author);
					adderName = cut(clean(u && u[author] && u[author].name, ""), 20);
				} catch (e) {}
			}

			// ---------- স্ট্যাটিক লেয়ার: ব্যাকগ্রাউন্ড ----------
			const bgLayer = createCanvas(OW, OH);
			{
				const c = bgLayer.getContext("2d");
				c.scale(SCALE, SCALE);
				if (bgImg) {
					coverDraw(c, bgImg, DW, DH);
					c.fillStyle = "rgba(0,0,12,0.35)";
					c.fillRect(0, 0, DW, DH);
				} else {
					const g = c.createLinearGradient(0, 0, DW, DH);
					g.addColorStop(0, "#04061a");
					g.addColorStop(0.55, "#0a0f33");
					g.addColorStop(1, "#150a2c");
					c.fillStyle = g;
					c.fillRect(0, 0, DW, DH);
					// নীল আলোর রশ্মি
					c.save();
					c.globalAlpha = 0.35;
					c.strokeStyle = "#1f8bff";
					c.lineWidth = 5;
					for (let i = 0; i < 6; i++) {
						c.beginPath();
						c.moveTo(-40, 90 + i * 55);
						c.lineTo(DW * 0.6, 250 + i * 40);
						c.stroke();
					}
					c.restore();
				}
			}

			// ---------- স্ট্যাটিক লেয়ার: বার, লেখা, অ্যাভাটার ----------
			const fgLayer = createCanvas(OW, OH);
			{
				const c = fgLayer.getContext("2d");
				c.scale(SCALE, SCALE);

				// উপরের বার
				c.fillStyle = "rgba(0,0,0,0.55)";
				c.fillRect(0, 0, DW, 96);
				c.fillRect(0, DH - 52, DW, 52);

				// গ্রুপ আইকন
				circleImage(c, groupImg, 66, 48, 38, "#1e90ff");

				c.textAlign = "left";
				c.fillStyle = "#ffffff";
				c.font = `bold 28px ${FONT}`;
				c.fillText(groupName, 125, 46);
				c.fillStyle = "#c9d1ff";
				c.font = `20px ${FONT}`;
				c.fillText(`${total} members     ${admins} admins`, 125, 78);

				// Invited by
				if (selfJoin) {
					c.textAlign = "right";
					c.fillStyle = "#c9d1ff";
					c.font = `22px ${FONT}`;
					c.fillText("Joined via link", DW - 30, 56);
				} else {
					circleImage(c, adderImg, DW - 66, 48, 36, "#ff5fa2");
					c.textAlign = "right";
					c.fillStyle = "#ffffff";
					c.font = `22px ${FONT}`;
					c.fillText("Invited by:", DW - 118, 40);
					if (adderName) {
						c.fillStyle = "#ffb3d4";
						c.font = `18px ${FONT}`;
						c.fillText(adderName, DW - 118, 68);
					}
				}

				// নতুন সদস্যের অ্যাভাটার
				c.save();
				c.shadowColor = "#00ff66";
				c.shadowBlur = 25;
				c.fillStyle = "#ffffff";
				c.beginPath();
				c.arc(480, 285, 94, 0, Math.PI * 2);
				c.fill();
				c.restore();
				circleImage(c, avatar, 480, 285, 88, "#24ff6a", "#00ff66");

				// নাম
				c.textAlign = "center";
				c.save();
				c.shadowColor = "#00ff66";
				c.shadowBlur = 14;
				c.fillStyle = "#ffffff";
				c.font = `bold 40px ${FONT}`;
				c.fillText(name, 480, 440);
				c.restore();

				// নিচের বার
				c.fillStyle = "#ffffff";
				c.font = `22px ${FONT}`;
				const items = [`${total} Members`];
				if (showGender) items.push(`${male} Male`, `${female} Female`);
				items.push(`Thanks for using: ${botName}`);
				let x = 50;
				for (const t of items) {
					c.fillStyle = "#24ff6a";
					c.beginPath();
					c.arc(x, DH - 27, 6, 0, Math.PI * 2);
					c.fill();
					c.fillStyle = "#ffffff";
					c.textAlign = "left";
					c.fillText(t, x + 16, DH - 19);
					x += 16 + c.measureText(t).width + 40;
				}
			}

			// ---------- GIF ----------
			const encoder = new GIFEncoder(OW, OH, "neuquant", false, FRAMES);
			encoder.start();
			encoder.setRepeat(0);
			encoder.setDelay(90);
			encoder.setQuality(20);

			const canvas = createCanvas(OW, OH);
			const ctx = canvas.getContext("2d");

			for (let f = 0; f < FRAMES; f++) {
				const t = f / FRAMES;
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				ctx.clearRect(0, 0, OW, OH);
				if (bgAnimated) {
					ctx.drawImage(bgFrames[f % bgFrames.length], 0, 0, OW, OH);
					ctx.fillStyle = "rgba(0,0,12,0.35)";
					ctx.fillRect(0, 0, OW, OH);
				} else {
					ctx.drawImage(bgLayer, 0, 0);
				}

				ctx.save();
				ctx.scale(SCALE, SCALE);

				// বৃষ্টির রেখা
				ctx.strokeStyle = "rgba(170,210,255,0.45)";
				ctx.lineWidth = 1.5;
				for (let i = 0; i < 45; i++) {
					const y = (i * 97 + t * DH * 2) % DH;
					const x = ((i * 131) % DW) - y * 0.2;
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x - 4, y + 18);
					ctx.stroke();
				}
				// ভেসে ওঠা স্ফুলিঙ্গ
				for (let i = 0; i < 14; i++) {
					const y = DH - ((i * 61 + t * DH) % DH);
					const x = (i * 83) % DW + Math.sin((t + i) * Math.PI * 2) * 8;
					ctx.fillStyle = i % 2 ? "rgba(255,90,60,0.7)" : "rgba(255,170,60,0.7)";
					ctx.beginPath();
					ctx.arc(x, y, 2.2, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.restore();

				ctx.drawImage(fgLayer, 0, 0);

				ctx.save();
				ctx.scale(SCALE, SCALE);

				// ঘূর্ণায়মান অলংকার
				const spin = t * Math.PI * 2;
				for (let i = 0; i < 12; i++) {
					const a = spin + (i / 12) * Math.PI * 2;
					const px = 480 + Math.cos(a) * 122;
					const py = 285 + Math.sin(a) * 122;
					ctx.save();
					ctx.translate(px, py);
					ctx.rotate(a + Math.PI / 2);
					ctx.shadowColor = "#00ff66";
					ctx.shadowBlur = 8;
					ctx.strokeStyle = "#24ff6a";
					ctx.lineWidth = 2;
					if (i % 2 === 0) ctx.strokeRect(-9, -11, 18, 22);
					else {
						ctx.beginPath();
						ctx.arc(0, 0, 5, 0, Math.PI * 2);
						ctx.stroke();
					}
					ctx.restore();
				}

				// WELCOME (পালস করা glow)
				const pulse = 12 + 10 * Math.sin(t * Math.PI * 2);
				ctx.textAlign = "center";
				ctx.save();
				ctx.shadowColor = "#00ff66";
				ctx.shadowBlur = pulse;
				ctx.fillStyle = "#8dffb0";
				ctx.font = `bold 62px ${FONT}`;
				ctx.fillText("WELCOME", 480, 150);
				ctx.restore();

				ctx.restore();
				encoder.addFrame(ctx);
			}

			encoder.finish();
			fs.writeFileSync(gifPath, encoder.out.getData());

			await api.sendMessage(
				{
					body:
						`✨ Welcome ${user.fullName || name}!\n` +
						`💜 Welcome to ${rawGroup}\n` +
						`👥 You are member #${total}\n` +
						`🌌 Enjoy your time with the group!`,
					attachment: fs.createReadStream(gifPath),
					mentions: [{ tag: user.fullName || name, id: uid }]
				},
				threadID
			);
		} catch (error) {
			console.error("[welcomeGif] error:", error);
		} finally {
			setTimeout(() => fs.remove(gifPath).catch(() => {}), 10000);
		}
	}
}

module.exports = {
	config: {
		name: "welcomeGif",
		version: "5.0.0",
		author: "ARIYAN",
		category: "events"
	},
	onStart: async function (ctx) {
		return handle(ctx);
	},
	onEvent: async function (ctx) {
		return handle(ctx);
	}
};
