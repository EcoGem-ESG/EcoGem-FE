document.addEventListener("DOMContentLoaded", function() {

    const generateReportBtn = document.getElementById("generate-report");
    const reportStatusBox = document.getElementById("report-status");
    const statusMessage = document.getElementById("status-message");
    const downloadBtn = document.getElementById("download-report");

    // 'ESG 보고서 AI 자동 생성하기' 버튼 클릭 시
    generateReportBtn.addEventListener("click", function() {
        // 상태를 'PENDING'으로 설정
        updateStatus("PENDING");
        
        // 예시로 3초 뒤에 상태를 'COMPLETED'로 변경
        setTimeout(() => {
            // 상태를 'COMPLETED'로 설정
            updateStatus("COMPLETED", "/path/to/report.docx");
        }, 3000);

        // 예시로 'FAILED' 상태를 설정 (주석 처리된 부분은 필요 시 사용)
        // setTimeout(() => {
        //     updateStatus("FAILED");
        // }, 3000);
    });

    // 상태에 따른 메시지 업데이트
    function updateStatus(status, filePath = "") {
        if (status === "PENDING") {
            statusMessage.textContent = "보고서 생성 중입니다...";
            downloadBtn.style.display = "none";
        } else if (status === "COMPLETED") {
            statusMessage.textContent = "보고서 생성 완료! 다운로드 준비 중...";
            downloadBtn.style.display = "block";
            downloadBtn.setAttribute("href", filePath);
        } else if (status === "FAILED") {
            statusMessage.textContent = "보고서 생성에 실패했습니다.";
            downloadBtn.style.display = "none";
        }
    }
});
