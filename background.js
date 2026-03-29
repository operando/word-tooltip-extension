chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "openTab" && message.url) {
    chrome.tabs.create({ url: message.url });
  }
});
