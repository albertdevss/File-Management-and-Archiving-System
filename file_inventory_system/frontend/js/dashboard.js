
let currentMode = "yearly";
let currentType = "pdf";
let currentYear;


document.addEventListener("DOMContentLoaded", () => {

    const typeSelector = document.getElementById("dataSelector");
    const yearSelector = document.getElementById("yearSelector");
    const title = document.getElementById("dataTitle");

    const input = document.getElementById("stationName");
    const dropdown = document.getElementById("stationDropdown");

    const form = document.getElementById("reportForm");

    // ================= SAFE INIT =================
    if(yearSelector){
        currentYear = yearSelector.value;
    }

    const yearData = (monthlyData && monthlyData[currentYear]) ? monthlyData[currentYear] : { pdf: [], rain: [] };

    if(typeSelector && title){
        if(yearData.pdf?.some(v => v > 0)){
            currentType = "pdf";
            typeSelector.value = "pdf";
            title.textContent = "6 Hourly Data Count";
        } else {
            currentType = "rain";
            typeSelector.value = "rain";
            title.textContent = "Rainfall Data Count";
        }
    }

    renderBars(currentType);
    updateInsights(currentYear);

    // ================= TYPE SWITCH =================
    if(typeSelector){
        typeSelector.addEventListener("change", function(){

            currentType = this.value;

            if(title){
                title.textContent = this.value === "pdf"
                    ? "6 Hourly Data Count"
                    : "Rainfall Data Count";
            }

            renderBars(currentType);
        });
    }

    // ================= YEAR SWITCH =================
    if(yearSelector){
        yearSelector.addEventListener("change", function(){
            currentYear = this.value;
            renderBars(currentType);
            updateInsights(currentYear);
        });
    }

    // ================= AUTOCOMPLETE =================
    if(input && dropdown){

        input.addEventListener("input", function(){

            const value = this.value.toLowerCase();
            dropdown.innerHTML = "";

            if(!value){
                dropdown.classList.add("hidden");
                return;
            }

            const filtered = stationList.filter(s =>
                s.station_name.toLowerCase().includes(value)
            ).slice(0, 10);

            filtered.forEach(station => {

                const item = document.createElement("div");
                item.className = "px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm";
                item.textContent = `${station.station_name} (${station.station_index})`;

                item.onclick = () => {
                    input.value = station.station_name;

                    const indexField = document.getElementById("stationIndex");
                    if(indexField){
                        indexField.value = station.station_index;
                    }

                    dropdown.classList.add("hidden");
                };

                dropdown.appendChild(item);
            });

            dropdown.classList.remove("hidden");
        });

        document.addEventListener("click", function(e){
            if(!input.contains(e.target) && !dropdown.contains(e.target)){
                dropdown.classList.add("hidden");
            }
        });
    }

    // ================= REPORT SUBMIT =================
    if(form){
        form.addEventListener("submit", function(){

            const modeInput = document.getElementById("formMode");
            const yearInput = document.getElementById("formYear");
            const typeInput = document.getElementById("formType");
            const targetYear = document.getElementById("targetYear");

            if(modeInput) modeInput.value = selectedMode;
            if(yearInput && targetYear) yearInput.value = targetYear.value;
            if(typeInput) typeInput.value = selectedType;

        });
    }

});


// ================= CHART =================
function renderBars(type){

    const container = document.getElementById("barChart");
    if(!container) return;

    const yearData = monthlyData[currentYear];
    if(!yearData) return;

    container.innerHTML = `
        <div class="absolute inset-x-0 top-0 h-px bg-surface-container-low"></div>
        <div class="absolute inset-x-0 top-1/4 h-px bg-surface-container-low"></div>
        <div class="absolute inset-x-0 top-2/4 h-px bg-surface-container-low"></div>
        <div class="absolute inset-x-0 top-3/4 h-px bg-surface-container-low"></div>
    `;

    let labels = [];
    let actual = [];
    let expected = [];

    if(currentMode === "yearly"){

        labels = months;
        actual = yearData[type] || [];

        expected = months.map((_, i)=>
            79 * new Date(currentYear, i+1, 0).getDate()
        );

    } else {

        const m = yearData[type] || [];

        actual = [
            (m[0]||0)+(m[1]||0)+(m[2]||0),
            (m[3]||0)+(m[4]||0)+(m[5]||0),
            (m[6]||0)+(m[7]||0)+(m[8]||0),
            (m[9]||0)+(m[10]||0)+(m[11]||0)
        ];

        labels = ["Quarter 1","Quarter 2","Quarter 3","Quarter 4"];

        expected = [
            sumQuarter(1,2,3),
            sumQuarter(4,5,6),
            sumQuarter(7,8,9),
            sumQuarter(10,11,12)
        ];
    }

    labels.forEach((label, i) => {

    let maxValue = currentMode === "yearly" ? 1100 : 2500;

    const percent = Math.min((actual[i] / maxValue) * 100, 100);

    container.innerHTML += `
    <div class="group flex-1 flex flex-col items-center justify-end h-full"
         onmousemove="showTooltip(event,'${label}',${actual[i]||0})"
         onmouseleave="hideTooltip()">

        <div class="w-full rounded-t-sm"
             style="height:${percent}%;
                    background:${percent>0?'#1A4B9B':'#d1d5db'};
                    opacity:${percent>0?0.9:0.2};">
        </div>

        <span class="mt-2 text-[10px] font-bold uppercase">${label}</span>
    </div>`;
});}


function switchMode(mode){
    currentMode = mode;

    const y = document.getElementById("chartYearly");
    const q = document.getElementById("chartQuarterly");

    if(y) y.classList.toggle("bg-white", mode==="yearly");
    if(q) q.classList.toggle("bg-white", mode==="quarterly");

    renderBars(currentType);
}



function setMode(mode){
    selectedMode = mode;

    const y = document.getElementById("reportYearly");
    const q = document.getElementById("reportQuarterly");

    if(y) y.classList.toggle("bg-white", mode==="yearly");
    if(q) q.classList.toggle("bg-white", mode==="quarterly");
}

// ================= REPORT TYPE =================
function setType(type){
    selectedType = type;

    const pdf = document.getElementById("btnPDF");
    const img = document.getElementById("btnIMG");

    if(pdf) pdf.classList.toggle("bg-white", type==="PDF");
    if(img) img.classList.toggle("bg-white", type==="IMG");
}


// ================= TOOLTIP =================
function showTooltip(e,label,value){
    const t = document.getElementById("barTooltip");
    if(!t) return;

    t.innerHTML = `<b>${label}</b><br>${value}`;
    t.style.left = e.pageX+10+"px";
    t.style.top = e.pageY-30+"px";
    t.style.opacity = 1;
}

function hideTooltip(){
    const t = document.getElementById("barTooltip");
    if(t) t.style.opacity = 0;
}


// ================= INSIGHTS =================
function updateInsights(year){

    const data = stationInsights[year];
    if(!data) return;

    const mostValue = document.getElementById("mostValue");
    const mostStation = document.getElementById("mostStation");
    const leastValue = document.getElementById("leastValue");
    const leastStation = document.getElementById("leastStation");

    if(mostValue) mostValue.textContent = data.most.total.toLocaleString()+" total";
    if(mostStation) mostStation.textContent = data.most.station;
    if(leastValue) leastValue.textContent = data.least.total.toLocaleString()+" total";
    if(leastStation) leastStation.textContent = data.least.station;
}


// ================= HELPERS =================
function sumQuarter(a,b,c){
    return (79*new Date(currentYear,a,0).getDate()) +
           (79*new Date(currentYear,b,0).getDate()) +
           (79*new Date(currentYear,c,0).getDate());
}


// ================= CLOCK =================
setInterval(()=>{
    const clock = document.getElementById("clock");
    if(clock) clock.innerText = new Date().toLocaleString();
},1000);


function openHistory(){
    const modal = new bootstrap.Modal(document.getElementById("historyModal"));
    modal.show();

    fetch("/get-history/")
    .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
    })
    .then(data => {
        const tbody = document.getElementById("historyContent");

        // ? CLEAR TABLE
        tbody.innerHTML = "";

        // ? EMPTY STATE
        if(data.length === 0){
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No history available
                    </td>
                </tr>
            `;
            return;
        }

        let rows = "";

        data.forEach(log => {

            let badge = "secondary";

            if(log.action === "UPLOAD") badge = "success";
            else if(log.action === "DELETE") badge = "danger";
            else if(log.action === "EDIT") badge = "warning";

            // ? shorten filename (optional)
            let fileName = log.index || "";
            let shortName = fileName.length > 25 
                ? fileName.slice(0, 25) + "..." 
                : fileName;

            rows += `
                <tr>
                    <td>
                        <span class="badge bg-${badge} px-3 py-2">
                            ${log.action}
                        </span>
                    </td>

                    <td>${log.station}</td>

                    <!-- ? filename (with tooltip) -->
                    <td title="${fileName}">
                        ${shortName}
                    </td>

                    <td>${log.date}</td>
                    <td>${log.time}</td>
                </tr>
            `;
        });

        tbody.innerHTML = rows;

    })
    .catch(err => {
        console.error("History fetch error:", err);

        document.getElementById("historyContent").innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Failed to load history
                </td>
            </tr>
        `;
    });
}

function getCSRFToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

let selectedFileId = null;

function confirmDelete(e, fileId){
    e.stopPropagation();

    selectedFileId = fileId;

    const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
    modal.show();
}

document.getElementById("confirmDeleteBtn").addEventListener("click", function(){

    if (!selectedFileId) return;

    this.disabled = true;
    this.innerText = "Deleting...";

    fetch(`/delete-file/${selectedFileId}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => res.json())
    .then(data => {

        const modalEl = document.getElementById("deleteModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        this.disabled = false;
        this.innerText = "Delete";

        if (data.status === "moved_to_trash") {

            Swal.fire({
                icon: "success",
                title: "Moved to Trash ",
                text: "You can restore this file within 60 days.",
                confirmButtonColor: "#1e4fa1"
            }).then(() => {
                location.reload();
            });

        } else {

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Something went wrong.",
                confirmButtonColor: "#d33"
            });

        }

        selectedFileId = null;

    })
    .catch(err => {
        console.error(err);

        Swal.fire({
            icon: "error",
            title: "Request Failed",
            text: "Please try again.",
            confirmButtonColor: "#d33"
        });

        selectedFileId = null;
    });

});

const toggleBtn = document.getElementById("darkToggle");

// load saved mode
if(localStorage.getItem("darkMode") === "true"){
    document.body.classList.add("dark-mode");
    toggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
}

toggleBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem("darkMode", isDark);

    // change icon
    toggleBtn.innerHTML = isDark
        ? '<i class="bi bi-sun-fill"></i>'
        : '<i class="bi bi-moon-fill"></i>';
});


function openTrashModal(){
    const modal = new bootstrap.Modal(document.getElementById("trashModal"));
    modal.show();
    loadTrash();
}

function loadTrash(){

    const tbody = document.getElementById("trashList");
    const empty = document.getElementById("trashEmpty");

    tbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

    fetch("/get-trash/")
    .then(res => res.json())
    .then(data => {

        if(data.length === 0){
            tbody.innerHTML = "";
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        let rows = "";

        data.forEach(file => {

            let badge = "warning"; // default TRASH

            if(file.action === "RESTORE") badge = "info";
            if(file.action === "PERMANENT_DELETE") badge = "danger";

            rows += `
                <tr>

                    <td>
                        <span class="badge bg-${badge} px-3 py-2">
                            ${file.action || "TRASH"}
                        </span>
                    </td>

                    <td>${file.station}</td>

                    <td class="text-truncate" style="max-width:200px;" title="${file.file}">
                        ${file.file}
                    </td>

                    <td>${file.date}</td>
                    <td>${file.time}</td>

                    <td class="d-flex justify-content-center gap-2">

                        <button class="btn btn-success btn-sm"
                            onclick="restoreFile(${file.id})">
                            Restore
                        </button>

                    </td>

                </tr>
            `;
        });

        tbody.innerHTML = rows;

    });
}
function restoreFile(id){

    fetch(`/restore-file/${id}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => {
        if(!res.ok) throw new Error();
        return res.json();
    })
    .then(() => {
        Swal.fire({
            icon: "success",
            title: "Restored",
            timer: 1500,
            showConfirmButton: false
        });
        loadTrash();
    })
    .catch(() => {
        Swal.fire("Error", "Restore failed", "error");
    });
}
