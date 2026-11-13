chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "UPDATE_BADGE" && sender.tab && sender.tab.id) {
    const text = msg.count > 0 ? (msg.count > 999 ? "999+" : String(msg.count)) : "";
    chrome.action.setBadgeText({ text, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#e41e3f", tabId: sender.tab.id });
  }
});