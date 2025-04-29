document.addEventListener("DOMContentLoaded", function() {
   
    // 모든 메뉴 버튼을 선택
    const menuButtons = document.querySelectorAll(".menu-btn");

    // 각 메뉴 버튼에 대해 클릭 이벤트 추가
    menuButtons.forEach(button => {
        button.addEventListener("click", function() {
            // 클릭된 메뉴 버튼의 부모 요소인 record-item을 찾기
            const recordItem = this.closest(".record-item");
            
            // 해당 record-item 안에 있는 메뉴 옵션(toggle)
            const menuOptions = recordItem.querySelector(".menu-options");
            
            // 메뉴 옵션이 보이면 숨기고, 숨겨져 있으면 보이도록 설정
            if (menuOptions.style.display === "block") {
                menuOptions.style.display = "none";
            } else {
                menuOptions.style.display = "block";
            }

            
            // 클릭된 메뉴 버튼의 이벤트가 다른 곳으로 전달되지 않도록 막기
            event.stopPropagation();
        });
    });
    
    // 화면의 다른 부분을 클릭했을 때 메뉴 옵션을 숨김
    document.addEventListener("click", function(event) {
        // 클릭한 요소가 메뉴 버튼이 아니고, 메뉴 옵션도 아니면
        if (!event.target.closest(".menu-btn") && !event.target.closest(".menu-options")) {
            // 모든 메뉴 옵션 숨기기
            const allMenuOptions = document.querySelectorAll(".menu-options");
            allMenuOptions.forEach(menuOption => {
                menuOption.style.display = "none";
            });
        }
    });


    // 메뉴 옵션(수정, 삭제) 버튼 클릭 시 동작 (수정, 삭제 기능은 임의로 추가할 수 있음)
    const editButtons = document.querySelectorAll(".edit-btn");
    const deleteButtons = document.querySelectorAll(".delete-btn");

    editButtons.forEach(button => {
        button.addEventListener("click", function() {
            alert("수정 버튼 클릭됨"); // 실제 수정 로직을 여기에 추가할 수 있습니다.

            event.stopPropagation();  // 메뉴 옵션을 숨기지 않도록 이벤트 전달 방지
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener("click", function() {
            alert("삭제 버튼 클릭됨"); // 실제 삭제 로직을 여기에 추가할 수 있습니다.

            event.stopPropagation();  // 메뉴 옵션을 숨기지 않도록 이벤트 전달 방지
        });
    });

    // 기록하기 버튼 클릭 시 기록 작성 화면으로 이동
    const addRecordBtn = document.querySelector(".add-record-btn");
    addRecordBtn.addEventListener("click", function() {
        window.location.href = "collection-record-create.html"; // 기록 작성 화면으로 이동
    });


});
