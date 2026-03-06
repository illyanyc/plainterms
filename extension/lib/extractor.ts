import { MAX_POLICY_TEXT_LENGTH } from "./constants";

export async function extractPolicyText(url: string): Promise<{ text: string; truncated: boolean }> {
  try {
    const response: { html: string; error?: string } = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "FETCH_URL", url }, (res) => {
        resolve(res ?? { html: "" });
      });
    });

    if (response.html && !response.error) {
      const text = extractTextFromHtml(response.html);
      if (text.length > 200) {
        const truncated = text.length > MAX_POLICY_TEXT_LENGTH;
        return {
          text: truncated ? text.slice(0, MAX_POLICY_TEXT_LENGTH) : text,
          truncated,
        };
      }
    }
  } catch {}

  return extractFromCurrentPage();
}

function extractTextFromHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  removeBoilerplate(doc);

  const mainContent =
    doc.querySelector("main") ??
    doc.querySelector("article") ??
    doc.querySelector('[role="main"]') ??
    doc.querySelector(".content") ??
    doc.querySelector("#content") ??
    doc.body;

  if (!mainContent) return doc.body?.textContent?.trim() ?? "";

  return cleanText(mainContent.textContent ?? "");
}

function extractFromCurrentPage(): { text: string; truncated: boolean } {
  const mainContent =
    document.querySelector("main") ??
    document.querySelector("article") ??
    document.querySelector('[role="main"]') ??
    findLargestTextBlock();

  const text = cleanText(mainContent?.textContent ?? document.body.textContent ?? "");
  const truncated = text.length > MAX_POLICY_TEXT_LENGTH;

  return {
    text: truncated ? text.slice(0, MAX_POLICY_TEXT_LENGTH) : text,
    truncated,
  };
}

function removeBoilerplate(doc: Document): void {
  const selectors = [
    "nav",
    "header",
    "footer",
    "aside",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    ".sidebar",
    ".nav",
    ".menu",
    ".advertisement",
    ".ad",
    "script",
    "style",
    "noscript",
    "iframe",
  ];

  for (const selector of selectors) {
    doc.querySelectorAll(selector).forEach((el) => el.remove());
  }
}

function findLargestTextBlock(): Element | null {
  let largest: Element | null = null;
  let maxLength = 0;

  const candidates = document.querySelectorAll("div, section, article, main");
  for (const el of candidates) {
    const textLen = el.textContent?.length ?? 0;
    if (textLen > maxLength && textLen > 500) {
      maxLength = textLen;
      largest = el;
    }
  }

  return largest;
}

function cleanText(text: string): string {
  return text
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
