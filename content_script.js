

browser.runtime.onMessage.addListener(message => {
    let videoElements = document.getElementsByTagName("video").length;
    let player = document.getElementsByTagName("video")[videoElements - 1];
    player.currentTime = message.time;
});