const params = new URLSearchParams(window.location.search);

const rawUrl = params.get("url") || "";
const pdfUrl = window.location.origin + decodeURIComponent(rawUrl);

const station = params.get("station");
const index = params.get("index");
const date = params.get("date");

document.getElementById("meta").innerHTML = `
    <div class="meta-item">
        <span class="meta-label">Station</span>
        <span class="meta-value">${station}</span>
    </div>

    <div class="meta-item">
        <span class="meta-label">Index</span>
        <span class="meta-value">${index}</span>
    </div>

    <div class="meta-item">
        <span class="meta-label">Date</span>
        <span class="meta-value">${date}</span>
    </div>
`;

// ?? PDF PREVIEW MAIN
if(rawUrl){
    const preview = document.getElementById("preview");
    preview.innerHTML = `<div id="pdfContainer"></div>`;

    const container = document.getElementById("pdfContainer");

    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
        pdf.getPage(1).then(page => {

            const viewport = page.getViewport({ scale: 1 });
            const scale = container.clientWidth / viewport.width;
            const vp = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = vp.width;
            canvas.height = vp.height;

            container.appendChild(canvas);

            page.render({
                canvasContext: ctx,
                viewport: vp
            });
        });
    });
}	

function openCompare(imgUrl){

    const img = document.getElementById("imgPreview");
    img.src = imgUrl;

}


let scale = 1;
let baseScale = 1;

let isDragging = false;
let startX = 0;
let startY = 0;
let scrollLeft = 0;
let scrollTop = 0;

function showPreview(url, fileDate){

    const img = document.getElementById("zoomImage");
    const meta = document.getElementById("imageMeta");
    const container = document.getElementById("zoomContainer");

    document.getElementById("imageGridView").style.display = "none";
    document.getElementById("imagePreviewView").style.display = "flex";

    // ?? reset scroll
    container.scrollTop = 0;
    container.scrollLeft = 0;

    // reset zoom
    scale = 1;
    baseScale = 1;

    img.src = url;
    meta.innerHTML = "Loading...";

    // =========================
    // ??? IMAGE LOAD
    // =========================
    img.onload = function(){

        const containerWidth = container.clientWidth - 20;
        const containerHeight = container.clientHeight - 20;

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;

        // ? base fit
        baseScale = Math.min(scaleX, scaleY);
        scale = baseScale;

        applyZoom();

        // ===== DATE FORMAT =====
        let formattedDate = fileDate;

        if(fileDate){
            if(/^\d{4}-\d{2}$/.test(fileDate)){
                const [y, m] = fileDate.split("-");
                const d = new Date(y, m - 1);
                formattedDate = d.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long"
                });
            } else {
                const d = new Date(fileDate);
                if(!isNaN(d)){
                    formattedDate = d.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    });
                }
            }
        }

        meta.innerHTML = `
            <div><strong>Station Name:</strong> ${station}</div>
            <div><strong>Date:</strong> ${formattedDate}</div>
        `;
    };

    img.onerror = function(){
        meta.innerHTML = `<div style="color:red;">Failed to load image</div>`;
    };

    // =========================
    // ?? SCROLL ZOOM (STABLE)
    // =========================
    container.onwheel = function(e){
        e.preventDefault();

        const rect = container.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const prevScale = scale;

        const zoomIntensity = 0.1;

        if(e.deltaY < 0){
            scale += zoomIntensity;
        } else {
            scale -= zoomIntensity;
        }

        // ? LIMIT: cannot zoom smaller than base
        scale = Math.max(baseScale, Math.min(scale, 5));

        applyZoom();

        const scaleRatio = scale / prevScale;

        container.scrollLeft = (container.scrollLeft + offsetX) * scaleRatio - offsetX;
        container.scrollTop  = (container.scrollTop + offsetY) * scaleRatio - offsetY;
    };

    // =========================
    // ?? DRAG PAN (GLOBAL FIX)
    // =========================
    container.onmousedown = function(e){
        isDragging = true;

        startX = e.clientX;
        startY = e.clientY;

        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;

        container.style.cursor = "grabbing";
    };

    // ?? MOVE OUTSIDE CONTAINER
    document.onmousemove = function(e){
        if(!isDragging) return;

        e.preventDefault();

        const walkX = e.clientX - startX;
        const walkY = e.clientY - startY;

        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    };

    // ?? RELEASE ANYWHERE
    document.onmouseup = function(){
        isDragging = false;
        container.style.cursor = "grab";
    };

    container.style.cursor = "grab";
}


// =========================
// ?? REAL ZOOM (NO TRANSFORM)
// =========================
function applyZoom(){

    const img = document.getElementById("zoomImage");

    img.style.width = (img.naturalWidth * scale) + "px";
    img.style.height = (img.naturalHeight * scale) + "px";
}
function backToGrid(){
    document.getElementById("imageGridView").style.display = "block";
    document.getElementById("imagePreviewView").style.display = "none";
}

function zoomIn(){
    scale += 0.2;
    document.getElementById("zoomImage").style.transform = `scale(${scale})`;
}

function zoomOut(){
    scale = Math.max(0.3, scale - 0.2); // ?? allow zoom out
    document.getElementById("zoomImage").style.transform = `scale(${scale})`;
}

// CLOSE
function closeCompare(){
    document.getElementById("compareModal").style.display = "none";
}

function handleBack(){
    try {
        window.close();
        
        // fallback if not closed
        setTimeout(() => {
            window.location.href = "/";
        }, 300);
        
    } catch (e) {
        window.location.href = "/";
    }
}

function updateClock(){
    const now = new Date();

    const options = {
        timeZone: "Asia/Manila", // ?? FORCE PH TIME
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    };

    const formatted = new Intl.DateTimeFormat("en-PH", options).format(now);

    document.getElementById("clock").textContent = formatted;
}

setInterval(updateClock, 1000);
updateClock();


window.addEventListener("DOMContentLoaded", () => {

    const toggleBtn = document.getElementById("darkToggle");

    if(!toggleBtn) return; // safety (prevents errors)

    // ================= LOAD SAVED MODE =================
    const isDarkSaved = localStorage.getItem("darkMode") === "true";

    if(isDarkSaved){
        document.body.classList.add("dark-mode");
        toggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
        toggleBtn.innerHTML = '<i class="bi bi-moon-fill"></i>';
    }

    // ================= TOGGLE =================
    toggleBtn.addEventListener("click", () => {

        document.body.classList.toggle("dark-mode");

        const isDark = document.body.classList.contains("dark-mode");

        localStorage.setItem("darkMode", isDark);

        toggleBtn.innerHTML = isDark
            ? '<i class="bi bi-sun-fill"></i>'
            : '<i class="bi bi-moon-fill"></i>';
    });

});
