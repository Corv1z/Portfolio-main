/* --- index.js --- */

// 1. SELECT ELEMENTS SAFELY
var headerImage = document.querySelector(".header-image");
var navbar = document.querySelector(".navbar");

// 2. WAIT FOR PAGE TO LOAD BEFORE RUNNING SCRIPTS
document.addEventListener("DOMContentLoaded", function() {
    
    // --- Dark Mode Logic ---
    var icon = document.getElementById("icon");
    var body = document.body;

    if (localStorage.getItem("darkMode") === "true") {
        body.classList.add("dark-theme");
        if(icon) icon.checked = true; 
    }

    if(icon) {
        icon.onclick = function() {
            body.classList.toggle("dark-theme");
            localStorage.setItem("darkMode", body.classList.contains("dark-theme"));
        };
    }

    // --- Start Animations & Comments only after load ---
    checkMobileAnimation();
    loadComments();
});

// 3. SCROLL LOGIC
window.onscroll = function() {
    // Check if navbar exists before trying to modify it
    if (navbar && window.scrollY > 550) {
        navbar.classList.add("scrolled");
    } else if (navbar) {
        navbar.classList.remove("scrolled");
    }
};

// 4. SOUND LOGIC
function playSound() {
    var audio = document.getElementById('loudChicken'); 
    if(audio) {
        var newAudio = audio.cloneNode(true);
        newAudio.volume = 1.0;
        newAudio.play();
    }
}

// 5. MOBILE ANIMATION LOGIC
function checkMobileAnimation() {
    // Safety check: if headerImage isn't found, stop here
    if (!headerImage) return; 

    if (window.innerWidth <= 768) {
        headerImage.classList.add("mobile-active");
        headerImage.onclick = function() {
            headerImage.classList.toggle("mobile-active");
        };
    } else {
        headerImage.classList.remove("mobile-active");
        headerImage.onclick = null;
    }
}
window.addEventListener('resize', checkMobileAnimation);


/* --- COMMENTS FUNCTIONALITY --- */

const API_URL = "http://127.0.0.1:3000/comments"; 

// Function to Load Comments
async function loadComments() {
    const container = document.getElementById("comments-container");
    if (!container) return; // Stop if the HTML container is missing

    container.innerHTML = "<p style='text-align:center; color:white;'>Loading...</p>";
    
    try {
        const response = await fetch(API_URL);
        const comments = await response.json();
        
        container.innerHTML = ""; 

        comments.forEach(comment => {
            const div = document.createElement("div");
            div.className = "comment-card";
            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-name">${comment.name}</span>
                    <span class="comment-date">${new Date(comment.date).toLocaleDateString()}</span>
                </div>
                <div class="comment-body">${comment.message}</div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading comments:", error);
        container.innerHTML = "<p style='text-align:center; color:wheat;'>Server not running yet.</p>";
    }
}

// Function to Post a Comment
async function postComment() {
    const nameInput = document.getElementById("comment-name");
    const msgInput = document.getElementById("comment-text");
    
    if(!nameInput || !msgInput) return; // Safety check

    if(!nameInput.value || !msgInput.value) return alert("Please fill in both fields");

    const newComment = {
        name: nameInput.value,
        message: msgInput.value
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newComment)
        });

        nameInput.value = "";
        msgInput.value = "";
        loadComments(); 
        
    } catch (error) {
        alert("Failed to post comment. Is the server running?");
    }
}

async function loadComments() {
    const container = document.getElementById("comments-container");
    if (!container) return;

    container.innerHTML = "<p style='text-align:center; color:white;'>Loading...</p>";
    
    try {
        const response = await fetch(API_URL);
        const comments = await response.json();
        
        container.innerHTML = ""; 

        comments.forEach(comment => {
            const div = document.createElement("div");
            div.className = "comment-card";
            
            // --- THIS IS THE CHANGED PART ---
            // We use .toLocaleString() to show Date AND Time
            const fullDate = new Date(comment.date).toLocaleString(); 

            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-name">${comment.name}</span>
                    <span class="comment-date">${fullDate}</span>
                </div>
                <div class="comment-body">${comment.message}</div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading comments:", error);
    }
}