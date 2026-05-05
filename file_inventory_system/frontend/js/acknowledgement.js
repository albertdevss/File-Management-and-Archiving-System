setInterval(() => {
    const clock = document.getElementById("clock");
    if (clock) {
        clock.innerText = new Date().toLocaleString();
    }
}, 1000);

document.getElementById("darkToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});

function goBack() {
    window.close();
    setTimeout(() => {
        alert("You may close this tab manually.");
    }, 300);
}