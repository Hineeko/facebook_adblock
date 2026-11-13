const defaultConfig = {
  highlightMode: false,
  cleanMode: false,
  removeReels: true,
  removeSponsored: true,
  removeSuggested: true,
  removeMarketAds: true,
  removeSearchAds: true,
  removeStories: false,
  removeGroups: true,
  removePPYMK: true,
  whitelist: ""
};

const defaultStats = {
  reels: 0,
  suggested: 0,
  sponsored: 0
};

const whitelistInput = document.getElementById("whitelist-input");

function renderStats(s) {
  document.getElementById("stat-reels").textContent = (s.reels || 0).toLocaleString();
  document.getElementById("stat-suggested").textContent = (s.suggested || 0).toLocaleString();
  document.getElementById("stat-sponsored").textContent = (s.sponsored || 0).toLocaleString();
}

function updateUI() {
  chrome.storage.local.get({ config: defaultConfig, stats: defaultStats }, (data) => {
    renderStats(data.stats);
    document.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      const key = cb.dataset.key;
      cb.checked = !!data.config[key];
    });
    whitelistInput.value = data.config.whitelist || "";
  });
}

document.querySelectorAll("input[type=checkbox]").forEach((cb) => {
  cb.addEventListener("change", () => {
    chrome.storage.local.get({ config: defaultConfig }, (data) => {
      const newConfig = { ...data.config, [cb.dataset.key]: cb.checked };
      chrome.storage.local.set({ config: newConfig });
    });
  });
});

let wlTimer = null;
whitelistInput.addEventListener("input", () => {
  clearTimeout(wlTimer);
  wlTimer = setTimeout(() => {
    chrome.storage.local.get({ config: defaultConfig }, (data) => {
      const newConfig = { ...data.config, whitelist: whitelistInput.value };
      chrome.storage.local.set({ config: newConfig });
    });
  }, 300);
});

document.getElementById("reset-stats").addEventListener("click", () => {
  chrome.storage.local.set({ stats: { reels: 0, suggested: 0, sponsored: 0 } });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.stats) {
    renderStats(changes.stats.newValue);
  }
});

updateUI();