import __hideIfSponsored from "./hideIfSponsored";

const possibleSponsoredTextQueries = [
  'a[role="link"] span[aria-labelledby]',
  'div[role="button"] > span[aria-labelledby]',
  'span[dir="auto"] > span > div[role="button"]:not([aria-labelledby])',
  "span > a[aria-label]",
  "a[href*='/ads/about']",
  "use",
  'span[dir="auto"]',
  "h3[dir='auto']",
  "span[style*='order: 0;']>span[style*='order: 28;']",
];

// Selector สำหรับหากล่องโพสต์แต่ละโพสต์ในยุคปัจจุบัน
const POST_CONTAINER_SELECTOR =
  'div[data-pagelet^="FeedUnit_"], div[role="article"], div[aria-posinset]';

function hideIfSponsored(e) {
  return __hideIfSponsored(possibleSponsoredTextQueries, e);
}

let feedObserver = null;

function scanFeedPosts(rootNode = document) {
  rootNode.querySelectorAll(POST_CONTAINER_SELECTOR).forEach(hideIfSponsored);
}

function setFeedObserver() {
  const feed =
    document.querySelector('div[role="feed"]:not([data-adblock-monitored])') ||
    document.querySelector('div[role="main"]:not([data-adblock-monitored])');

  if (feed !== null) {
    scanFeedPosts(feed);

    feed.dataset.adblockMonitored = true;
    feedObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && node.matches(POST_CONTAINER_SELECTOR)) {
                hideIfSponsored(node);
              } else {
                scanFeedPosts(node);
              }
            }
          });
        }
      });
    });

    feedObserver.observe(feed, {
      childList: true,
      subtree: true,
    });
    console.info("ABfF:", "Monitoring feed updates", [feed]);
  } else {
    setTimeout(setFeedObserver, 1000);
  }
}

function setupPageObserver() {
  const rootDiv =
    document.querySelector("div[data-pagelet=root]") ||
    document.querySelector("div[id^=mount_0_0]") ||
    document.body;

  if (rootDiv !== null) {
    setFeedObserver();
    const pageObserver = new MutationObserver(() => {
      if (!document.querySelector("[data-adblock-monitored]")) {
        setFeedObserver();
      }
    });
    pageObserver.observe(rootDiv, {
      childList: true,
      subtree: true,
    });
  } else {
    setTimeout(setupPageObserver, 1000);
  }
}

function isFB5() {
  return (
    document.querySelectorAll("[id^=mount_0_0]").length > 0 ||
    document.querySelector('div[role="main"]') !== null
  );
}

export { setupPageObserver, isFB5 };
