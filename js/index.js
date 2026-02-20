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
//   const API_URL = "http://127.0.0.1:3000/comments";
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

    allComments.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return currentSort === "newest" ? dateB - dateA : dateA - dateB;
    });

    const totalPages = Math.ceil(allComments.length / commentsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * commentsPerPage;
    const paginatedComments = allComments.slice(startIndex, startIndex + commentsPerPage);

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

        <div class="pagination-container">
            <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button>
            <span style="color: wheat; align-self: center; font-size: 14px;">Page ${currentPage} of ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>
        </div>
    `;

    paginatedComments.forEach(comment => {
        const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.name)}`;
        const fullDate = formatTime(comment.date);
        const likesCount = Array.isArray(comment.likes) ? comment.likes.length : 0;
        const dislikesCount = Array.isArray(comment.dislikes) ? comment.dislikes.length : 0;
        const userLiked = Array.isArray(comment.likes) && comment.likes.includes(myUserId);
        const userDisliked = Array.isArray(comment.dislikes) && comment.dislikes.includes(myUserId);

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
                    <button class="delete-btn" style="padding: 2px 8px;" onclick="deleteReply('${comment._id}', '${r._id}')">Delete</button>
                </div>
            </div>`;
        }).join('');

        const mainGifHtml = comment.gifUrl ? `<div class="media-preview-wrapper"><img src="${comment.gifUrl}" class="media-preview-image" style="cursor: zoom-in;" onclick="openLightbox('${comment.gifUrl}')"></div>` : '';
        const mainImageHtml = comment.imageUrl ? `<div class="media-preview-wrapper"><img src="${comment.imageUrl}" class="media-preview-image" style="cursor: zoom-in;" onclick="openLightbox('${comment.imageUrl}')"></div>` : '';
        const isLong = comment.message.length > 300;
        const pinnedBadge = comment.isPinned ? `<span style="background: rgba(245, 222, 179, 0.2); color: wheat; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 10px; border: 1px solid rgba(245, 222, 179, 0.4);">📌 Pinned</span>` : '';

        const hearts = comment.reactions?.heart?.length || 0;
        const laughs = comment.reactions?.laugh?.length || 0;
        const wows = comment.reactions?.wow?.length || 0;
        const sads = comment.reactions?.sad?.length || 0;
        const fires = comment.reactions?.fire?.length || 0;

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
   PAGINATION, SORTING & POSTING
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
            document.getElementById("comment-gif-preview").innerHTML = "";
            clearImagePreview('comment-image-input', 'comment-image-preview');
            currentPage = 1;
            loadComments();
        }
    } catch (error) { console.error("Error:", error); }
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
            loadComments();
        }
    } catch (error) { console.error("Error:", error); }
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
    } catch (error) {}
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
    const input = document.getElementById(inputId);
    if(input) input.value = "";
    const preview = document.getElementById(previewId);
    if(preview) preview.innerHTML = "";
}

/* =========================================
   ADMIN MODALS (PIN / DELETE / REPLY DELETE)
========================================= */
document.body.insertAdjacentHTML('beforeend', `
    <div id="delete-modal" class="custom-modal-overlay">
        <div class="custom-modal-box">
            <h3 style="color: wheat; margin-bottom: 10px; font-family: 'Inter', sans-serif;">Admin Access</h3>
            <p style="color: gray; font-size: 12px; margin-bottom: 15px;">Enter password to delete this item.</p>
            <input type="password" id="delete-password" class="form-input" placeholder="Password" style="width: 100%; padding: 10px; margin-bottom: 15px; text-align: center;">
            <div style="display: flex; justify-content: space-between; gap: 10px;">
                <button onclick="closeModal()" class="form-btn" style="background: transparent; border: 1px solid gray; color: gray; width: 100%;">Cancel</button>
                <button id="modal-delete-confirm-btn" onclick="confirmDelete()" class="form-btn" style="background: rgba(255, 100, 100, 0.1); border-color: #ff6b6b; color: #ff6b6b; width: 100%;">Delete</button>
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

let commentToDelete = null;
let replyToDelete = null;

function closeModal() { 
    document.getElementById("delete-modal").style.display = "none"; 
    commentToDelete = null; 
    replyToDelete = null;
    document.getElementById("modal-delete-confirm-btn").setAttribute("onclick", "confirmDelete()");
}

// MAIN COMMENT DELETE
function deleteComment(id) { 
    commentToDelete = id; 
    document.getElementById("delete-password").value = ""; 
    document.getElementById("delete-modal").style.display = "flex"; 
}

async function confirmDelete() { 
    const password = document.getElementById("delete-password").value; 
    if (!password) return alert("Please enter a password."); 
    try { 
        const response = await fetch(`${API_URL}/${commentToDelete}`, { 
            method: "DELETE",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: password })
        }); 
        if (response.ok) { closeModal(); loadComments(); } 
        else { const data = await response.json(); alert(data.error); }
    } catch (error) { alert("Server error."); } 
}

// REPLY DELETE
function deleteReply(commentId, replyId) {
    replyToDelete = { commentId, replyId };
    document.getElementById("delete-password").value = ""; 
    document.getElementById("delete-modal").style.display = "flex";
    document.getElementById("modal-delete-confirm-btn").setAttribute("onclick", "confirmReplyDelete()");
}

async function confirmReplyDelete() {
    const password = document.getElementById("delete-password").value;
    if (!password) return alert("Please enter a password.");
    try {
        const response = await fetch(`${API_URL}/${replyToDelete.commentId}/reply/${replyToDelete.replyId}`, {
            method: "DELETE",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: password })
        });
        if (response.ok) { closeModal(); loadComments(); } 
        else { const data = await response.json(); alert(data.error); }
    } catch (error) { alert("Server error."); }
}

// PIN LOGIC
let commentToPin = null;
function pinComment(id) { 
    commentToPin = id; 
    document.getElementById("pin-password").value = ""; 
    document.getElementById("pin-modal").style.display = "flex"; 
}
function closePinModal() { document.getElementById("pin-modal").style.display = "none"; }
async function confirmPin() { 
    const password = document.getElementById("pin-password").value; 
    if (!password) return alert("Please enter a password."); 
    try { 
        const response = await fetch(`${API_URL}/${commentToPin}/pin`, { 
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: password })
        }); 
        if (response.ok) { closePinModal(); loadComments(); } 
        else { const data = await response.json(); alert(data.error); }
    } catch (error) { alert("Server error."); } 
}

/* =========================================
   GIPHY INTEGRATION (2000 LIMIT)
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

function closeGifModal() { document.getElementById("gif-modal").style.display = "none"; }

async function fetchGifs(query) { 
    if (!query) return; 
    let url = query === "trending" 
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=2000` 
        : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=2000`; 
    try { 
        const response = await fetch(url); 
        const json = await response.json(); 
        document.getElementById("gif-results").innerHTML = json.data.map(gif => 
            `<img src="${gif.images.fixed_height_small.url}" onclick="selectGif('${gif.images.downsized_medium.url}')">`
        ).join(''); 
    } catch (err) { console.error("Giphy failed"); } 
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
   LIGHTBOX, TYPING & SNOW
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
}

setInterval(async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const indicator = document.getElementById("typing-indicator");
        const nameInput = document.getElementById("comment-name");
        const othersTyping = data.typingList.filter(u => u.name !== (nameInput ? nameInput.value : "Someone"));
        if (indicator) indicator.style.opacity = othersTyping.length > 0 ? "1" : "0";
        if (JSON.stringify(data.comments) !== JSON.stringify(allComments)) {
            allComments = data.comments;
            renderComments();
        }
    } catch (error) {}
}, 3000);

const canvasElement = document.getElementById("snow-canvas"); 
if (canvasElement) {
    const canvasContext = canvasElement.getContext("2d"); 
    let viewportWidth = window.innerWidth; 
    let viewportHeight = window.innerHeight; 
    const snowflakeCollection = []; 
    function resize() { viewportWidth = window.innerWidth; viewportHeight = window.innerHeight; canvasElement.width = viewportWidth; canvasElement.height = viewportHeight; }
    window.addEventListener("resize", resize); resize();
    class Snowflake {
        constructor() { this.reset(); }
        reset() { this.x = Math.random() * viewportWidth; this.y = Math.random() * viewportHeight; this.r = Math.random() * 3 + 1; this.v = Math.random() * 1.5 + 0.5; this.d = Math.random() * 1 - 0.5; this.o = Math.random() * 0.8 + 0.2; }
        update() { this.y += this.v; this.x += this.d; if (this.y > viewportHeight) { this.y = -10; this.x = Math.random() * viewportWidth; } }
        draw() { canvasContext.beginPath(); canvasContext.arc(this.x, this.y, this.r, 0, Math.PI * 2); canvasContext.fillStyle = `rgba(255, 255, 255, ${this.o})`; canvasContext.fill(); }
    }
    for (let i = 0; i < 400; i++) snowflakeCollection.push(new Snowflake());
    function loop() { canvasContext.clearRect(0, 0, viewportWidth, viewportHeight); snowflakeCollection.forEach(s => { s.update(); s.draw(); }); requestAnimationFrame(loop); }
    loop();
}

/* =========================================
   TEXT FORMATTING HELPERS
========================================= */
function formatMessage(text) {
    if (!text) return "";
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return safeText.replace(/@(\w+)/g, '<span style="color: wheat; font-weight: bold;">@$1</span>');
}

/* =========================================
   DUTCH WORD GENERATOR (INTERACTIVE)
========================================= */
function updateDutchWord() {
    const dutchDictionary = [
        { dutch: "Gezellig", eng: "Cozy / Social / Fun" },
        { dutch: "Lekker", eng: "Tasty / Nice / Delicious" },
        { dutch: "Dank je wel", eng: "Thank you very much" },
        { dutch: "Mooi", eng: "Beautiful / Pretty" },
        { dutch: "Succes", eng: "Good luck" },
        { dutch: "Fiets", eng: "Bicycle" },
        { dutch: "Hond", eng: "Dog" },
        { dutch: "Kat", eng: "Cat" },
        { dutch: "Brood", eng: "Bread" },
        { dutch: "Kaas", eng: "Cheese" },
        { dutch: "Appel", eng: "Apple" },
        { dutch: "Huis", eng: "House" },
        { dutch: "Boom", eng: "Tree" },
        { dutch: "Zon", eng: "Sun" },
        { dutch: "Maan", eng: "Moon" },
        { dutch: "Ster", eng: "Star" },
        { dutch: "Boek", eng: "Book" },
        { dutch: "Water", eng: "Water" },
        { dutch: "Vriend", eng: "Friend" },
        { dutch: "Kind", eng: "Child" },
        { dutch: "Tafel", eng: "Table" },
        { dutch: "Stoel", eng: "Chair" },
        { dutch: "Raam", eng: "Window" },
        { dutch: "Deur", eng: "Door" },
        { dutch: "Regen", eng: "Rain" },
        { dutch: "Geld", eng: "Money" },
        { dutch: "Blij", eng: "Happy" },
        { dutch: "Snel", eng: "Fast" },
        { dutch: "Klein", eng: "Small" },
        { dutch: "Groot", eng: "Big" },
        { dutch: "Ochtend", eng: "Morning" },
        { dutch: "Nacht", eng: "Night" }
    ];

    const wordEl = document.getElementById("dutch-word");
    const transEl = document.getElementById("dutch-translation");
    const displayBox = document.getElementById("dutch-display-box");
    const icon = document.getElementById("refresh-icon");

    // Start Animations
    displayBox.classList.remove("animate-word");
    icon.classList.remove("spin-icon");
    
    // Trigger Reflow for animation reset
    void displayBox.offsetWidth; 
    void icon.offsetWidth;

    // Select Random Word
    const randomWord = dutchDictionary[Math.floor(Math.random() * dutchDictionary.length)];
    
    wordEl.innerText = randomWord.dutch;
    transEl.innerText = randomWord.eng;

    // Apply Animation Classes
    displayBox.classList.add("animate-word");
    icon.classList.add("spin-icon");
}
/* =========================================
   FAVORITE GAMES POPUP LOGIC
========================================= */
function toggleGamesPopup() {
    document.getElementById("games-floating-popup").classList.toggle("show");
}

// Close popup when clicking outside of it
document.addEventListener('click', function(event) {
    const popup = document.getElementById('games-floating-popup');
    const button = document.querySelector('.games-popup-wrapper .form-btn');
    
    // Check if the popup is open, and if the click was OUTSIDE the popup and button
    if (popup && popup.classList.contains('show')) {
        if (!popup.contains(event.target) && event.target !== button) {
            popup.classList.remove('show');
        }
    }
});

// Closes the pop-up if you click anywhere else on the screen
document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.games-popup-wrapper');
    const popup = document.getElementById("games-floating-popup");
    if (wrapper && !wrapper.contains(e.target) && popup.classList.contains("show")) {
        popup.classList.remove("show");
    }
});

/* =========================================
   FAVORITE GAMES GENERATOR
========================================= */
const favoriteGames = [
    {
        name: "The Witcher 3",
        img: "images/game-list-images/witcher3.png",
        link: "https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/"
    },
    {
        name: "Final Fantasy 7: Rebirth",
        img: "images/game-list-images/ff7rebirth.ico",
        link: "https://store.steampowered.com/app/2909400/FINAL_FANTASY_VII_REBIRTH/"
    },
    {
        name: "Elden Ring",
        img: "images/game-list-images/eldenring.ico",
        link: "https://store.steampowered.com/app/1245620/ELDEN_RING/"
    },
    {
        name: "Dispatch",
        img: "images/game-list-images/dispatch.png",
        link: "https://store.steampowered.com/app/2592160/Dispatch/"
    },
    {
        name: "The Legend of Zelda: Tears of the Kingdom",
        img: "images/game-list-images/loztotk.png",
        link: "https://www.nintendo.com/us/store/products/the-legend-of-zelda-tears-of-the-kingdom-nintendo-switch-2-edition-switch-2/"
    },
    {
        name: "The Legend of Zelda: Breath of the Wild",
        img: "images/game-list-images/lozbotw.png",
        link: "https://www.nintendo.com/us/store/products/the-legend-of-zelda-breath-of-the-wild-switch/"
    },
    {
        name: "Clair Obscur: Expedition 33",
        img: "images/game-list-images/clairobscur-6.png",
        link: "https://store.steampowered.com/app/1903340/Clair_Obscur_Expedition_33/"
    },
    {
        name: "Cyberpunk 2077",
        img: "images/game-list-images/3997-1646274729-1047664581.webp",
        link: "https://store.steampowered.com/app/1091500/Cyberpunk_2077/"
    },
    {
        name: "Borderlands 3",
        img: "images/game-list-images/borderlands3.png",
        link: "https://store.steampowered.com/app/397540/Borderlands_3/"
    },
    {
        name: "Resident Evil 4",
        img: "images/game-list-images/re4.ico",
        link: "https://store.steampowered.com/app/2050650/Resident_Evil_4/"
    },
    {
        name: "The Last of Us™ Part I",
        img: "images/game-list-images/tlou1.ico",
        link: "https://store.steampowered.com/app/1888930/The_Last_of_Us_Part_I/"
    },
    {
        name: "The Last of Us™ Part II",
        img: "images/game-list-images/tlou2.png",
        link: "https://store.steampowered.com/app/2531310/The_Last_of_Us_Part_II_Remastered/"
    },
    {
        name: "Counter Strike 2",
        img: "images/game-list-images/cs2.png",
        link: "https://store.steampowered.com/app/730/CounterStrike_2/"
    },
    {
        name: "Death Stranding",
        img: "images/game-list-images/deathstranding.png",
        link: "https://store.steampowered.com/app/1850570/DEATH_STRANDING_DIRECTORS_CUT/"
    },
    {
        name: "Kingdom Come Deliverance 2",
        img: "images/game-list-images/kc2.ico",
        link: "https://store.steampowered.com/app/1771300/Kingdom_Come_Deliverance_II/"
    },
    {
        name: "Life is Strange",
        img: "images/game-list-images/lis.png",
        link: "https://store.steampowered.com/app/1265920/Life_is_Strange_Remastered/"
    },
    {
        name: "God of War Ragnarok",
        img: "images/game-list-images/gowr.png",
        link: "https://store.steampowered.com/app/2322010/God_of_War_Ragnark/"
    },
    {
        name: "Metro Exodus",
        img: "images/game-list-images/metroexodus.ico",
        link: "https://store.steampowered.com/app/412020/Metro_Exodus/"
    },
    {
        name: "Assassin's Creed Odyssey",
        img: "images/game-list-images/acodyssey.ico",
        link: "https://store.steampowered.com/app/812140/Assassins_Creed_Odyssey/"
    },
    {
        name: "Red Dead Redemption 2",
        img: "images/game-list-images/rdr2.png",
        link: "https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/"
    },
    {
        name: "The Elder Scrolls V: Skyrim Special Edition",
        img: "images/game-list-images/skyrim.png",
        link: "https://store.steampowered.com/app/489830/The_Elder_Scrolls_V_Skyrim_Special_Edition/"
    },
    {
        name: "Dying Light: The Beast",
        img: "images/game-list-images/dyinglightthebeast.png",
        link: "https://store.steampowered.com/app/3008130/Dying_Light_The_Beast/"
    },
    {
        name: "Days Gone",
        img: "images/game-list-images/daysgone.ico",
        link: "https://store.steampowered.com/app/1259420/Days_Gone/"
    },
    {
        name: "DARK SOULS™ III",
        img: "images/game-list-images/ds3.png",
        link: "https://store.steampowered.com/app/374320/DARK_SOULS_III/"
    },
    {
        name: "Blasphemous 2",
        img: "images/game-list-images/blasphemous2.ico",
        link: "https://store.steampowered.com/app/2114740/Blasphemous_2/"
    },
    {
        name: "Hades II",
        img: "images/game-list-images/hades2.png",
        link: "https://store.steampowered.com/app/1145350/Hades_II/"
    },
    {
        name: "Atomic Heart",
        img: "images/game-list-images/atomicheart.ico",
        link: "https://store.steampowered.com/app/668580/Atomic_Heart/"
    },
    {
        name: "Baldur's Gate 3",
        img: "images/game-list-images/bg3.png",
        link: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/"
    }
];

function loadFavoriteGames() {
    const container = document.getElementById('games-list-container');
    if (!container) return;
    
    // Clear it first just in case
    container.innerHTML = "";

    // Loop through the array and build the HTML
    favoriteGames.forEach(game => {
        const gameLink = document.createElement('a');
        gameLink.href = game.link;
        gameLink.target = "_blank";
        gameLink.className = "game-item";
        
        gameLink.innerHTML = `
            <img src="${game.img}" alt="${game.name}" class="game-icon">
            <span class="game-name">${game.name}</span>
        `;
        
        container.appendChild(gameLink);
    });
}

// Ensure games load when the site starts
document.addEventListener("DOMContentLoaded", loadFavoriteGames);

// Initial Load
document.addEventListener("DOMContentLoaded", updateDutchWord);