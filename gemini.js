const DETAIL_LEVELS = {
  short: "1〜2文で簡潔に説明してください。",
  medium: "3〜5文で、具体例や補足を含めて説明してください。",
  detailed: "8〜10文程度で、背景・具体例・関連用語なども含めて詳しく説明してください。",
};

async function fetchMeaning(word, apiKey, level = "short") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  const lengthInstruction = DETAIL_LEVELS[level] || DETAIL_LEVELS.short;
  const prompt = `単語の意味を${lengthInstruction}略語の場合は正式名称も含めてください。
ルール:
- 「〇〇とは」「〇〇は」のような枕詞で始めない
- Markdown装飾を使わない
- 意味の説明だけを直接書く

例:
単語: CVR
回答: Conversion Rateの略。Webサイト訪問者のうち、目標とするアクション（購入・登録など）を行った割合。

単語: ${word}
回答:`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      return { error: `API error: ${res.status}` };
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      text = text.trim().replace(/\*\*/g, "");
      const prefixPattern = new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[（(][^)）]*[)）]\\s*[はとのを、．.]\\s*`, "i");
      text = text.replace(prefixPattern, "");
      const simplePrefix = new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[はとのを、．.]\\s*`, "i");
      text = text.replace(simplePrefix, "");
      return { meaning: text.trim() };
    }
    return { error: "No result from API" };
  } catch (e) {
    return { error: e.message };
  }
}
