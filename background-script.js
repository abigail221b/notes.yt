
/**
 * Listen for message from sidebar then send it to the content script
 */
browser.runtime.onMessage.addListener((message) => {
    browser.tabs.sendMessage(message.tabId, { time: message.time });
});