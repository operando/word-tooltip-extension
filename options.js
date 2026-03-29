const apiKeyEl = document.getElementById("apiKey");
const detailLevelEl = document.getElementById("defaultDetailLevel");
const statusEl = document.getElementById("status");

chrome.storage.local.get({ geminiApiKey: "", defaultDetailLevel: "short" }, (result) => {
  apiKeyEl.value = result.geminiApiKey;
  detailLevelEl.value = result.defaultDetailLevel;
});

document.getElementById("save").addEventListener("click", async () => {
  const apiKey = apiKeyEl.value.trim();
  const defaultDetailLevel = detailLevelEl.value;
  await chrome.storage.local.set({ geminiApiKey: apiKey, defaultDetailLevel });
  statusEl.style.display = "block";
  setTimeout(() => { statusEl.style.display = "none"; }, 2000);
});
