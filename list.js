async function getWords() {
  const { words } = await chrome.storage.local.get({ words: {} });
  return words;
}

async function saveWords(words) {
  await chrome.storage.local.set({ words });
}

async function render() {
  const words = await getWords();
  const content = document.getElementById("content");
  const entries = Object.entries(words);

  if (entries.length === 0) {
    content.innerHTML = '<p class="empty">登録されている単語はありません。</p>';
    return;
  }

  let html = `<table>
    <tr><th>単語</th><th>意味</th><th></th></tr>`;
  for (const [word, meaning] of entries) {
    const safeWord = word.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const safeMeaning = meaning.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    html += `<tr>
      <td class="word">${safeWord}</td>
      <td class="meaning" data-word="${safeWord}">${safeMeaning}</td>
      <td class="actions"><button class="del" data-word="${safeWord}">&times;</button></td>
    </tr>`;
  }
  html += "</table>";
  content.innerHTML = html;
}

function startEdit(td) {
  if (td.classList.contains("editing")) return;
  const word = td.dataset.word;
  const currentMeaning = td.textContent;
  td.classList.add("editing");
  td.innerHTML = `
    <textarea class="edit-input">${currentMeaning}</textarea>
    <div class="edit-actions">
      <button class="btn-save" data-word="${word}">保存</button>
      <button class="btn-cancel">キャンセル</button>
    </div>`;
  const textarea = td.querySelector("textarea");
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

document.getElementById("content").addEventListener("click", async (e) => {
  // Delete
  if (e.target.classList.contains("del")) {
    const word = e.target.dataset.word;
    const words = await getWords();
    delete words[word];
    await saveWords(words);
    render();
    return;
  }

  // Start editing
  const td = e.target.closest("td.meaning");
  if (td && !td.classList.contains("editing")) {
    startEdit(td);
    return;
  }

  // Save
  if (e.target.classList.contains("btn-save")) {
    const word = e.target.dataset.word;
    const td = e.target.closest("td.meaning");
    const newMeaning = td.querySelector("textarea").value.trim();
    if (newMeaning) {
      const words = await getWords();
      words[word] = newMeaning;
      await saveWords(words);
    }
    render();
    return;
  }

  // Cancel
  if (e.target.classList.contains("btn-cancel")) {
    render();
    return;
  }
});

// Re-render when storage changes (e.g. word added from popup)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.words) render();
});

render();
