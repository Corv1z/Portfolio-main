/* =========================================
   UI & NAVIGATION
========================================= */
var headerImage = document.querySelector(".header-image");
var navbar = document.querySelector(".navbar");

document.addEventListener("DOMContentLoaded", function() {
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

    checkMobileAnimation();
    loadComments();
});

window.onscroll = function() {
    if (navbar && window.scrollY > 550) {
        navbar.classList.add("scrolled");
    } else if (navbar) {
        navbar.classList.remove("scrolled");
    }
};

function playSound() {
    var audio = document.getElementById('loudChicken'); 
    if(audio) {
        var newAudio = audio.cloneNode(true);
        newAudio.volume = 1.0;
        newAudio.play();
    }
}

function checkMobileAnimation() {
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

/* =========================================
   COMMENTS & DATABASE SETUP
========================================= */
// Important: Switch back to your Render URL when deploying!
// const API_URL = "http://127.0.0.1:3000/comments";
const API_URL = "https://portfolio-backend-d3ko.onrender.com/comments";

let myUserId = localStorage.getItem("myUserId");
if (!myUserId) {
    myUserId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("myUserId", myUserId);
}

let allComments = [];
let currentPage = 1;
let commentsPerPage = 5; 
let currentSort = "newest";

async function loadComments() {
    const container = document.getElementById("comments-container");
    if (!container) return;
    if (allComments.length === 0) container.innerHTML = "<p style='text-align:center; color:white;'>Loading...</p>";
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allComments = data.comments; 
        renderComments(); 
    } catch (error) {
        console.error("Error loading comments:", error);
        container.innerHTML = "<p style='text-align:center; color:wheat;'>Server waking up or not running...</p>";
    }
}

/* =========================================
   RENDER COMMENTS
========================================= */
function renderComments() {
    const container = document.getElementById("comments-container");
    if (!container) return;

    // Sorting Logic
    allComments.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return currentSort === "newest" ? dateB - dateA : dateA - dateB;
    });

    // Pagination Logic
    const totalPages = Math.ceil(allComments.length / commentsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * commentsPerPage;
    const paginatedComments = allComments.slice(startIndex, startIndex + commentsPerPage);

    // Render Controls
    let html = `
        <div class="comments-controls" style="justify-content: flex-start; gap: 15px;">
            <select class="sort-dropdown" onchange="changeSort(this.value)">
                <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>Newest First</option>
                <option value="oldest" ${currentSort === 'oldest' ? 'selected' : ''}>Oldest First</option>
            </select>
            
            <select class="sort-dropdown" onchange="changePerPage(this.value)">
                <option value="5" ${commentsPerPage == 5 ? 'selected' : ''}>Show 5</option>
                <option value="10" ${commentsPerPage == 10 ? 'selected' : ''}>Show 10</option>
                <option value="15" ${commentsPerPage == 15 ? 'selected' : ''}>Show 15</option>
                <option value="20" ${commentsPerPage == 20 ? 'selected' : ''}>Show 20</option>
            </select>
        </div>
    `;

    // Render Each Comment
    paginatedComments.forEach(comment => {
        const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.name)}`;
        const fullDate = formatTime(comment.date);
        const likesCount = Array.isArray(comment.likes) ? comment.likes.length : 0;
        const dislikesCount = Array.isArray(comment.dislikes) ? comment.dislikes.length : 0;
        const userLiked = Array.isArray(comment.likes) && comment.likes.includes(myUserId);
        const userDisliked = Array.isArray(comment.dislikes) && comment.dislikes.includes(myUserId);

        // Render Replies
        let repliesHtml = (comment.replies || []).map(r => {
            const replyLikes = Array.isArray(r.likes) ? r.likes.length : 0;
            const replyDislikes = Array.isArray(r.dislikes) ? r.dislikes.length : 0;
            const userLikedReply = Array.isArray(r.likes) && r.likes.includes(myUserId);
            const userDislikedReply = Array.isArray(r.dislikes) && r.dislikes.includes(myUserId);
            
            const replyGifHtml = r.gifUrl ? `<div class="media-preview-wrapper"><img src="${r.gifUrl}" class="media-preview-image" style="cursor: zoom-in;" onclick="openLightbox('${r.gifUrl}')"></div>` : '';
            const replyImageHtml = r.imageUrl ? `<div class="media-preview-wrapper"><img src="${r.imageUrl}" class="media-preview-image" style="cursor: zoom-in;" onclick="openLightbox('${r.imageUrl}')"></div>` : '';
            
            return `
            <div class="reply-container" id="reply-item-${r._id}">
                <div class="reply-header">
                    <span style="color:wheat; font-weight:bold; font-size: 14px;">${r.name}</span>
                    <span style="font-size:12px; color:gray;">${formatTime(r.date)}</span>
                </div>
                <div style="color: var(--secondary-color); font-size: 14px;">
                    ${formatMessage(r.message)}
                </div>
                <div style="margin-top: 5px;">
                    ${replyGifHtml}
                    ${replyImageHtml}
                </div>

                <div style="margin-top: 8px; display: flex; gap: 10px; font-size: 12px; align-items: center;">
                    <button class="vote-btn ${userLikedReply ? 'active-like' : ''}" onclick="voteReply('${comment._id}', '${r._id}', 'like')">👍 ${replyLikes}</button>
                    <button class="vote-btn ${userDislikedReply ? 'active-dislike' : ''}" onclick="voteReply('${comment._id}', '${r._id}', 'dislike')">👎 ${replyDislikes}</button>
                    <button class="reply-btn" style="background: none; border: none; color: gray; cursor: pointer;" onclick="replyToReply('${comment._id}', '${r.name}', '${r._id}')">💬 Reply</button>
                </div>
            </div>`;
        }).join('');

        // Comment Visuals & State
        const mainGifHtml = comment.gifUrl ? `<div class="media-preview-wrapper"><img src="${comment.gifUrl}" class="media-preview-image" style="cursor: zoom-in;" onclick="openLightbox('${comment.gifUrl}')"></div>` : '';
        const mainImageHtml = comment.imageUrl ? `<div class="media-preview-wrapper"><img src="${comment.imageUrl}" class="media-preview-image" style="cursor: zoom-in;" onclick="openLightbox('${comment.imageUrl}')"></div>` : '';
        const isLong = comment.message.length > 300;
        const pinnedBadge = comment.isPinned ? `<span style="background: rgba(245, 222, 179, 0.2); color: wheat; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 10px; border: 1px solid rgba(245, 222, 179, 0.4);">📌 Pinned</span>` : '';

        // Reaction Counts
        const hearts = comment.reactions?.heart?.length || 0;
        const laughs = comment.reactions?.laugh?.length || 0;
        const wows = comment.reactions?.wow?.length || 0;
        const sads = comment.reactions?.sad?.length || 0;
        const fires = comment.reactions?.fire?.length || 0;

        // Construct HTML for the Main Card
        html += `
            <div class="comment-card" style="${comment.isPinned ? 'border: 1px solid wheat;' : ''}">
                <div class="comment-header">
                    <div class="header-left" style="display: flex; align-items: center; gap: 12px;">
                        <img src="${avatarUrl}" class="comment-avatar">
                        <div style="display: flex; flex-direction: column;">
                            <div style="display: flex; align-items: center;">
                                <span class="comment-name">${comment.name}</span>
                                ${pinnedBadge}
                            </div>
                            <span class="comment-date">${fullDate}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <button class="delete-btn" style="color: wheat; border-color: wheat; background: transparent;" onclick="pinComment('${comment._id}')">Pin</button>
                        <button class="delete-btn" onclick="deleteComment('${comment._id}')">Delete</button>
                    </div>
                </div>
                
                <div class="comment-body ${isLong ? 'long-text' : ''}" id="body-${comment._id}">
                    ${formatMessage(comment.message)}
                </div>
                <div style="margin-top: 10px;">
                    ${mainGifHtml} 
                    ${mainImageHtml}
                </div>
                
                ${isLong ? `<button class="read-more-btn" id="btn-${comment._id}" style="display:block;" onclick="toggleReadMore('${comment._id}')">Read More</button>` : ''}
                
                <div id="main-actions-${comment._id}" style="margin-top: 15px; display: flex; gap: 15px; font-size: 14px; align-items: center; position: relative;">
                    <div class="react-wrapper">
                        <button class="reply-btn">👍 React</button>
                        <div class="reaction-popup">
                            <span onclick="reactToComment('${comment._id}', 'heart')">❤️</span>
                            <span onclick="reactToComment('${comment._id}', 'laugh')">😂</span>
                            <span onclick="reactToComment('${comment._id}', 'wow')">😮</span>
                            <span onclick="reactToComment('${comment._id}', 'sad')">😢</span>
                            <span onclick="reactToComment('${comment._id}', 'fire')">🔥</span>
                        </div>
                    </div>
                    <button class="vote-btn ${userLiked ? 'active-like' : ''}" onclick="voteComment('${comment._id}', 'like')">👍 ${likesCount}</button>
                    <button class="vote-btn ${userDisliked ? 'active-dislike' : ''}" onclick="voteComment('${comment._id}', 'dislike')">👎 ${dislikesCount}</button>
                    <button class="reply-btn" onclick="toggleReplyBox('${comment._id}')">💬 Reply</button>

                    <div class="reaction-badges">
                        ${hearts > 0 ? `<span class="badge">❤️ ${hearts}</span>` : ''}
                        ${laughs > 0 ? `<span class="badge">😂 ${laughs}</span>` : ''}
                        ${wows > 0 ? `<span class="badge">😮 ${wows}</span>` : ''}
                        ${sads > 0 ? `<span class="badge">😢 ${sads}</span>` : ''}
                        ${fires > 0 ? `<span class="badge">🔥 ${fires}</span>` : ''}
                    </div>
                </div>

                <div id="reply-box-${comment._id}" class="reply-form-box" style="display:none;">
                    <input type="text" id="reply-name-${comment._id}" placeholder="Your Name" class="form-input" style="width:100%; padding:10px; margin-bottom:10px; font-size: 14px;">
                    <textarea id="reply-msg-${comment._id}" placeholder="Write a reply..." class="form-input-message" style="width:100%; height:55px; padding:10px; font-size: 14px; margin-bottom: 10px;"></textarea>
                    
                    <div style="margin-bottom: 10px;">
                        <div id="reply-gif-preview-${comment._id}"></div>
                        <div id="reply-image-preview-${comment._id}" style="display: inline-block;"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <button type="button" class="gif-btn" onclick="openGifModal('reply-gif-${comment._id}', 'reply-gif-preview-${comment._id}')">+ GIF</button>
                            <input type="hidden" id="reply-gif-${comment._id}">

                            <label for="reply-image-input-${comment._id}" class="gif-btn" style="cursor: pointer;">📷 Image</label>
                            <input type="file" id="reply-image-input-${comment._id}" accept="image/*" style="display: none;" onchange="handleImagePreview('reply-image-input-${comment._id}', 'reply-image-preview-${comment._id}')">
                        </div>
                        <button onclick="postReply('${comment._id}')" class="form-btn" style="padding: 8px 16px; font-size: 12px;">Send Reply</button>
                    </div>
                </div>
                <div>${repliesHtml}</div>
            </div>
        `;
    });

    html += `
        <div class="pagination-container">
            <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button>
            <span style="color: wheat; align-self: center; font-size: 14px;">Page ${currentPage} of ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>
        </div>
    `;

    container.innerHTML = html;
}

/* =========================================
   PAGINATION & SORTING
========================================= */
function changePage(newPage) {
    currentPage = newPage;
    renderComments();
    const commentSection = document.getElementById("comments-container");
    if (commentSection) commentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changePerPage(newAmount) {
    commentsPerPage = parseInt(newAmount);
    currentPage = 1;
    renderComments();
}

function changeSort(newSort) {
    currentSort = newSort;
    currentPage = 1; 
    renderComments();
}

/* =========================================
   POSTING DATA TO SERVER
========================================= */
async function postComment() {
    const nameInput = document.getElementById("comment-name");
    const msgInput = document.getElementById("comment-text");
    const gifInput = document.getElementById("comment-gif");
    const imageInput = document.getElementById("comment-image-input"); 
    
    if(!nameInput || !msgInput || !nameInput.value || !msgInput.value) return alert("Fill all fields");

    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('message', msgInput.value);
    formData.append('userId', myUserId);
    if (gifInput && gifInput.value) formData.append('gifUrl', gifInput.value);
    if (imageInput && imageInput.files[0]) formData.append('image', imageInput.files[0]);

    try {
        const response = await fetch(API_URL, { method: "POST", body: formData });
        if (response.ok) {
            nameInput.value = ""; msgInput.value = "";
            if (gifInput) gifInput.value = "";
            if (imageInput) imageInput.value = "";
            document.getElementById("comment-gif-preview").innerHTML = "";
            clearImagePreview('comment-image-input', 'comment-image-preview');
            currentPage = 1;
            loadComments();
        } else { 
            alert("Failed to post comment."); 
        }
    } catch (error) { 
        console.error("Error:", error); 
        alert("Error posting comment."); 
    }
}

async function postReply(id) {
    const nameInput = document.getElementById(`reply-name-${id}`);
    const msgInput = document.getElementById(`reply-msg-${id}`);
    const gifInput = document.getElementById(`reply-gif-${id}`);
    const imageInput = document.getElementById(`reply-image-input-${id}`);

    if (!nameInput || !msgInput || !nameInput.value || !msgInput.value) return alert("Fill in both fields");
    
    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('message', msgInput.value);
    formData.append('userId', myUserId);
    if (gifInput && gifInput.value) formData.append('gifUrl', gifInput.value);
    if (imageInput && imageInput.files[0]) formData.append('replyImage', imageInput.files[0]);

    try {
        const response = await fetch(`${API_URL}/${id}/reply`, { method: 'POST', body: formData });
        if (response.ok) {
            nameInput.value = ""; msgInput.value = "";
            if (gifInput) gifInput.value = "";
            if (imageInput) imageInput.value = "";
            document.getElementById(`reply-gif-preview-${id}`).innerHTML = "";
            clearImagePreview(`reply-image-input-${id}`, `reply-image-preview-${id}`);
            loadComments();
        } else { 
            alert("Failed to post reply."); 
        }
    } catch (error) { 
        console.error("Error:", error); 
        alert("Error posting reply."); 
    }
}

/* =========================================
   VOTING & REACTIONS
========================================= */
async function voteComment(id, type) {
    await fetch(`${API_URL}/${id}/vote`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userId: myUserId, type: type }) 
    });
    loadComments();
}

async function voteReply(commentId, replyId, type) {
    await fetch(`${API_URL}/${commentId}/reply/${replyId}/vote`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userId: myUserId, type: type }) 
    });
    loadComments();
}

async function reactToComment(id, emojiType) {
    try {
        await fetch(`${API_URL}/${id}/react`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ userId: myUserId, emojiType: emojiType }) 
        });
        loadComments();
    } catch (error) {
        console.error("Reaction failed:", error);
    }
}

/* =========================================
   UI INTERACTIONS
========================================= */
function toggleReplyBox(id) {
    const box = document.getElementById(`reply-box-${id}`);
    const mainActions = document.getElementById(`main-actions-${id}`);
    mainActions.insertAdjacentElement('afterend', box);
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function replyToReply(commentId, targetName, replyId) {
    const box = document.getElementById(`reply-box-${commentId}`);
    const specificReply = document.getElementById(`reply-item-${replyId}`);
    specificReply.insertAdjacentElement('afterend', box);
    box.style.display = 'block';
    
    const msgBox = document.getElementById(`reply-msg-${commentId}`);
    msgBox.value = `@${targetName} `; 
    msgBox.focus(); 
}

function toggleReadMore(id) {
    const body = document.getElementById(`body-${id}`);
    const btn = document.getElementById(`btn-${id}`);
    if (body.classList.contains("expanded")) {
        body.classList.remove("expanded");
        btn.innerText = "Read More";
    } else {
        body.classList.add("expanded");
        btn.innerText = "Show Less";
    }
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const exact = date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const secs = Math.floor((new Date() - date) / 1000);
    let relative = 'Just now';
    
    if (secs >= 60 && secs < 3600) relative = Math.floor(secs/60) + ' mins ago';
    else if (secs >= 3600 && secs < 86400) relative = Math.floor(secs/3600) + ' hours ago';
    else if (secs >= 86400) relative = Math.floor(secs/86400) + ' days ago';
    return `${exact} • ${relative}`;
}

/* =========================================
   MEDIA UPLOADS & PREVIEWS
========================================= */
function handleImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="media-preview-wrapper">
                    <img src="${e.target.result}" class="media-preview-image">
                    <button type="button" class="remove-media-btn" onclick="clearImagePreview('${inputId}', '${previewId}')">✖</button>
                </div>
            `;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function clearImagePreview(inputId, previewId) {
    document.getElementById(inputId).value = "";
    document.getElementById(previewId).innerHTML = "";
}

/* =========================================
   ADMIN MODALS (PIN / DELETE)
========================================= */
// Create modals in HTML
document.body.insertAdjacentHTML('beforeend', `
    <div id="delete-modal" class="custom-modal-overlay">
        <div class="custom-modal-box">
            <h3 style="color: wheat; margin-bottom: 10px; font-family: 'Inter', sans-serif;">Admin Access</h3>
            <p style="color: gray; font-size: 12px; margin-bottom: 15px;">Enter password to delete this comment.</p>
            <input type="password" id="delete-password" class="form-input" placeholder="Password" style="width: 100%; padding: 10px; margin-bottom: 15px; text-align: center;">
            <div style="display: flex; justify-content: space-between; gap: 10px;">
                <button onclick="closeModal()" class="form-btn" style="background: transparent; border: 1px solid gray; color: gray; width: 100%;">Cancel</button>
                <button onclick="confirmDelete()" class="form-btn" style="background: rgba(255, 100, 100, 0.1); border-color: #ff6b6b; color: #ff6b6b; width: 100%;">Delete</button>
            </div>
        </div>
    </div>

    <div id="pin-modal" class="custom-modal-overlay">
        <div class="custom-modal-box">
            <h3 style="color: wheat; margin-bottom: 10px; font-family: 'Inter', sans-serif;">Admin Access</h3>
            <p style="color: gray; font-size: 12px; margin-bottom: 15px;">Enter password to Pin/Unpin this comment.</p>
            <input type="password" id="pin-password" class="form-input" placeholder="Password" style="width: 100%; padding: 10px; margin-bottom: 15px; text-align: center;">
            <div style="display: flex; justify-content: space-between; gap: 10px;">
                <button onclick="closePinModal()" class="form-btn" style="background: transparent; border: 1px solid gray; color: gray; width: 100%;">Cancel</button>
                <button onclick="confirmPin()" class="form-btn" style="background: rgba(245, 222, 179, 0.1); border-color: wheat; color: wheat; width: 100%;">Confirm</button>
            </div>
        </div>
    </div>
`);

// Delete Logic
let commentToDelete = null;
function deleteComment(id) { 
    commentToDelete = id; 
    document.getElementById("delete-password").value = ""; 
    document.getElementById("delete-modal").style.display = "flex"; 
}
function closeModal() { 
    document.getElementById("delete-modal").style.display = "none"; 
    commentToDelete = null; 
}

async function confirmDelete() { 
    const password = document.getElementById("delete-password").value; 
    if (!password) return alert("Please enter a password."); 
    
    try { 
        const response = await fetch(`${API_URL}/${commentToDelete}`, { 
            method: "DELETE",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: password }) // Send password to server
        }); 
        
        if (response.ok) {
            closeModal(); 
            loadComments(); 
        } else {
            const data = await response.json();
            alert(data.error); // Shows "Incorrect Admin Password" from server
        }
    } catch (error) { 
        alert("Server error. Failed to delete comment."); 
    } 
}

// Pin Logic
let commentToPin = null;
function pinComment(id) { 
    commentToPin = id; 
    document.getElementById("pin-password").value = ""; 
    document.getElementById("pin-modal").style.display = "flex"; 
}
function closePinModal() { 
    document.getElementById("pin-modal").style.display = "none"; 
    commentToPin = null; 
}

async function confirmPin() { 
    const password = document.getElementById("pin-password").value; 
    if (!password) return alert("Please enter a password."); 
    
    try { 
        const response = await fetch(`${API_URL}/${commentToPin}/pin`, { 
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: password }) // Send password to server
        }); 
        
        if (response.ok) {
            closePinModal(); 
            loadComments(); 
        } else {
            const data = await response.json();
            alert(data.error); // Shows "Incorrect Admin Password" from server
        }
    } catch (error) { 
        alert("Server error. Failed to pin comment."); 
    } 
}

/* =========================================
   GIPHY INTEGRATION
========================================= */
const GIPHY_API_KEY = "8DmyfSHSLUnnK0lxTkTDQQ21RYYGEvMR"; 
let targetGifInput = ""; 
let targetGifPreview = "";

document.body.insertAdjacentHTML('beforeend', `
    <div id="gif-modal" class="gif-modal">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
            <h3 style="color:wheat; margin:0;">Search Giphy</h3>
            <button onclick="closeGifModal()" style="background:none; border:none; color:white; cursor:pointer;">✖</button>
        </div>
        <input type="text" id="gif-search" placeholder="Search..." class="form-input" style="width:100%; padding:8px;" onkeyup="fetchGifs(this.value)">
        <div id="gif-results" class="gif-grid"></div>
    </div>
`);

function openGifModal(inputId, previewId) { 
    targetGifInput = inputId; 
    targetGifPreview = previewId; 
    document.getElementById("gif-modal").style.display = "block"; 
    fetchGifs("trending"); 
}

function closeGifModal() { 
    document.getElementById("gif-modal").style.display = "none"; 
}

async function fetchGifs(query) { 
    if (!query) return; 
    let url = query === "trending" 
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=8` 
        : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=8`; 
        
    try { 
        const response = await fetch(url); 
        const json = await response.json(); 
        document.getElementById("gif-results").innerHTML = json.data.map(gif => 
            `<img src="${gif.images.fixed_height_small.url}" onclick="selectGif('${gif.images.downsized_medium.url}')">`
        ).join(''); 
    } catch (err) { 
        console.error("Giphy fetch failed:", err); 
    } 
}

function selectGif(url) { 
    document.getElementById(targetGifInput).value = url; 
    document.getElementById(targetGifPreview).innerHTML = `
        <div class="media-preview-wrapper">
            <img src="${url}" class="media-preview-image">
            <button type="button" class="remove-media-btn" onclick="removeGif('${targetGifInput}', '${targetGifPreview}')">✖</button>
        </div>
    `; 
    closeGifModal(); 
}

function removeGif(inputId, previewId) { 
    document.getElementById(inputId).value = ""; 
    document.getElementById(previewId).innerHTML = ""; 
}

/* =========================================
   LIGHTBOX
========================================= */
document.body.insertAdjacentHTML('beforeend', `
    <div id="lightbox-modal" onclick="closeLightbox()" style="display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); justify-content: center; align-items: center; cursor: zoom-out;">
        <span style="position: absolute; top: 20px; right: 30px; color: wheat; font-size: 40px; font-weight: bold; cursor: pointer;">&times;</span>
        <img id="lightbox-img" style="max-width: 90%; max-height: 90%; border-radius: 10px; box-shadow: 0 0 20px rgba(245, 222, 179, 0.2);">
    </div>
`);

function openLightbox(imgSrc) {
    document.getElementById('lightbox-img').src = imgSrc;
    document.getElementById('lightbox-modal').style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightbox-modal').style.display = 'none';
    document.getElementById('lightbox-img').src = '';
}

/* =========================================
   TYPING INDICATOR & POLLING
========================================= */
const commentInput = document.getElementById("comment-text");
let typingTimer;

if(commentInput) {
    commentInput.addEventListener("input", () => { 
        const name = document.getElementById("comment-name").value || "Someone"; 
        
        fetch(`${API_URL}/typing`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ userId: myUserId, name: name, isTyping: true }) 
        }); 
        
        clearTimeout(typingTimer); 
        
        typingTimer = setTimeout(() => { 
            fetch(`${API_URL}/typing`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ userId: myUserId, isTyping: false }) 
            }); 
        }, 3000); 
    });
}

setInterval(async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        const indicator = document.getElementById("typing-indicator");
        const nameInput = document.getElementById("comment-name");
        const currentName = nameInput ? nameInput.value : "Someone";
        
        const othersTyping = data.typingList.filter(u => u.name !== currentName);

        if (indicator) {
            if (othersTyping.length > 0) {
                indicator.innerText = `${othersTyping[0].name} is typing...`;
                indicator.style.opacity = "1";
            } else {
                indicator.style.opacity = "0";
            }
        }

        const activeEl = document.activeElement;
        const isUserTyping = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");

        if (!isUserTyping && JSON.stringify(data.comments) !== JSON.stringify(allComments)) {
            allComments = data.comments;
            renderComments();
        }
    } catch (error) {}
}, 3000);

/* =========================================
   SNOW ANIMATION ENGINE
========================================= */
const canvasElement = document.getElementById("snow-canvas"); 
if (canvasElement) {
    const canvasContext = canvasElement.getContext("2d"); 
    let viewportWidth = window.innerWidth; 
    let viewportHeight = window.innerHeight; 
    const snowflakeCollection = []; 
    const totalSnowflakeCount = 400; 

    function resizeCanvasToWindow() { 
        viewportWidth = window.innerWidth; 
        viewportHeight = window.innerHeight; 
        canvasElement.width = viewportWidth; 
        canvasElement.height = viewportHeight; 
    } 

    window.addEventListener("resize", resizeCanvasToWindow); 
    resizeCanvasToWindow(); 

    class Snowflake { 
        constructor() { 
            this.initializeProperties(); 
        } 

        initializeProperties() { 
            this.horizontalCoordinate = Math.random() * viewportWidth; 
            this.verticalCoordinate = Math.random() * viewportHeight; 
            this.particleRadius = Math.random() * 3 + 1; 
            this.fallVelocity = Math.random() * 1.5 + 0.5; 
            this.horizontalDrift = Math.random() * 1 - 0.5; 
            this.opacityLevel = Math.random() * 0.8 + 0.2; 
        } 

        updateMovement() { 
            this.verticalCoordinate += this.fallVelocity; 
            this.horizontalCoordinate += this.horizontalDrift; 
            
            if (this.verticalCoordinate > viewportHeight) { 
                this.verticalCoordinate = -10; 
                this.horizontalCoordinate = Math.random() * viewportWidth; 
            } 
        } 

        drawToCanvas() { 
            canvasContext.beginPath(); 
            canvasContext.arc(this.horizontalCoordinate, this.verticalCoordinate, this.particleRadius, 0, Math.PI * 2); 
            canvasContext.fillStyle = `rgba(255, 255, 255, ${this.opacityLevel})`; 
            canvasContext.fill(); 
        } 
    } 

    function createSnowfallEffect() { 
        for (let i = 0; i < totalSnowflakeCount; i++) { 
            snowflakeCollection.push(new Snowflake()); 
        } 
    } 

    function renderAnimationLoop() { 
        canvasContext.clearRect(0, 0, viewportWidth, viewportHeight); 
        snowflakeCollection.forEach((snowflake) => { 
            snowflake.updateMovement(); 
            snowflake.drawToCanvas(); 
        }); 
        requestAnimationFrame(renderAnimationLoop); 
    } 

    createSnowfallEffect(); 
    renderAnimationLoop();
}

/* =========================================
   TEXT FORMATTING HELPERS
========================================= */
function formatMessage(text) {
    if (!text) return "";
    
    // Escape basic HTML to prevent XSS attacks
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Find any word starting with @ and wrap it in a styled span
    return safeText.replace(/@(\w+)/g, '<span style="color: wheat; font-weight: bold;">@$1</span>');
}