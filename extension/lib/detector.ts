import type { DetectedLink, PolicyType } from "../types";
import {
  POLICY_KEYWORDS,
  HREF_KEYWORDS,
  LINK_SCORE_THRESHOLDS,
} from "./constants";

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function detectPolicyType(text: string, href: string): { type: PolicyType; score: number } | null {
  const normalizedText = normalizeText(text);
  const normalizedHref = href.toLowerCase();

  for (const [policyType, keywords] of Object.entries(POLICY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText === keyword) {
        return { type: policyType as PolicyType, score: LINK_SCORE_THRESHOLDS.EXACT_TEXT_MATCH };
      }
      if (normalizedText.includes(keyword)) {
        return { type: policyType as PolicyType, score: LINK_SCORE_THRESHOLDS.PARTIAL_TEXT_MATCH };
      }
    }
  }

  for (const keyword of HREF_KEYWORDS) {
    if (normalizedHref.includes(keyword)) {
      const type = inferTypeFromHref(normalizedHref);
      return { type, score: LINK_SCORE_THRESHOLDS.HREF_MATCH };
    }
  }

  return null;
}

function inferTypeFromHref(href: string): PolicyType {
  if (href.includes("privacy")) return "privacy";
  if (href.includes("terms") || href.includes("tos")) return "terms";
  if (href.includes("cookie")) return "cookie";
  if (href.includes("refund") || href.includes("return") || href.includes("cancellation")) return "refund";
  return "other";
}

export function scanForLegalLinks(root: Document | HTMLElement = document): DetectedLink[] {
  const links: DetectedLink[] = [];
  const seen = new Set<string>();

  const anchors = root.querySelectorAll<HTMLAnchorElement>("a[href]");

  for (const anchor of anchors) {
    const href = anchor.href;
    const text = anchor.textContent?.trim() ?? "";

    if (!text || text.length > 200 || seen.has(href)) continue;
    seen.add(href);

    const result = detectPolicyType(text, href);
    if (result && result.score >= LINK_SCORE_THRESHOLDS.MINIMUM) {
      links.push({
        url: href,
        text,
        policyType: result.type,
        score: result.score,
        element: anchor,
      });
    }
  }

  return links;
}

export function highlightLink(link: DetectedLink): void {
  const el = link.element;
  if (!el || el.dataset.plainterms === "highlighted") return;

  el.dataset.plainterms = "highlighted";
  el.style.position = "relative";

  const badge = document.createElement("span");
  badge.className = "plainterms-badge";
  badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  badge.title = `PlainTerms: ${link.policyType} detected`;

  Object.assign(badge.style, {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: "4px",
    cursor: "pointer",
    verticalAlign: "middle",
    opacity: "0.85",
    transition: "opacity 0.2s",
  });

  badge.addEventListener("mouseenter", () => { badge.style.opacity = "1"; });
  badge.addEventListener("mouseleave", () => { badge.style.opacity = "0.85"; });

  badge.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({
      type: "OPEN_SIDEPANEL",
      payload: {
        url: link.url,
        policyText: "",
        policyType: link.policyType,
      },
    });
  });

  el.appendChild(badge);
}

export function createLinkObserver(callback: (links: DetectedLink[]) => void): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hasNewNodes = true;
        break;
      }
    }
    if (hasNewNodes) {
      const links = scanForLegalLinks();
      if (links.length > 0) callback(links);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}
