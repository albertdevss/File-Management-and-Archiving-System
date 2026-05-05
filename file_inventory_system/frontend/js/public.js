let isFilterApplied = false;
let currentPreviewData = null;
let activeTab = "pdf";
const ITEMS_PER_PAGE = 13;
let currentPage = 1;

setInterval(() => {
    const clock = document.getElementById("clock");
    if (clock) {
        clock.innerText = new Date().toLocaleString();
    }
}, 1000);

function switchTab(type){

    activeTab = type;

    const tabPDF = document.getElementById("tabPDF");
    const tabJPG = document.getElementById("tabJPG");
    const tabRescue = document.getElementById("tabRescue");

    const inventoryGroup = document.getElementById("inventoryDropdownGroup");

    if(tabPDF) tabPDF.classList.remove("active");
    if(tabJPG) tabJPG.classList.remove("active");
    if(tabRescue) tabRescue.classList.remove("active");

    if(type === "pdf"){
        if(tabPDF) tabPDF.classList.add("active");

        const dayGroup = document.getElementById("dayFilterGroup");
        if(dayGroup) dayGroup.style.display = "none";

        if(inventoryGroup) inventoryGroup.style.display = "none";
    }

    if(type === "jpg"){
        if(tabJPG) tabJPG.classList.add("active");

        const dayGroup = document.getElementById("dayFilterGroup");
        if(dayGroup) dayGroup.style.display = "block";

        if(inventoryGroup) inventoryGroup.style.display = "none";
    }

    if(type === "rescue"){
        if(tabRescue) tabRescue.classList.add("active");

        const dayGroup = document.getElementById("dayFilterGroup");
        if(dayGroup) dayGroup.style.display = "none";

        if(inventoryGroup) inventoryGroup.style.display = "block";
    }

    const station = document.getElementById("filterStation");
    const index = document.getElementById("filterIndex");
    const year = document.getElementById("filterYear");
    const month = document.getElementById("filterMonth");

    if(station) station.value = "";
    if(index) index.value = "";
    if(year) year.value = "";
    if(month) month.value = "";

    const dayInput = document.getElementById("filterDay");
    if(dayInput) dayInput.value = "";

    const results = document.getElementById("resultsArea");
    const empty = document.getElementById("emptyState");

    if(results) results.style.display = "none";
    if(empty) empty.style.display = "block";

    document.querySelectorAll(".file-card").forEach(card => {
        card.style.display = "block";
    });

    const coverageYear = document.getElementById("coverageYear");
    if(coverageYear){
        coverageYear.dispatchEvent(new Event("change"));
    }

    if(typeof updateInventoryCount === "function"){
        updateInventoryCount();
    }
}

function updateInventoryCount(){

const counter = document.getElementById("docCount")

    if(activeTab === "pdf"){
	counter.innerText = counter.dataset.pdf
    }

    if(activeTab === "jpg"){
	counter.innerText = counter.dataset.jpg
    }

    if(activeTab === "rescue"){
	counter.innerText = counter.dataset.rescue
    }
    }

function applyFilter(){

    const isRange = document.getElementById("filterModeSwitch")?.checked;

    const cards = document.querySelectorAll(".file-card");
    let visibleCount = 0;

    // ================= RANGE MODE =================
    if(isRange){

        const from = document.getElementById("filterFrom").value;
        const to = document.getElementById("filterTo").value;

        const rangeStation = document.getElementById("rangeStation").value.toLowerCase().trim();
        const rangeIndex = document.getElementById("rangeIndex").value.trim();

        if(!validateRangeFilters()){
    Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Station Name and Station Index are required.",
        confirmButtonColor: "#1e4fa1"
    });
    return;
}

if(!from || !to){
    Swal.fire({
        icon: "warning",
        title: "Select Date Range",
        text: "Please select BOTH From and To dates.",
        confirmButtonColor: "#1e4fa1"
    });
    return;
}
        // VALIDATE ORDER
        if(from > to){
            Swal.fire({
                icon: "warning",
                title: "Invalid Range",
                text: "From date cannot be greater than To date.",
                confirmButtonColor: "#1e4fa1"
            });
            return;
        }

        cards.forEach(card => {

            let show = true;

            let dateData = card.dataset.date || "";
            let typeData = (card.dataset.type || "").toLowerCase();

            let cardDate = dateData;

            // normalize PDF ? YYYY-MM ? YYYY-MM-01
            if(typeData === "pdf" && dateData.length === 7){
                cardDate = dateData + "-01";
            }

            // DATE FILTER
            if(cardDate < from || cardDate > to){
                show = false;
            }

            // STATION FILTER
            let stationData = (card.dataset.station || "").toLowerCase();
            let indexData = card.dataset.index || "";

            if(rangeStation && !stationData.includes(rangeStation)){
                show = false;
            }

            if(rangeIndex && indexData !== rangeIndex){
                show = false;
            }

            // TAB FILTER
            if(activeTab === "pdf" && typeData !== "pdf") show = false;
            if(activeTab === "jpg" && typeData !== "img") show = false;

            card.style.display = show ? "block" : "none";
            if(show) visibleCount++;

        });

    }

    // ================= NORMAL MODE =================
    else{

        const station = document.getElementById("filterStation").value.toLowerCase().trim();
        const index = document.getElementById("filterIndex").value.trim();
        const month = document.getElementById("filterMonth").value;
        const year = document.getElementById("filterYear").value;
        const dayInput = document.getElementById("filterDay");

        const day = dayInput ? dayInput.value : "";


        if(!validateFilters() || !year || !month){

    Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Station Name, Station Index, Year and Month are required.",
        confirmButtonColor: "#1e4fa1"
    });

    return;
}

        cards.forEach(card => {

            let stationData = (card.dataset.station || "").toLowerCase().trim();
            let indexData = card.dataset.index || "";
            let dateData = card.dataset.date || "";
            let typeData = (card.dataset.type || "").toLowerCase();

            let show = true;

            let parts = dateData ? dateData.split("-") : [];

            let yearData = parts[0] || "";
            let monthData = parts[1] ? parts[1].padStart(2,'0') : "";
            let dayData = parts.length === 3 ? parts[2].padStart(2,'0') : "";

            // FILTERS
            if(station && !stationData.includes(station)) show = false;
            if(index && indexData !== index) show = false;
            if(yearData !== year) show = false;

            // MONTH FILTER
            if(month !== "ALL"){
                if(monthData !== month.padStart(2,'0')) show = false;
            }

            // DAY ONLY FOR IMG
            if(typeData === "img"){
                if(day && dayData !== day.padStart(2,'0')) show = false;
            }

            // TAB FILTER
            if(activeTab === "pdf" && typeData !== "pdf") show = false;
            if(activeTab === "jpg" && typeData !== "img") show = false;

            card.style.display = show ? "block" : "none";
            if(show) visibleCount++;

        });

    }

    // ================= FINAL =================
    isFilterApplied = true;

    document.getElementById("resultsArea").style.display = "block";

    const emptyState = document.getElementById("emptyState");

    if(visibleCount === 0){

        if(emptyState) emptyState.style.display = "block";

        Swal.fire({
            icon: "info",
            title: "No Results Found",
            text: "No records match your selected filter criteria. Please adjust your filters and try again.",
            confirmButtonColor: "#1e4fa1"
        });

    } else {

        if(emptyState) emptyState.style.display = "none";

        // OPTIONAL: subtle success feedback (auto close)
        Swal.fire({
            icon: "success",
            title: "Filter Applied",
            text: `${visibleCount} record(s) found.`,
            timer: 1200,
            showConfirmButton: false
        });

    }

}

function previewFile(card){

    const type = card.dataset.type;
    const url = card.dataset.url;
    const station = card.dataset.station;
    const index = card.dataset.index;
    const date = card.dataset.date;

    const viewer = document.getElementById("modalViewer");
    const footer = document.getElementById("modalFooter");
    const modalEl = document.getElementById("previewModal");
    const printBtn = document.getElementById("printBtn"); 
    const crossCheckBtn = document.getElementById("crossCheckBtn");

	// ================= BUTTON CONTROL =================
if (type === "pdf") {
    if (crossCheckBtn) crossCheckBtn.style.display = "inline-block";
} else {
    if (crossCheckBtn) crossCheckBtn.style.display = "none";
}

    // ================= FORMAT DATE =================
    let displayDate = date;

if(date && date.includes("-")){
    const parts = date.split("-");
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    const monthNames = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    const monthIndex = parseInt(month, 10) - 1;
    const monthName = monthNames[monthIndex] || month;

    // ? IF HAS DAY (IMG)
    if(day){
        displayDate = `${monthName} ${parseInt(day)}, ${year}`;
    }
    // ? NO DAY (PDF)
    else{
        displayDate = `${monthName} ${year}`;
    }
}
    // ================= FOOTER =================
    footer.innerHTML = `
        <strong>Station Index:</strong> ${index} |
        <strong>Station Name:</strong> ${station} |
        <strong>Date:</strong> ${displayDate}
    `;

    // ================= RESET =================
    viewer.innerHTML = "";

    const existingModal = bootstrap.Modal.getInstance(modalEl);
    if(existingModal) existingModal.dispose();

    modalEl.classList.remove("pdf-mode", "img-mode");

    if(type === "pdf"){
        modalEl.classList.add("pdf-mode");
    } else {
        modalEl.classList.add("img-mode");
    }

    const modal = new bootstrap.Modal(modalEl);

    // ================= PRINT BUTTON (HEADER) =================
    if(printBtn){
        printBtn.onclick = function(){
            printFile(url, type);
        };
    }
if(crossCheckBtn){
    crossCheckBtn.onclick = function(){

        // Pass data via URL (query params)
        const params = new URLSearchParams({
            type: type,
            url: url,
            station: station,
            index: index,
            date: date
        });

        // Open new tab
        window.open(`/cross-check/?${params.toString()}`, "_blank");
    };
}

    modalEl.addEventListener("shown.bs.modal", function () {

        const viewer = document.getElementById("modalViewer");

        // ================= PDF =================
        if(type === "pdf"){

            viewer.innerHTML = `<canvas id="pdfCanvas"></canvas>`;

            const canvas = document.getElementById("pdfCanvas");
            const ctx = canvas.getContext("2d");

            pdfjsLib.getDocument(url).promise.then(pdf => {
                pdf.getPage(1).then(page => {

                    const containerWidth = viewer.clientWidth;

                    const viewport = page.getViewport({ scale: 1 });

                    const scale = containerWidth / viewport.width;

                    const scaledViewport = page.getViewport({ scale });

                    canvas.width = scaledViewport.width;
                    canvas.height = scaledViewport.height;

                    canvas.style.display = "block";
                    canvas.style.margin = "0 auto";

                    page.render({
                        canvasContext: ctx,
                        viewport: scaledViewport
                    });
                });
            });
        }

        // ================= IMAGE (ZOOM + PAN) =================
        else if(type === "img"){

            viewer.innerHTML = `
                <div id="imgZoomContainer" style="
                    width:100%;
                    height:100%;
                    overflow:auto;
                    position:relative;
                    cursor: grab;
                ">
                    <img id="zoomImage" src="${url}" style="
                        display:block;
                        transform-origin: top left;
                        user-select: none;
                        pointer-events: none;
                    ">
                </div>
            `;

            const container = document.getElementById("imgZoomContainer");
            const img = document.getElementById("zoomImage");

            let scale = 1;

            // ================= ZOOM =================
            container.addEventListener("wheel", function(e){
                e.preventDefault();

                const rect = img.getBoundingClientRect();

                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;

                const prevScale = scale;

                if(e.deltaY < 0){
                    scale += 0.15;
                } else {
                    scale -= 0.15;
                    scale = Math.max(scale, 1);
                }

                scale = Math.min(scale, 5);

                const dx = offsetX / prevScale;
                const dy = offsetY / prevScale;

                img.style.transform = `scale(${scale})`;

                container.scrollLeft += dx * (scale - prevScale);
                container.scrollTop += dy * (scale - prevScale);

            }, { passive: false });

            // ================= PAN =================
            let isDragging = false;
            let startX, startY, scrollLeft, scrollTop;

            container.addEventListener("mousedown", (e) => {
                isDragging = true;
                container.style.cursor = "grabbing";

                startX = e.pageX - container.offsetLeft;
                startY = e.pageY - container.offsetTop;

                scrollLeft = container.scrollLeft;
                scrollTop = container.scrollTop;
            });

            container.addEventListener("mouseleave", () => {
                isDragging = false;
                container.style.cursor = "grab";
            });

            container.addEventListener("mouseup", () => {
                isDragging = false;
                container.style.cursor = "grab";
            });

            container.addEventListener("mousemove", (e) => {
                if(!isDragging) return;

                e.preventDefault();

                const x = e.pageX - container.offsetLeft;
                const y = e.pageY - container.offsetTop;

                const walkX = (x - startX);
                const walkY = (y - startY);

                container.scrollLeft = scrollLeft - walkX;
                container.scrollTop = scrollTop - walkY;
            });

        }

    }, { once: true });

    modal.show();
}

// OPEN UPLOAD MODAL
function openUpload(){
    const modal = new bootstrap.Modal(document.getElementById("uploadModal"));
    modal.show();
}


// STATION MAP
const stationMap = {
"98132":"Itbayat",
"98133":"Calayan",
"98134":"Basco",
"98222":"Sinait",
"98223":"Laoag",
"98232":"Aparri",
"98233":"Tuguegarao",
"98324":"Iba",
"98325":"Dagupan",
"98327":"Clark",
"98328":"Baguio Synop",
"98329":"Munoz",
"98332":"San Ildefonso",
"98334":"Baler",
"98336":"Casiguran",
"98422":"Abucay",
"98425":"Port Area",
"98426":"Subic",
"98427":"Tayabas",
"98428":"Sangley Pt",
"98429":"NAIA",
"98430":"Science Garden",
"98431":"Calapan",
"98432":"Ambulong",
"98433":"Tanay",
"98434":"Infanta",
"98435":"Alabat",
"98437":"Mulanay",
"98440":"Daet",
"98444":"Legazpi",
"98446":"Virac Synop",
"98447":"Virac Radar",
"98526":"Coron",
"98531":"San Jose",
"98536":"Romblon",
"98538":"Roxas",
"98543":"Masbate",
"98545":"Juban",
"98546":"Catarman",
"98548":"Catbalogan",
"98550":"Tacloban",
"98553":"Borongan",
"98558":"Guiuan",
"98602":"Pagasa Island",
"98618":"Puerto Princesa",
"98630":"Cuyo",
"98637":"Iloilo Radar",
"98642":"Dumaguete",
"98643":"Siquijor",
"98644":"Panglao (Dauis)",
"98646":"Mactan",
"98648":"Maasin",
"98653":"Surigao",
"98741":"Dipolog",
"98746":"Cotabato",
"98747":"Molugan",
"98748":"Laguindingan",
"98751":"Malaybalay",
"98752":"Butuan",
"98753":"Davao",
"98755":"Hinatuan",
"98836":"Zamboanga",
"98851":"General Santos"
};


// FILE INPUT PARSER
const fileInput = document.getElementById('fileInput');
const filePreviewTable = document.getElementById('filePreviewTableBody');
const fileDataInput = document.getElementById('fileData');
const fileTypeInput = document.getElementById('fileType');

if(fileInput){

fileInput.addEventListener('change', function(){

    const files = Array.from(this.files);
    filePreviewTable.innerHTML = '';

    // ? EMPTY STATE
    if(files.length === 0){
        filePreviewTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-4"></i><br>
                    No files selected
                </td>
            </tr>
        `;
        return;
    }

    const fileData = [];

    files.forEach(file => {

        let fileNameOnly = file.name.split('.')[0];
        const extension = file.name.split('.').pop().toUpperCase();

        // Remove "(1 of 2)" "(3 of 15)"
        fileNameOnly = fileNameOnly.replace(/\s*\(\d+\s*of\s*\d+\)$/i, '');

        let stationIndex = "";
        let stationName = "";
        let dateStr = "";

        // PDF: 08403-202512.pdf
        if(extension === "PDF"){

            const match = fileNameOnly.match(/^(\d+)-(\d{4})(\d{2})$/);

            if(match){
                stationIndex = match[1];

                const year = match[2];
                const month = match[3];

                stationName = stationMap[stationIndex] || "Unknown Station";
                dateStr = `${year}-${month}`;
            }
        }

        // IMAGE: 98752-20251101.jpg
        if(["JPG","JPEG","PNG"].includes(extension)){

            const match = fileNameOnly.match(/^(\d+)-(\d{4})(\d{2})(\d{2})$/);

            if(match){
                stationIndex = match[1];

                const year = match[2];
                const month = match[3];
                const day = match[4];

                stationName = stationMap[stationIndex] || "Unknown Station";
                dateStr = `${year}-${month}-${day}`;
            }
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${file.name}</td>
            <td>${stationIndex}</td>
            <td>${stationName}</td>
            <td>${dateStr}</td>
            <td>${extension}</td>
        `;

        filePreviewTable.appendChild(row);

        fileData.push({
            file_name: file.name,
            station_name: stationName,
            station_index: stationIndex,
            date: dateStr,
            file_type: extension
        });

    });

    fileDataInput.value = JSON.stringify(fileData);
    fileTypeInput.value = activeTab;

});

}

function resetFilter(){

// Clear inputs
document.getElementById("filterStation").value = ""
document.getElementById("filterIndex").value = ""
document.getElementById("filterMonth").value = ""
document.getElementById("filterYear").value = ""

// Hide results again
document.getElementById("resultsArea").style.display = "none"

// Show empty state
document.getElementById("emptyState").style.display = "block"

// Show all cards again
const cards = document.querySelectorAll(".file-card")

cards.forEach(card => {
card.style.display = "block"
})

}


function updateCoverage(){

    const stations = document.querySelectorAll(".station-item");
    const empty = document.getElementById("coverageEmpty");
    const selectedYear = document.getElementById("coverageYear")?.value;

    let visible = 0;

    stations.forEach(st => {

        const pdfCount = parseInt(st.dataset.pdf || 0);
        const rainCount = parseInt(st.dataset.rain || 0);
        const value = st.querySelector(".coverage-value");

        let yearData = {};

try {
    let raw = st.dataset.yearData || "{}";

    // ?? FIX: convert escaped quotes to real quotes
    raw = raw.replace(/\\u0022/g, '"');

    yearData = JSON.parse(raw);

} catch(e){
    console.error("Bad JSON FIXED:", st.dataset.yearData);
}
        let show = false; // ? CONTROL FLAG

        // ===== ALL YEARS =====
        if(!selectedYear){

            if(activeTab === "pdf" && pdfCount > 0){
                value.innerText = `${pdfCount}`;
                show = true;
            }

            if(activeTab === "jpg" && rainCount > 0){
                value.innerText = `${rainCount}`;
                show = true;
            }
        }

        // ===== SPECIFIC YEAR =====
        else{

            const data = yearData[selectedYear];

            if(data){

                if(activeTab === "pdf" && data.pdf > 0){
                    value.innerText = `${data.pdf} / 12`;
                    show = true;
                }

                if(activeTab === "jpg" && data.rain > 0){
                    value.innerText = `${data.rain} / 365`;
                    show = true;
                }

            }
        }

        // ? ALWAYS SET (NO SKIP)
        st.dataset.visible = show ? "true" : "false";

        if(show) visible++;

    });

    empty.style.display = visible === 0 ? "block" : "none";

    currentPage = 1;
    paginateCoverage();
}

// ================= PAGINATION =================

function paginateCoverage(){

    const list = document.getElementById("coverageList");
    const allItems = Array.from(document.querySelectorAll(".station-item"));

    // hide all first
    allItems.forEach(item => item.style.display = "none");

    const items = allItems
        .filter(el => el.dataset.visible === "true")
        .sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

    if(currentPage > totalPages){
        currentPage = totalPages || 1;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    // REORDER WITHOUT DESTROYING DOM
    items.slice(start, end).forEach(item => {
        item.style.display = "block";
        list.appendChild(item);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages){

    const container = document.getElementById("coveragePagination");
    if(!container) return;

    container.innerHTML = "";

    if(totalPages <= 1) return;

    const prev = document.createElement("button");
    prev.innerHTML = "&laquo;";
    prev.className = "btn btn-sm btn-outline-primary";
    prev.disabled = currentPage === 1;
    prev.onclick = () => {
        currentPage--;
        paginateCoverage();
    };

    const info = document.createElement("span");
    info.innerText = ` Page ${currentPage} of ${totalPages} `;
    info.style.margin = "0 8px";

    const next = document.createElement("button");
    next.innerHTML = "&raquo;";
    next.className = "btn btn-sm btn-outline-primary";
    next.disabled = currentPage === totalPages;
    next.onclick = () => {
        currentPage++;
        paginateCoverage();
    };

    container.append(prev, info, next);
}

document.addEventListener("DOMContentLoaded", function () {

    updateInventoryCount();
    updateCoverage();

    const yearSelect = document.getElementById("coverageYear");

    if (yearSelect) {
        yearSelect.addEventListener("change", function () {
            currentPage = 1;
            updateCoverage();
        });
    }

    // ================= STATION DATA =================
    const stationEntries = Object.entries(stationMap);

    // ================= REUSABLE AUTOCOMPLETE =================
    function initAutocomplete(inputId, indexId, dropdownId) {

        const input = document.getElementById(inputId);
        const indexInput = document.getElementById(indexId);
        const dropdown = document.getElementById(dropdownId);

        if (!input || !dropdown || !indexInput) return;

        input.addEventListener("input", function () {

            const query = this.value.toLowerCase().trim();
            dropdown.innerHTML = "";

            if (!query) {
                dropdown.style.display = "none";
                indexInput.value = "";
                return;
            }

            let matches = stationEntries.filter(([idx, name]) =>
                name.toLowerCase().includes(query)
            );

            if (matches.length === 0) {
                dropdown.style.display = "none";
                return;
            }

            matches.slice(0, 10).forEach(([idx, name]) => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.innerHTML = `<strong>${name}</strong> <span style="color:#6b7280;">(${idx})</span>`;

                item.addEventListener("click", function () {
                    input.value = name;
                    indexInput.value = idx;
                    dropdown.style.display = "none";
                });

                dropdown.appendChild(item);
            });

            dropdown.style.display = "block";
        });

        indexInput.addEventListener("input", function () {
            const inputIndex = this.value.trim();

            let found = stationEntries.find(([idx]) => idx === inputIndex);

            if (found) {
                input.value = found[1];
            } else if (inputIndex.length >= 5) {
                input.value = "";
            }
        });

        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });
    }

    // ================= APPLY AUTOCOMPLETE =================
    initAutocomplete("filterStation", "filterIndex", "stationDropdown");
    initAutocomplete("rangeStation", "rangeIndex", "rangeStationDropdown");

    // ================= DATE DROPDOWNS =================

    const filterYear = document.getElementById("filterYear");
    const monthSelect = document.getElementById("filterMonth");
    const daySelect = document.getElementById("filterDay");

    if (filterYear) {
        for (let y = 2000; y <= 2050; y++) {
            const option = document.createElement("option");
            option.value = y;
            option.textContent = y;
            filterYear.appendChild(option);
        }
    }

    if (monthSelect) {
        const months = [
            "01 - January", "02 - February", "03 - March", "04 - April",
            "05 - May", "06 - June", "07 - July", "08 - August",
            "09 - September", "10 - October", "11 - November", "12 - December"
        ];

        months.forEach(m => {
            const [num, name] = m.split(" - ");
            const option = document.createElement("option");
            option.value = num;
            option.textContent = name;
            monthSelect.appendChild(option);
        });
    }

    if (daySelect) {
        for (let d = 1; d <= 31; d++) {
            const option = document.createElement("option");
            option.value = String(d).padStart(2, '0');
            option.textContent = d;
            daySelect.appendChild(option);
        }
    }

});

function toggleMenu(e, el){
    e.stopPropagation();

    const dropdown = el.nextElementSibling;

    document.querySelectorAll(".card-dropdown").forEach(d => {
        if(d !== dropdown) d.style.display = "none";
    });

    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function(e){

    // if click is NOT inside a card-menu or dropdown
    if(!e.target.closest(".card-menu") && !e.target.closest(".card-dropdown")){
        
        document.querySelectorAll(".card-dropdown").forEach(drop => {
            drop.style.display = "none";
        });

    }

});



function getCSRFToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

async function exportData() {

    // PREVENT EXPORT IF NO FILTER APPLIED
    if (!isFilterApplied) {
        Swal.fire({
            icon: "warning",
            title: "No Filter Applied",
            text: "Please apply a filter before exporting data.",
            confirmButtonColor: "#1e4fa1"
        });
        return;
    }

    const cards = document.querySelectorAll(".file-card");

    let files = [];

    cards.forEach(card => {

        const isVisible = window.getComputedStyle(card).display !== "none";

        if (isVisible) {
            files.push({
                url: card.dataset.url,
                station: card.dataset.station,
                date: card.dataset.date,
                type: card.dataset.type
            });
        }

    });

    // NO FILTERED RESULTS
    if (files.length === 0) {
        Swal.fire({
            icon: "info",
            title: "No Data Found",
            text: "There are no results to export based on your current filter.",
            confirmButtonColor: "#1e4fa1"
        });
        return;
    }

    // ================= CONFIRMATION =================
    const confirm = await Swal.fire({
        icon: "question",
        title: "Export Data?",
        html: `You are about to export <b>${files.length}</b> file(s).`,
        showCancelButton: true,
        confirmButtonText: "Yes, Export",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#1e4fa1"
    });

    if (!confirm.isConfirmed) return;

    // ================= LOADING =================
    Swal.fire({
        title: "Preparing download...",
        text: "Please wait while we generate your file.",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // ================= GET STATION =================
    const station = files[0].station.replace(/\s+/g, "_").toUpperCase();

    // ================= SORT DATES =================
    const sortedDates = files.map(f => f.date).sort();

    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];

    // ================= FORMAT NAME =================
    let folderName = "";

    if (files[0].type === "pdf") {
        const start = firstDate.replace("-", "");
        const end = lastDate.replace("-", "");
        folderName = `${station}_${start}_TO_${end}`;
    } else {
        const start = firstDate.replace(/-/g, "");
        const end = lastDate.replace(/-/g, "");
        folderName = `${station}_${start}_TO_${end}`;
    }

    // ================= ZIP =================
    const zip = new JSZip();
    const folder = zip.folder(folderName);

    for (let file of files) {
        const response = await fetch(file.url);
        const blob = await response.blob();

        let filename = file.url.split("/").pop();
        folder.file(filename, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });

    // ================= DOWNLOAD =================
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = folderName + ".zip";
    link.click();

    // ================= SUCCESS =================
    Swal.fire({
        icon: "success",
        title: "Export Complete",
        text: `${files.length} file(s) downloaded successfully.`,
        confirmButtonColor: "#1e4fa1"
    });

}

function printFile(url, type){

    if(type === "pdf"){
        const win = window.open(url, "_blank");
        win.onload = function(){
            win.focus();
            win.print();
        };
    }

    else if(type === "img"){
        const win = window.open("", "_blank");

        win.document.write(`
            <html>
                <head><title>Print</title></head>
                <body style="margin:0;text-align:center;">
                    <img src="${url}" style="max-width:100%;">
                </body>
            </html>
        `);

        win.document.close();

        win.onload = function(){
            win.focus();
            win.print();
        };
    }
}



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

    toggleBtn.innerHTML = isDark
        ? '<i class="bi bi-sun-fill"></i>'
        : '<i class="bi bi-moon-fill"></i>';
});

function validateFilters(){

    const station = document.getElementById("filterStation");
    const index = document.getElementById("filterIndex");

    let isValid = true;

    // reset styles
    station.classList.remove("is-invalid");
    index.classList.remove("is-invalid");

    if(!station.value.trim()){
        station.classList.add("is-invalid");
        isValid = false;
    }

    if(!index.value.trim()){
        index.classList.add("is-invalid");
        isValid = false;
    }

    return isValid;
}

const input = document.getElementById("yourInputId");
if(input){
    input.addEventListener("input", () => {
        input.value = input.value.replace(/[^0-9]/g, '').slice(0,4);
    });
}

function toggleFilterMode(){ 
    const isRange = document.getElementById("filterModeSwitch").checked; 

    const normal = document.getElementById("normalFilterGroup");
    const range = document.getElementById("rangeFilterGroup");

    const labelNormal = document.getElementById("labelNormal");
    const labelRange = document.getElementById("labelRange");

    if(isRange){
        normal.style.display = "none";
        range.style.display = "flex";

        labelNormal.classList.remove("active");
        labelRange.classList.add("active");

    } else {
        normal.style.display = "flex";
        range.style.display = "none";

        labelNormal.classList.add("active");
        labelRange.classList.remove("active");
    }
}


document.addEventListener("click", function (e) {

    const btn = e.target.closest("#crossCheckBtn");

    if (!btn) return;



    if (!currentPreviewData) {
        console.log("No preview data");
        return;
    }

    const params = new URLSearchParams(currentPreviewData);

    window.open(`/cross-check/?${params.toString()}`, "_blank");
});



window.validateRangeFilters = function () {
    const stationEl = document.getElementById("rangeStation");
    const indexEl = document.getElementById("rangeIndex");

    const station = stationEl?.value.trim() || "";
    const index = indexEl?.value.trim() || "";

    // reset validation UI
    stationEl?.classList.remove("is-invalid");
    indexEl?.classList.remove("is-invalid");

    let isValid = true;

    if (!station) {
        stationEl?.classList.add("is-invalid");
        isValid = false;
    }

    if (!index) {
        indexEl?.classList.add("is-invalid");
        isValid = false;
    }

    return isValid;
};