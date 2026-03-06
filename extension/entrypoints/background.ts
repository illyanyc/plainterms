import type { ExtensionMessage, DetectedLink } from "../types";

const tabLinks = new Map<number, Omit<DetectedLink, "element">[]>();
const pendingAnalysis = new Map<string, boolean>();

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "plainterms-analyze",
      title: "Analyze this page's policies",
      contexts: ["page"],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "plainterms-analyze" && tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  });

  chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
    if (message.type === "FETCH_URL") {
      fetch(message.url)
        .then((r) => r.text())
        .then((html) => sendResponse({ html }))
        .catch((e) => sendResponse({ html: "", error: e.message }));
      return true;
    }

    switch (message.type) {
      case "LINKS_DETECTED": {
        const tabId = sender.tab?.id ?? message.payload.tabId;
        if (tabId) {
          tabLinks.set(tabId, message.payload.links);
          chrome.action.setBadgeText({
            text: String(message.payload.links.length),
            tabId,
          });
          chrome.action.setBadgeBackgroundColor({
            color: "#2563eb",
            tabId,
          });
        }
        break;
      }

      case "OPEN_SIDEPANEL": {
        const tabId = sender.tab?.id;
        if (tabId) {
          chrome.storage.session.set({
            pendingAnalysis: message.payload,
          });
          chrome.sidePanel.open({ tabId });
        }
        break;
      }

      case "GET_DETECTED_LINKS": {
        const tabId = sender.tab?.id;
        if (tabId) {
          sendResponse(tabLinks.get(tabId) ?? []);
        } else {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTabId = tabs[0]?.id;
            sendResponse(activeTabId ? tabLinks.get(activeTabId) ?? [] : []);
          });
          return true;
        }
        break;
      }

      case "GET_USAGE": {
        import("../lib/storage").then(({ getUsage }) => {
          getUsage().then(sendResponse);
        });
        return true;
      }
    }
    return false;
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    tabLinks.delete(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "loading") {
      tabLinks.delete(tabId);
      chrome.action.setBadgeText({ text: "", tabId });
    }
    if (changeInfo.status === "complete" && tab.url) {
      chrome.runtime.sendMessage({
        type: "TAB_NAVIGATED",
        payload: { tabId, url: tab.url },
      }).catch(() => {});
    }
  });

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      chrome.runtime.sendMessage({
        type: "TAB_NAVIGATED",
        payload: { tabId: activeInfo.tabId, url: tab.url },
      }).catch(() => {});
    }
  });
});
