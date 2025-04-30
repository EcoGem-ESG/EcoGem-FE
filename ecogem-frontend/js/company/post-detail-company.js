document.addEventListener('DOMContentLoaded', () => {

    const menuButtons = document.querySelectorAll('.menu-btn');
    const lists = document.querySelectorAll('.menu-list');

    // Helper: 모든 팝업 닫기
    function closeAll() {
        lists.forEach(p => p.style.display = 'none');
    }

    // 메뉴 버튼 클릭 시
    menuButtons.forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();    // 클릭 이벤트 전파 차단
            const list = btn.parentNode.querySelector('.menu-list');
            const isOpen = list.style.display === 'block';
            closeAll(); // 다른 열려있는 팝업 닫기
            list.style.display = isOpen ? 'none' : 'block';
        });
    });

    // 팝업 내부를 클릭해도 닫히지 않도록
    lists.forEach(list => {
        list.addEventListener('click', e => {
            e.stopPropagation();
        });
    });

    // 화면 다른 곳 클릭 시 모두 닫기
    document.addEventListener('click', () => {
        closeAll();
    });
});
