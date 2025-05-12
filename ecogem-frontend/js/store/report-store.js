document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate-report");
  const statusMessage = document.getElementById("status-message");
  const downloadBtn = document.getElementById("download-report");

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  if (!token || !userId || !role) {
    alert("로그인이 필요합니다.");
    location.href = "../../index.html";
    return;
  }

  generateBtn.addEventListener("click", async () => {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    if (!startDate || !endDate) {
      alert("시작일과 종료일을 모두 선택해주세요.");
      return;
    }

    updateStatus("PENDING");

    try {
      const res = await fetch("http://localhost:8080/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          role,
          startDate,
          endDate
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const fullPath = result.reportFilePath;
        const filename = fullPath.split("/").pop(); // 경로에서 파일명 추출
        updateStatus("COMPLETED", filename);
      } else {
        updateStatus("FAILED");
      }
    } catch (err) {
      console.error("보고서 생성 실패:", err);
      updateStatus("FAILED");
    }
  });

  function updateStatus(status, filename = "") {
    if (status === "PENDING") {
      statusMessage.textContent = "보고서를 생성 중입니다...";
      downloadBtn.style.display = "none";
    } else if (status === "COMPLETED") {
      statusMessage.textContent = "보고서 생성 완료!";
      downloadBtn.style.display = "block";
      downloadBtn.onclick = () => downloadReport(filename);
    } else if (status === "FAILED") {
      statusMessage.textContent = "보고서 생성에 실패했습니다.";
      downloadBtn.style.display = "none";
    }
  }

  async function downloadReport(filename) {
    try {
      const res = await fetch(`http://localhost:8080/api/reports/download?filename=${filename}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("다운로드 실패");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("다운로드 오류:", err);
      alert("다운로드 중 오류 발생");
    }
  }
});
