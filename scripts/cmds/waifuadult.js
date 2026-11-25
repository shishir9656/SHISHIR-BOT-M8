const axios = require("axios");

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

module.exports = {
  config: {
    name: "waifuadult",
    version: "3.1",
    author: "xalman",
    countDown: 3,
    role: 0,
    shortDescription: "Get anime nsfw image",
    longDescription: "Fetch direct image from API and automatic unsent after 10 second",
    category: "NSFW",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      const response = await axios.get(
        `${await getApiBaseUrl()}/api/waifuadult`,
        {
          responseType: "stream"
        }
      );

      api.sendMessage(
        {
          body: "😋Here is your adult anime image🫦💋",
          attachment: response.data
        },
        event.threadID,
        (err, info) => {
          if (!err) {
            setTimeout(() => api.unsendMessage(info.messageID), 10000);
          }
        },
        event.messageID
      );
    } catch {
      api.sendMessage(
        "Error fetching image.",
        event.threadID,
        event.messageID
      );
    }
  }
};
