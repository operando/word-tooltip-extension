const params = new URLSearchParams(window.location.search);
const word = params.get("word") || "";

document.getElementById("word").value = word;

if (word) {
  document.getElementById("meaning").focus();
}

document.getElementById("save").addEventListener("click", async () => {
  const meaning = document.getElementById("meaning").value.trim();
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
