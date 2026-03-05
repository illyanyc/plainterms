import { scanForLegalLinks, highlightLink, createLinkObserver } from "../lib/detector";
import { extractPolicyText } from "../lib/extractor";
import { redactPII } from "../lib/redactor";
import { isEnabled } from "../lib/storage";
import type { DetectedLink } from "../types";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",

  async main() {
    let detectedLinks: DetectedLink[] = [];
    let active = true;
    let observer: MutationObserver | null = null;

    function removeHighlights() {
      document.querySelectorAll(".plainterms-badge").forEach((el) => el.remove());
      document.querySelectorAll("[data-plainterms='highlighted']").forEach((el) => {
        (el as HTMLElement).style.position = "";
        el.removeAttribute("data-plainterms");
      });
    }

    function processLinks(links: DetectedLink[]) {
      if (!active) return;

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

    function startDetection() {
      active = true;
      detectedLinks = [];
      const initialLinks = scanForLegalLinks();
      if (initialLinks.length > 0) {
        processLinks(initialLinks);
      }
      observer = createLinkObserver((links) => processLinks(links));
    }

    function stopDetection() {
      active = false;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      removeHighlights();
      detectedLinks = [];
      chrome.runtime.sendMessage({
        type: "LINKS_DETECTED",
        payload: { links: [], tabId: 0 },
      });
    }

    startDetection();

    setTimeout(() => {
      if (active && detectedLinks.length === 0) {
        const lateLinks = scanForLegalLinks();
        if (lateLinks.length > 0) processLinks(lateLinks);
      }
    }, 2000);

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_DETECTED_LINKS") {
        sendResponse(detectedLinks.map(({ element, ...rest }) => rest));
        return true;
      }

      if (message.type === "SET_ENABLED") {
        if (message.payload.enabled && !active) {
          startDetection();
        } else if (!message.payload.enabled && active) {
          stopDetection();
        }
        sendResponse({ ok: true });
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
