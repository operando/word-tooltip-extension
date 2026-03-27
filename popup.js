async function getWords() {
  const { words } = await chrome.storage.local.get({ words: {} });
  return words;
}

async function saveWords(words) {
  await chrome.storage.local.set({ words });
}

document.getElementById("add").addEventListener("click", async () => {
  const wordEl = document.getElementById("word");
  const meaningEl = document.getElementById("meaning");
  const word = wordEl.value.trim();
  const meaning = meaningEl.value.trim();
  if (!word || !meaning) return;
  const words = await getWords();
  words[word] = meaning;
  await saveWords(words);
  wordEl.value = "";
  meaningEl.value = "";
  wordEl.focus();
});

document.getElementById("openList").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("list.html") });
});
