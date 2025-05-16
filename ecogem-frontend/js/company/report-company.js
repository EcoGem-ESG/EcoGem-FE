document.addEventListener("DOMContentLoaded", () => {
  const generateBtn   = document.getElementById("generate-report");
  const statusMessage = document.getElementById("status-message");
  const downloadBtn   = document.getElementById("download-report");

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");
  const role   = localStorage.getItem("role");

  if (!token || !userId || !role) {
    alert("Login is required.");
    window.location.href = "../../index.html";
    return;
  }

  generateBtn.addEventListener("click", async () => {
    const startDate = document.getElementById("start-date").value;
    const endDate   = document.getElementById("end-date").value;

    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    updateStatus("PENDING");

    try {
      const res = await fetch("http://localhost:8080/api/reports", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId:   parseInt(userId),
          role,
          startDate,
          endDate
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const fullPath = result.reportFilePath;
        const filename = fullPath.split("/").pop(); // extract filename from path
        updateStatus("COMPLETED", filename);
      } else {
        updateStatus("FAILED");
      }
    } catch (err) {
      console.error("Report generation failed:", err);
      updateStatus("FAILED");
    }
  });

  /**
   * Update the status message and toggle download button
   * @param {string} status - "PENDING", "COMPLETED", or "FAILED"
   * @param {string} [filename]
   */
  function updateStatus(status, filename = "") {
    if (status === "PENDING") {
      statusMessage.textContent = "Generating report...";
      downloadBtn.style.display = "none";
    } else if (status === "COMPLETED") {
      statusMessage.textContent = "Report generation completed!";
      downloadBtn.style.display = "block";
      downloadBtn.onclick = () => downloadReport(filename);
    } else if (status === "FAILED") {
      statusMessage.textContent = "Failed to generate report.";
      downloadBtn.style.display = "none";
    }
  }

  /**
   * Download the generated report file
   * @param {string} filename
   */
  async function downloadReport(filename) {
    try {
      const res = await fetch(
        `http://localhost:8080/api/reports/download?filename=${filename}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("An error occurred during download.");
    }
  }
});
