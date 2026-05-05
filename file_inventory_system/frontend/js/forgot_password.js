let mock = {};

function sendCode(){
    let email = document.getElementById("email").value;
    let msg1 = document.getElementById("msg1");

    fetch("/send-reset-code/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data); // ?? DEBUG

        if(data.error){
            msg1.innerHTML = data.error;
        } else {
            msg1.innerHTML = "Code sent!";
            switchStep(1,2);
        }
    })
    .catch(err => {
        console.log("ERROR:", err); // ?? DEBUG
        msg1.innerHTML = "Server error";
    });
}

function verifyCode(){
    let email = document.getElementById("email").value;
    let code = document.getElementById("code").value;
    let msg2 = document.getElementById("msg2");

    fetch("/verify-code/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code })
    })
    .then(async (res) => {

        let data;
        try {
            data = await res.json();
        } catch (e) {
            msg2.innerHTML = "Server error";
            return;
        }

        if (!res.ok) {
            msg2.innerHTML = data.error || "Invalid code";
            return;
        }

        // success
        switchStep(2, 3);

    })
    .catch(() => {
        msg2.innerHTML = "Server error";
    });
}

function resetPassword(){
    let email = document.getElementById("email").value;
    let password = document.getElementById("pass1").value;
    let msg3 = document.getElementById("msg3");

    fetch("/reset-password/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
    })
    .then(data => {
        if(data.error){
            msg3.innerHTML = data.error;
        } else {
            msg3.innerHTML = "Password changed!";
        }
    })
    .catch(() => {
        msg3.innerHTML = "Server error";
    });
}

function switchStep(a,b){
    document.getElementById("step"+a).classList.remove("active");
    document.getElementById("step"+b).classList.add("active");
}

function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleString();
}
setInterval(updateClock,1000);
updateClock();
