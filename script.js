const fileInput = document.getElementById("fileInput");

const translateBtn = document.getElementById("translateBtn");
const viewBtn = document.getElementById("viewBtn");
const downloadBtn = document.getElementById("downloadBtn");


fileInput.addEventListener("change", () => {

    if(fileInput.files.length > 0){

        translateBtn.classList.add("hidden");

        viewBtn.classList.remove("hidden");
        downloadBtn.classList.remove("hidden");

    }

});