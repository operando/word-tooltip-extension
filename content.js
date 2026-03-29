let words = {};
let tooltip = null;

function createTooltip() {
  const el = document.createElement("div");
  el.className = "wt-tooltip";
  el.style.display = "none";
  document.body.appendChild(el);
  return el;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightTextNode(node) {
  const text = node.textContent;
  const keys = Object.keys(words).filter((k) => k.length > 0);
  if (keys.length === 0) return;

  const pattern = new RegExp(
    `(${keys.map(escapeRegex).join("|")})`,
    "gi"
  );
  if (!pattern.test(text)) return;

  const frag = document.createDocumentFragment();
  let lastIndex = 0;
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const span = document.createElement("span");
    span.className = "wt-highlight";
    span.textContent = match[0];
    // Store the key in lowercase for lookup
    const key = Object.keys(words).find(
      (k) => k.toLowerCase() === match[0].toLowerCase()
    );
    span.dataset.wtMeaning = words[key] || "";
    frag.appendChild(span);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
  node.parentNode.replaceChild(frag, node);
}

function walkAndHighlight(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentNode;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT") {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.classList && parent.classList.contains("wt-highlight")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(highlightTextNode);
}

function showTooltip(e) {
  const target = e.target;
  if (!target.classList || !target.classList.contains("wt-highlight")) return;
  if (!tooltip) tooltip = createTooltip();
  tooltip.textContent = target.dataset.wtMeaning;
  tooltip.style.display = "block";
  positionTooltip(e);
}

function positionTooltip(e) {
  if (!tooltip || tooltip.style.display === "none") return;
  const x = e.clientX + 12;
  const y = e.clientY + 16;
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
}

function hideTooltip(e) {
  const target = e.target;
  if (!target.classList || !target.classList.contains("wt-highlight")) return;
  if (tooltip) tooltip.style.display = "none";
}

document.addEventListener("mouseover", showTooltip);
document.addEventListener("mousemove", positionTooltip);
document.addEventListener("mouseout", hideTooltip);

// --- Selection-based word registration ---
let registerIcon = null;

function removeRegisterIcon() {
  if (registerIcon) { registerIcon.remove(); registerIcon = null; }
}

function showRegisterIcon(selectedText, rect) {
  removeRegisterIcon();

  const btn = document.createElement("button");
  btn.className = "wt-register-icon";
  btn.textContent = "+";
  btn.title = `「${selectedText}」を登録`;
  document.body.appendChild(btn);
  registerIcon = btn;

  const x = rect.right + window.scrollX + 4;
  const y = rect.top + window.scrollY + (rect.height / 2) - 14;
  btn.style.left = x + "px";
  btn.style.top = y + "px";

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const url = chrome.runtime.getURL("register.html") + "?word=" + encodeURIComponent(selectedText);
    chrome.runtime.sendMessage({ action: "openTab", url });
    removeRegisterIcon();
  });
}

document.addEventListener("mouseup", (e) => {
  if (registerIcon && registerIcon.contains(e.target)) return;

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (!selectedText || selectedText.length > 100 || selectedText.includes("\n")) {
    removeRegisterIcon();
    return;
  }

  // Don't show if word is already registered
  const alreadyRegistered = Object.keys(words).some(
    (k) => k.toLowerCase() === selectedText.toLowerCase()
  );
  if (alreadyRegistered) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  showRegisterIcon(selectedText, rect);
});

// Load words and highlight
chrome.storage.local.get({ words: {} }, (result) => {
  words = result.words;
  walkAndHighlight(document.body);

  // Watch for dynamically added content
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          walkAndHighlight(node);
        } else if (node.nodeType === Node.TEXT_NODE) {
          highlightTextNode(node);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

// Update when words change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.words) {
    words = changes.words.newValue;
    // Remove existing highlights
    document.querySelectorAll(".wt-highlight").forEach((el) => {
      el.replaceWith(document.createTextNode(el.textContent));
    });
    // Re-normalize text nodes that were split
    document.body.normalize();
    // Re-highlight
    walkAndHighlight(document.body);
  }
});
