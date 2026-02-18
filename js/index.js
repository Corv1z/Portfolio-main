var icon = document.getElementById("icon");
var body = document.body;
var headerImage = document.querySelector(".header-image");

if (localStorage.getItem("darkMode") === "true") {
    body.classList.add("dark-theme");
    icon.checked = true;
}

icon.onclick = function() {
    body.classList.toggle("dark-theme");
    localStorage.setItem("darkMode", body.classList.contains("dark-theme"));
};  

function playSound() {
    var audio = document.getElementById('loudChicken'); 
    var newAudio = audio.cloneNode(true);
    newAudio.volume = 1.0;
    newAudio.play();
}

function checkMobileAnimation() {
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

checkMobileAnimation();
window.addEventListener('resize', checkMobileAnimation);