document.addEventListener("DOMContentLoaded", function() {

    const generateReportBtn = document.getElementById("generate-report");
    const reportStatusBox = document.getElementById("report-status");
    const statusMessage = document.getElementById("status-message");
    const downloadBtn = document.getElementById("download-report");

    // When 'Generate ESG Report with AI' button is clicked
    generateReportBtn.addEventListener("click", function() {
        // Set status to 'PENDING'
        updateStatus("PENDING");
        
        // Example: change status to 'COMPLETED' after 3 seconds
        setTimeout(() => {
            // Set status to 'COMPLETED'
            updateStatus("COMPLETED", "/path/to/report.docx");
        }, 3000);

        // Example: set status to 'FAILED' if needed (uncomment to use)
        // setTimeout(() => {
        //     updateStatus("FAILED");
        // }, 3000);
    });

    // Update message based on status
    function updateStatus(status, filePath = "") {
        if (status === "PENDING") {
            statusMessage.textContent = "Report is being generated...";
            downloadBtn.style.display = "none";
        } else if (status === "COMPLETED") {
            statusMessage.textContent = "Report generation completed!";
            downloadBtn.style.display = "block";
            downloadBtn.setAttribute("href", filePath);
        } else if (status === "FAILED") {
            statusMessage.textContent = "Failed to generate report.";
            downloadBtn.style.display = "none";
        }
    }
});
