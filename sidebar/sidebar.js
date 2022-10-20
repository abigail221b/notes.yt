/**
 * ID of the youtube video in the active current tab.
 * videoID is null when the active current tab is not a youtube video
 */
let videoID;

/**
 * Elements from the editTimestamp_view
 */
let editTimestamp_view = document.getElementById("editTimestamp_view");
let editTimestamp_seconds = document.getElementById("editTimestamp_timeInSeconds");
let editTimestamp_time = document.getElementById("editTimestamp_time");
let editTimestamp_textarea = document.getElementById("editTimestamp_textarea");
let delete_button = document.getElementById("editTimestamp_delete");
let editTimestamp_backButton = document.getElementById("editTimestamp_backButton");


/**
 * Elements from the timestamps_view
 */
let timestamps_view = document.getElementById("timestamps_view");
let new_button = document.getElementById("new_button");
let timestamps_wrapper = document.getElementById("timestamps");

/**
 * Elements from the createTimestamp_view
 */
let createTimestamp_view = document.getElementById("createTimestamp_view");
let createTimestamp_backButton = document.getElementById("createTimestamp_backButton");
let hour_input = document.getElementById("h");
let min_input = document.getElementById("m");
let sec_input = document.getElementById("s");
let createTimestamp_textarea = document.getElementById("createTimestamp_textarea");
let error_message = document.getElementById("error_message");
let save_button = document.getElementById("save_button");

/**
 * After sideboar loads, determine if the current tab is a youtube video,
 * then render the appropriate sidebar view.
 */
browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {

    if(isYoutubeVideo(tabs[0].url)) {
        videoID = getVideoID(tabs[0].url);
        showTimestampList();
    } else {
        clearSidebar();
    }
});

/**
 * Fires when the user switches to another tab. Determine if the new
 * active tab is a youtube video or not, then render the appropriate
 * sidebar view
 */
browser.tabs.onActivated.addListener(activeTabInfo => {
    hideTimestampList();

    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if(isYoutubeVideo(tabs[0].url)) {
            videoID = getVideoID(tabs[0].url);
            showTimestampList();
        } else {
            clearSidebar();
        }
    })
})

/**
 * Fires when the user goes to another page within the active tab.
 * Determine if the new page is a youtube video or not, then render
 * the appropriate sidebar view
 */
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    hideTimestampList();

    if(isYoutubeVideo(tab.url)) {
        videoID = getVideoID(tab.url);
        showTimestampList();
    } else {
        clearSidebar();
    }
}, {
    properties: ["url", "title"]
});

/**
 * Back button of the editTimestamp_view hides the editTimestamp_view
 * and displays the timestamps_view
 */
editTimestamp_backButton.addEventListener("click", () => {
    hideNote();
    showTimestampList();
});

/**
 * Click event listener for the back button of the new timestamp form
 * Back button of the createTimestamp_view hides the createTimestamp_view
 * and displays the timestamps_view
 */
createTimestamp_backButton.addEventListener("click", () => {
    hideNewTimestampForm();
    showTimestampList();
});

/**
 * New button of the timestamps_view hides the timestamps_view
 * and displays the createTimestamp_view
 */
new_button.addEventListener("click", () => {
    hideTimestampList();
    showNewTimestampForm();
});

/**
 * Input event listeners on hour/minute/seconds inputs.
 * Displays error message if user enters an invalid value
 */
hour_input.addEventListener("input", (e) => {
    toggleErrorMsg(e.target.value);
});
min_input.addEventListener("input", (e) => {
    toggleErrorMsg(e.target.value);
});
sec_input.addEventListener("input", (e) => {
    toggleErrorMsg(e.target.value);
});

const toggleErrorMsg = (input) => {
    if(isNaN(input)) error_message.classList.remove("hide");
    else error_message.classList.add("hide");
}

/** 
 * Save button of the createTimestamp_view saves the new timestamp 
 * to localstorage
 */
save_button.addEventListener("click", () => {

    let hour = hour_input.value === ""? 0 : parseInt(hour_input.value);
    let min =  min_input.value === ""? 0 : parseInt(min_input.value);
    let sec =  sec_input.value === ""? 0 : parseInt(sec_input.value);

    let seconds = ((hour * 3600) + (min * 60) + sec);
    
    let note = createTimestamp_textarea.value;

    browser.storage.local.get(videoID)
    .then(timestamps => {
        if(Object.keys(timestamps).length === 0)
            return [];
        return timestamps[videoID];
    })
    .then(timestamps => {
        browser.storage.local.set({
            [videoID]: [...timestamps, {
                time: seconds,
                note: note
            }]
        })
        .then(() => {
            hideNewTimestampForm();
            showTimestampList();
        });
    });

});

const showNote = (time, note) => {
    editTimestamp_seconds.value = time;
    editTimestamp_time.innerHTML = formatTime(time);
    editTimestamp_textarea.value = note;
    editTimestamp_view.classList.remove("hide");
}

const hideNote = () => {
    editTimestamp_seconds.value = "";
    editTimestamp_textarea.value = "";
    editTimestamp_time.textContent = "";
    editTimestamp_view.classList.add("hide");
}

const showTimestampList = () => {
    browser.storage.local.get(videoID)
    .then(timestamps => {
        if(timestamps[videoID] !== undefined) {
            timestamps = timestamps[videoID];
            
            timestamps.forEach(timestamp => {
                let card_timestamp = document.createElement("div");
                card_timestamp.classList.add("card", "timestamp");
    
                let time = document.createElement("a");
                time.classList.add("time");
                time.innerHTML = formatTime(timestamp.time); // format time
                time.addEventListener("click", (e) => {
                    playVideoAtTimestamp(timestamp.time);
                });
    
                let note_preview = document.createElement("p");
                note_preview.classList.add("note_preview");
                note_preview.innerHTML = timestamp.note;
    
                card_timestamp.appendChild(time);
                card_timestamp.appendChild(note_preview);

                card_timestamp.addEventListener("click", (e) => {
                    if(e.target.className !== "time") {
                        hideTimestampList();
                        showNote(timestamp.time, timestamp.note);
                    }
                });
    
                timestamps_wrapper.appendChild(card_timestamp);
            })
        }
    });

    timestamps_view.classList.remove("hide");
};

/**
 * Delete link of the editTimestamp_view deletes the current video 
 * timestamp from localstorage
 */
delete_button.addEventListener("click", () => {
    let time = parseInt(editTimestamp_seconds.value);

    browser.storage.local.get(videoID).then(timestamps => {
        timestamps = timestamps[videoID];

        timestamps = timestamps.filter(timestamp => timestamp.time !== time );

        browser.storage.local.set({
            [videoID]: timestamps
        })
        .then(() => {
            hideNote();
            showTimestampList();
        });

    });
});

/**
 * Play video at the specified time stored in the editTimestamp_seconds element
 */
editTimestamp_time.addEventListener("click", (e) => {
    playVideoAtTimestamp(editTimestamp_seconds.value);
});

/**
 * Save changes in the text area of the editTimestamp_view to localstorage
 */
editTimestamp_textarea.addEventListener("change", (e) => {
    let time = parseInt(editTimestamp_seconds.value);

    browser.storage.local.get(videoID).then(timestamps => {
        timestamps = timestamps[videoID];
        for(let i = 0; i < timestamps.length; i++) {
            if(timestamps[i].time === time) {
                timestamps[i].note = e.target.value;
                break;
            }
        }

        browser.storage.local.set({
            [videoID]: timestamps
        })
    })
});

const hideTimestampList = () => {
    timestamps_wrapper.textContent = "";
    timestamps_view.classList.add("hide")
}

const showNewTimestampForm = () => {
    createTimestamp_view.classList.remove("hide");
}

const hideNewTimestampForm = () => {
    hour_input.value = "";
    min_input.value = "";
    sec_input.value = "";
    createTimestamp_textarea.value = "";
    createTimestamp_view.classList.add("hide");
}

const clearSidebar = () => {
    hideNote();
    hideTimestampList();
    hideNewTimestampForm();
    videoID = null;
}

/**
 * Send current tab and time to background script
 * The background script will relay the info to the content script
 * The concent script will then set the yt video player at the given time
 */
const playVideoAtTimestamp = (time) => {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        let tab = tabs[0];
        browser.runtime.sendMessage({ tabId: tab.id, time: time });
    });
}

const formatTime = (timeInSeconds) => {
    let remainingSeconds = parseInt(timeInSeconds);
    let hours = Math.floor(remainingSeconds / 3600);

    remainingSeconds = timeInSeconds % 3600;
    let minutes = Math.floor(remainingSeconds / 60);

    remainingSeconds = remainingSeconds % 60;

    return `${ hours == 0? "" : hours < 10? "0" + hours + ":" : hours + ":"}${ minutes < 10? "0" + minutes : minutes}:${remainingSeconds<10? "0" + remainingSeconds: remainingSeconds}`;
}

const isYoutubeVideo = (url) => {
    return url.includes("youtube.com/watch?v=");
}

const getVideoID = (url) => {
    startIndex = url.indexOf("v=") + 2;
    endIndex = url.indexOf("&");

    if(endIndex === -1) return url.substring(startIndex);
    return url.substring(startIndex, endIndex);
}
