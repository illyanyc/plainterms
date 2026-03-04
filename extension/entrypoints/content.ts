import { scanForLegalLinks, highlightLink, createLinkObserver } from "../lib/detector";
import { extractPolicyText } from "../lib/extractor";
import { redactPII } from "../lib/redactor";
import type { DetectedLink } from "../types";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",

  main() {
    let detectedLinks: DetectedLink[] = [];

    function processLinks(links: DetectedLink[]) {
      const newLinks = links.filter(
        (l) => !detectedLinks.some((existing) => existing.url === l.url)
      );

      if (newLinks.length === 0) return;

      detectedLinks = [...detectedLinks, ...newLinks];

      for (const link of newLinks) {
        highlightLink(link);
      }

      chrome.runtime.sendMessage({
        type: "LINKS_DETECTED",
        payload: {
          links: detectedLinks.map(({ element, ...rest }) => rest),
          tabId: 0,
        },
      });
    }

    const initialLinks = scanForLegalLinks();
    if (initialLinks.length > 0) {
      processLinks(initialLinks);
    }

    createLinkObserver((links) => processLinks(links));

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_DETECTED_LINKS") {
        sendResponse(detectedLinks.map(({ element, ...rest }) => rest));
        return true;
      }

      if (message.type === "EXTRACT_TEXT") {
        extractPolicyText(message.payload.url).then(({ text, truncated }) => {
          const redactedText = redactPII(text);
          sendResponse({ text: redactedText, truncated });
        });
        return true;
      }

      return false;
    });
  },
});
