

browser.runtime.onMessage.addListener(message => {
    let player = document.getElementsByTagName("video")[0];
    player.currentTime = message.time;
});