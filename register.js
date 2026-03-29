const params = new URLSearchParams(window.location.search);
const word = params.get("word") || "";
const meaningEl = document.getElementById("meaning");
const apiErrorEl = document.getElementById("apiError");
const detailLevelEl = document.getElementById("detailLevel");
let currentLevel = "short";
let geminiApiKey = "";

document.getElementById("word").value = word;

async function loadMeaning(level) {
  if (!geminiApiKey || !word) return;

  apiErrorEl.style.display = "none";
  meaningEl.value = "";
  meaningEl.placeholder = "意味を取得中...";
  meaningEl.disabled = true;

  const result = await fetchMeaning(word, geminiApiKey, level);

  meaningEl.disabled = false;
  meaningEl.placeholder = "意味を入力";

  if (result.meaning) {
    meaningEl.value = result.meaning;
  } else if (result.error) {
    apiErrorEl.textContent = `自動取得に失敗しました（${result.error}）`;
    apiErrorEl.style.display = "block";
  }

  meaningEl.focus();
}

detailLevelEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-level]");
  if (!btn || btn.dataset.level === currentLevel) return;

  detailLevelEl.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  currentLevel = btn.dataset.level;
  loadMeaning(currentLevel);
});

(async () => {
  const result = await chrome.storage.local.get({ geminiApiKey: "", defaultDetailLevel: "short" });
  geminiApiKey = result.geminiApiKey;
  currentLevel = result.defaultDetailLevel;

  detailLevelEl.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.level === currentLevel);
  });

  await loadMeaning(currentLevel);
  if (!geminiApiKey) meaningEl.focus();
})();

document.getElementById("save").addEventListener("click", async () => {
  const meaning = meaningEl.value.trim();
  if (!meaning) return;
  const { words } = await chrome.storage.local.get({ words: {} });
  words[word] = meaning;
  await chrome.storage.local.set({ words });
  document.getElementById("form").style.display = "none";
  document.getElementById("done").style.display = "block";
});

document.getElementById("cancel").addEventListener("click", () => {
  window.close();
});
