

browser.runtime.onMessage.addListener(message => {
    let videoElements = document.getElementsByTagName("video").length;
    let player = document.getElementsByTagName("video")[length - 1];
    player.currentTime = message.time;
});