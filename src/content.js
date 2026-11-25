(function () {
  console.info("ABfF Pro: Initialized v3.2 God-Tier Engine");

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
    whitelist: "",
  };

  let config = { ...defaultConfig };
  let whitelistTerms = [];
  let isReady = false;
  let observer = null;
  let tabBlockedCount = 0;

  let cleanPostsCache = new WeakSet();

  function injectStyles() {
    if (document.getElementById("abff-pro-styles")) return;
    const style = document.createElement("style");
    style.id = "abff-pro-styles";
    style.textContent = `
      [data-abff-mode="hidden"] {
        display: none !important;
      }
      [data-abff-mode="highlight"] {
        position: relative !important;
        border: 3px dashed #e41e3f !important;
        border-radius: 10px !important;
        opacity: 0.35 !important;
        transition: opacity 0.2s ease-in-out !important;
        margin-top: 28px !important;
      }
      [data-abff-mode="highlight"]:hover {
        opacity: 1 !important;
      }
      [data-abff-mode="highlight"]::before {
        content: "🚫 ABfF Blocked: " attr(data-abff-blocked);
        position: absolute !important;
        top: -26px !important;
        left: 0 !important;
        background: #e41e3f !important;
        color: #fff !important;
        font-size: 12px !important;
        font-weight: bold !important;
        padding: 2px 10px !important;
        border-radius: 6px 6px 0 0 !important;
        z-index: 9999 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function parseWhitelist(str) {
    return (str || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
  }

  function isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  function safeDisconnect() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  if (!isContextValid()) return;
  injectStyles();

  try {
    chrome.storage.local.get({ config: defaultConfig }, (data) => {
      if (!isContextValid() || chrome.runtime.lastError) return;
      config = { ...defaultConfig, ...data.config };
      whitelistTerms = parseWhitelist(config.whitelist);
      isReady = true;
      scheduleScan();
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (!isContextValid()) {
        safeDisconnect();
        return;
      }
      if (changes.config) {
        const oldHighlight = config.highlightMode;
        config = { ...defaultConfig, ...changes.config.newValue };
        whitelistTerms = parseWhitelist(config.whitelist);
        cleanPostsCache = new WeakSet();

        if (oldHighlight !== config.highlightMode) {
          document.querySelectorAll("[data-abff-blocked]").forEach((el) => {
            el.dataset.abffMode = config.highlightMode ? "highlight" : "hidden";
          });
        } else {
          document.querySelectorAll("[data-abff-blocked]").forEach((el) => {
            delete el.dataset.abffBlocked;
            delete el.dataset.abffMode;
          });
          scheduleScan();
        }
      }
    });
  } catch (e) {
    safeDisconnect();
  }

  let pendingIncrements = { reels: 0, suggested: 0, sponsored: 0 };
  let isSavingStats = false;

  function incrementStat(type, amount = 1) {
    if (pendingIncrements[type] === undefined) return;
    pendingIncrements[type] += amount;
    tabBlockedCount += amount;

    if (isContextValid()) {
      try {
        chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count: tabBlockedCount });
      } catch (e) {}
    }
    flushStats();
  }

  function flushStats() {
    if (!isContextValid()) {
      safeDisconnect();
      return;
    }
    if (isSavingStats) return;

    const toAdd = { ...pendingIncrements };
    if (toAdd.reels === 0 && toAdd.suggested === 0 && toAdd.sponsored === 0) {
      return;
    }

    pendingIncrements = { reels: 0, suggested: 0, sponsored: 0 };
    isSavingStats = true;

    try {
      chrome.storage.local.get(
        { stats: { reels: 0, suggested: 0, sponsored: 0 } },
        (data) => {
          if (!isContextValid() || chrome.runtime.lastError) {
            isSavingStats = false;
            safeDisconnect();
            return;
          }
          const updated = {
            reels: (data.stats.reels || 0) + toAdd.reels,
            suggested: (data.stats.suggested || 0) + toAdd.suggested,
            sponsored: (data.stats.sponsored || 0) + toAdd.sponsored,
          };
          chrome.storage.local.set({ stats: updated }, () => {
            isSavingStats = false;
            if (!isContextValid()) {
              safeDisconnect();
              return;
            }
            if (
              pendingIncrements.reels > 0 ||
              pendingIncrements.suggested > 0 ||
              pendingIncrements.sponsored > 0
            ) {
              flushStats();
            }
          });
        }
      );
    } catch (e) {
      isSavingStats = false;
      safeDisconnect();
    }
  }

  function cleanText(str) {
    return (str || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  }

  function isWhitelisted(postEl) {
    if (whitelistTerms.length === 0) return false;
    const headerEl = postEl.querySelector("h3, h4, strong") || postEl;
    const headerText = cleanText(headerEl.innerText).toLowerCase();
    return whitelistTerms.some((term) => headerText.includes(term));
  }

  function applyBlock(el, reason, statType, statCount = 1) {
    if (!el || el.dataset.abffBlocked) return;
    if (el.parentElement && el.parentElement.closest("[data-abff-blocked]")) {
      return;
    }
    if (isWhitelisted(el)) {
      cleanPostsCache.add(el);
      return;
    }

    el.dataset.abffBlocked = reason;
    el.dataset.abffMode = config.highlightMode ? "highlight" : "hidden";

    if (statType) {
      incrementStat(statType, statCount);
    }
    console.info(`ABfF [${config.highlightMode ? "Highlighted" : "Hidden"}] (${reason}):`, el);
  }

  // หา Container กล่องโพสต์/การ์ดที่ครอบ Element นั้นอยู่
  function findCardContainer(el) {
    const feed = document.querySelector('div[role="feed"], div[role="main"]');
    const unit =
      el.closest('div[aria-posinset]') ||
      el.closest('div[data-pagelet^="FeedUnit_"]') ||
      el.closest('div[class*="x1yztbdb"]') ||
      el.closest('div[class*="x1jx94hy"]') || // คลาสของการ์ด PPYMK / Reels แบบใหม่
      el.closest('div[role="article"]');

    if (unit && (!feed || !unit.contains(feed))) {
      return unit;
    }
    return null;
  }

  function isSponsoredLabelText(str) {
    const t = cleanText(str).toLowerCase();
    return t === "sponsored" || t === "ได้รับการสนับสนุน";
  }

  function isSponsoredElement(rootEl) {
    const adSelector = rootEl.querySelector(
      'a[href*="/ads/about"], a[href*="hc_ref=ADS"], a[href*="utm_medium=paid"], a[href*="utm_medium=cpc"], a[href*="fbclid="][target="_blank"], [aria-label*="sponsored content" i], [aria-label*="เนื้อหาที่ได้รับการสนับสนุน"], a[aria-label="Sponsored" i], a[aria-label="ได้รับการสนับสนุน"]'
    );
    if (adSelector) return true;

    // เช็ก aria-labelledby (ดักแอดแบบ SVG <use> รุ่นใหม่)
    const labelledEls = rootEl.querySelectorAll("[aria-labelledby]");
    for (const el of labelledEls) {
      const ids = (el.getAttribute("aria-labelledby") || "").split(/\s+/);
      for (const id of ids) {
        if (!id) continue;
        const target = document.getElementById(id);
        if (target && isSponsoredLabelText(target.textContent)) {
          return true;
        }
      }
    }

    const elements = rootEl.querySelectorAll("h3, span, a, use");
    for (const el of elements) {
      let t = cleanText(
        el.innerText || el.textContent || el.getAttribute("aria-label")
      );
      if (el.tagName.toLowerCase() === "use") {
        const href = el.getAttribute("xlink:href") || el.getAttribute("href");
        if (href) {
          const target = document.querySelector(href);
          if (target) t = cleanText(target.textContent);
        }
      }
      if (isSponsoredLabelText(t)) {
        return true;
      }
    }
    return false;
  }

  // กวาดแอดแบบ Direct (ทะลุ cleanPostsCache สำหรับแอดที่โหลดลิงก์/SVG ทีหลัง)
  function blockDirectSponsored() {
    const isSearchPage = location.pathname.startsWith("/search");
    if (
      (isSearchPage && !config.removeSearchAds && !config.cleanMode) ||
      (!isSearchPage && !config.removeSponsored && !config.cleanMode)
    ) {
      return;
    }

    // 1. ดักจากลิงก์ /ads/about โดยตรง
    document.querySelectorAll('a[href*="/ads/about"]').forEach((node) => {
      if (node.closest("[data-abff-blocked]")) return;
      const card = findCardContainer(node);
      if (card && !card.dataset.abffBlocked) {
        applyBlock(card, "Sponsored (Direct)", "sponsored", 1);
      }
    });

    // 2. ดักจาก SVG <use> ที่ซ่อนคำว่า Sponsored ใน aria-labelledby
    document.querySelectorAll("span[aria-labelledby] svg use").forEach((useEl) => {
      if (useEl.closest("[data-abff-blocked]")) return;
      const wrapper = useEl.closest("span[aria-labelledby]");
      const ids = (wrapper?.getAttribute("aria-labelledby") || "").split(/\s+/);
      for (const id of ids) {
        const target = id ? document.getElementById(id) : null;
        if (target && isSponsoredLabelText(target.textContent)) {
          const card = findCardContainer(wrapper);
          if (card && !card.dataset.abffBlocked) {
            applyBlock(card, "Sponsored (SVG)", "sponsored", 1);
          }
          break;
        }
      }
    });
  }

  function blockRightRailAndMarketplaceAds() {
    if (!config.removeMarketAds && !config.removeSponsored && !config.cleanMode) {
      return;
    }

    document.querySelectorAll("section").forEach((sec) => {
      if (sec.dataset.abffBlocked || cleanPostsCache.has(sec)) return;
      if (isSponsoredElement(sec)) {
        const adMenus = sec.querySelectorAll(
          '[aria-label*="sponsored content" i], [aria-label*="เนื้อหาที่ได้รับการสนับสนุน"]'
        );
        const count = adMenus.length > 0 ? adMenus.length : 1;
        applyBlock(sec, "Sponsored Rail", "sponsored", count);
      }
    });
  }

  // ดักจับกล่อง PPYMK โดยตรงจาก aria-label และลิงก์ /friends/suggestions/
  function blockDirectPPYMK() {
    if (!config.removePPYMK && !config.cleanMode) return;

    const ppymkNodes = document.querySelectorAll(
      'div[aria-label="People you may know" i], div[aria-label="คนที่คุณอาจรู้จัก"], a[href*="/friends/suggestions/"]'
    );

    ppymkNodes.forEach((node) => {
      const card = findCardContainer(node);
      if (card && !card.dataset.abffBlocked) {
        applyBlock(card, "PPYMK", "suggested", 1);
      }
    });
  }

  function getFeedPosts() {
    const feed = document.querySelector('div[role="feed"], div[role="main"]');
    if (!feed) return [];

    const posts = new Set([
      ...feed.querySelectorAll('div[aria-posinset]'),
      ...feed.querySelectorAll('div[data-pagelet^="FeedUnit_"]'),
      ...document.querySelectorAll('div[role="feed"] > div'),
    ]);

    feed.querySelectorAll("h3, h4").forEach((h) => {
      if (h.closest("section")) return;
      const unit = findCardContainer(h);
      if (unit) {
        posts.add(unit);
      }
    });

    return Array.from(posts).filter(
      (el) => !el.dataset.abffBlocked && !cleanPostsCache.has(el) && el.offsetHeight > 0
    );
  }

  function checkAndBlockPost(post) {
    const rawText = cleanText(post.innerText);
    const lowerText = rawText.toLowerCase();
    const isSearchPage = location.pathname.startsWith("/search");

    // 1. บล็อก Sponsored
    if (
      (isSearchPage && (config.removeSearchAds || config.cleanMode)) ||
      (!isSearchPage && (config.removeSponsored || config.cleanMode))
    ) {
      if (isSponsoredElement(post)) {
        applyBlock(post, "Sponsored", "sponsored");
        return;
      }
    }

    // 2. บล็อก Stories
    if (config.removeStories || config.cleanMode) {
      if (
        post.querySelector('div[aria-label="Stories" i], div[aria-label="สตอรี่"]') ||
        post.getAttribute("aria-label") === "Stories"
      ) {
        applyBlock(post, "Stories", null);
        return;
      }
    }

    // 3. บล็อก Reels
    if (config.removeReels || config.cleanMode) {
      const hasReelsHeader =
        lowerText.includes("reels and short videos") ||
        rawText.includes("Reels และวิดีโอสั้น") ||
        post.querySelector('a[href*="/reel/"], a[aria-label="Reels" i]');

      if (hasReelsHeader) {
        applyBlock(post, "Reels", "reels");
        return;
      }
    }

    // 4. บล็อก PPYMK (เช็คแบบ Case-insensitive + เช็ค selector ข้างใน)
    if (config.removePPYMK || config.cleanMode) {
      if (
        lowerText.includes("people you may know") ||
        rawText.includes("คนที่คุณอาจรู้จัก") ||
        post.querySelector('div[aria-label="People you may know" i], a[href*="/friends/suggestions/"], [aria-label^="Add Friend " i], [aria-label^="Remove recommendation for " i]')
      ) {
        applyBlock(post, "PPYMK", "suggested");
        return;
      }
    }

    // 5. บล็อก Groups you might like
    if (config.removeGroups || config.cleanMode) {
      if (
        lowerText.includes("groups you might like") ||
        rawText.includes("กลุ่มที่คุณอาจถูกใจ") ||
        lowerText.includes("suggested groups")
      ) {
        applyBlock(post, "Suggested Group", "suggested");
        return;
      }
    }

    // 6. บล็อก Suggested for you และเพจที่ไม่ได้ติดตาม (ปุ่ม Follow / ติดตาม / Join)
    if (config.removeSuggested || config.cleanMode) {
      if (
        lowerText.includes("suggested for you") ||
        rawText.includes("แนะนำสำหรับคุณ")
      ) {
        applyBlock(post, "Suggested", "suggested");
        return;
      }

      const buttonsAndLinks = post.querySelectorAll(
        'div[role="button"], span[role="button"], a[role="button"]'
      );
      const postRect = post.getBoundingClientRect();
      for (const btn of buttonsAndLinks) {
        const btnRect = btn.getBoundingClientRect();
        if (btnRect.top - postRect.top > 0 && btnRect.top - postRect.top < 130) {
          const btnText = cleanText(btn.innerText || btn.textContent);
          if (
            btnText === "Follow" ||
            btnText === "ติดตาม" ||
            btnText === "Join" ||
            btnText === "เข้าร่วม"
          ) {
            applyBlock(post, `Unfollowed (${btnText})`, "suggested");
            return;
          }
        }
      }
    }

    if (rawText.length > 40) {
      cleanPostsCache.add(post);
    }
  }

  function runBlocker() {
    if (!isContextValid()) {
      safeDisconnect();
      return;
    }
    if (!isReady) return;

    if (config.removeStories || config.cleanMode) {
      document
        .querySelectorAll('div[aria-label="Stories" i], div[aria-label="สตอรี่"]')
        .forEach((el) => {
          const tray = findCardContainer(el) || el;
          applyBlock(tray, "Stories Tray", null);
        });
    }

    blockDirectSponsored();
    blockRightRailAndMarketplaceAds();
    blockDirectPPYMK();

    const posts = getFeedPosts();
    posts.forEach(checkAndBlockPost);
  }

  let scanScheduled = false;
  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
      requestAnimationFrame(() => {
        runBlocker();
        scanScheduled = false;
      });
    }, 150);
  }

  observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length > 0) {
        scheduleScan();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
