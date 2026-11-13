const allowedList = [];

const staticBlockedList = [
  "._m8c",
  ".uiStreamSponsoredLink",
  'a[data-hovercard][href*="hc_ref=ADS"]',
  'a[role="button"][rel~="noopener"][data-lynx-mode="async"]',
  'a[href*="/ads/about"]',
  'a[href*="?__cft__"][href*="&__tn__="] span[aria-labelledby]',
];

const sponsoredTexts = [
  "Sponsored",
  "ได้รับการสนับสนุน",
  "Suggested for you",
  "แนะนำสำหรับคุณ",
  "Reels and short videos",
  "Reels และวิดีโอสั้น",
  "People You May Know",
  "คนที่คุณอาจรู้จัก",
  "Groups you might like",
  "กลุ่มที่คุณอาจถูกใจ",
  "Follow",
  "ติดตาม",
  "Join",
  "เข้าร่วม",
];

function getBlockedList() {
  const ariaLabels = sponsoredTexts.map((t) => `[aria-label="${t}"]`);
  return [...staticBlockedList, ...ariaLabels];
}

export { allowedList, sponsoredTexts };
export const blockedList = getBlockedList();
