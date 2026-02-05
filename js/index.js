var icon = document.getElementById("icon");
var body = document.body;

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


