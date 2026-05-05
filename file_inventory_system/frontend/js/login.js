function togglePassword(){
    const input = document.getElementById("password");
    const icon = document.getElementById("eyeIcon");

    if(input.type === "password"){
        input.type = "text";
        icon.classList.replace("bi-eye","bi-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("bi-eye-slash","bi-eye");
    }
}

function updateClock() {
    const now = new Date();

    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    const formatted = now.toLocaleString('en-US', options);
    document.getElementById("clock").textContent = formatted;
}

setInterval(updateClock, 1000);
updateClock();

function toggleDarkMode(){
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// load saved mode
if(localStorage.getItem("darkMode") === "true"){
    document.body.classList.add("dark-mode");
}


document.getElementById("forgotForm").addEventListener("submit", function(e){
    e.preventDefault();

    const formData = new FormData(this);

    fetch("{% url 'forgot_password' %}", {
        method: "POST",
        body: formData,
        headers: {
            "X-CSRFToken": formData.get("csrfmiddlewaretoken")
        }
    })
    .then(res => res.json())
    .then(data => {
        alert("Reset request sent!");
    })
    .catch(err => console.error(err));
});
