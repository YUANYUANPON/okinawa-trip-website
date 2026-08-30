// 匯率換算功能
const jpyInput = document.getElementById('jpy-input');
const twdResult = document.getElementById('twd-result');
const rate = 0.21; // 假設匯率 0.21

jpyInput.addEventListener('input', function() {
    const jpy = jpyInput.value;
    const twd = Math.round(jpy * rate); // 四捨五入
    twdResult.textContent = `NT$ ${twd}`;
});

// 如果你想挑戰記帳功能（運用 localStorage）
// localStorage.setItem('totalExpense', 1000); // 存入資料
// let expense = localStorage.getItem('totalExpense'); // 讀取資料
/* --- 前面是你原本寫的匯率換算程式碼 --- */
/* const jpyInput = ... */
/* jpyInput.addEventListener(...) */

/* --- ☟ 請將以下程式碼加在檔案最下方 ☟ --- */

// 取得所有導航按鈕與內容區塊
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

// 替每個按鈕綁定點擊事件
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. 先移除所有按鈕的啟用狀態 (拔掉 active class)
        navBtns.forEach(b => b.classList.remove('active'));
        
        // 2. 隱藏所有內容區塊 (拔掉 active class)
        tabContents.forEach(content => content.classList.remove('active'));

        // 3. 將當前點擊的按鈕設為啟用 (加上 active class)
        btn.classList.add('active');
        
        // 4. 讀取按鈕上的 data-target 值 (例如 'today' 或 'expense')
        const targetId = btn.getAttribute('data-target');
        
        // 5. 找到對應 ID 的區塊，並將其顯示出來 (加上 active class)
        document.getElementById(targetId).classList.add('active');
    });
});
/* ==========================================
   1. 記帳功能邏輯 (Expense Tracker)
   ========================================== */
const EXCHANGE_RATE = 0.201; // 匯率：1 JPY ≈ 0.201 TWD

// 從 localStorage 讀取紀錄，若沒有則為空陣列
let expenses = JSON.parse(localStorage.getItem('okinawa_expenses')) || [];

// DOM 元素選取
const expAmountInput = document.getElementById('exp-amount');
const expCategorySelect = document.getElementById('exp-category');
const expNoteInput = document.getElementById('exp-note');
const addExpBtn = document.getElementById('add-exp-btn');
const expenseList = document.getElementById('expense-list');
const totalJpyEl = document.getElementById('total-jpy');
const totalTwdEl = document.getElementById('total-twd');

// 渲染花費列表與總額
function renderExpenses() {
    expenseList.innerHTML = '';
    let totalJpy = 0;

    expenses.forEach((item, index) => {
        totalJpy += item.amount;
        const twdAmount = Math.round(item.amount * EXCHANGE_RATE);

        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
            <div class="item-info">
                <strong>${item.category}</strong> ${item.note ? '· ' + item.note : ''}
            </div>
            <div class="item-price">
                ¥${item.amount.toLocaleString()} 
                <small style="color: #718096;">(約 NT$${twdAmount})</small>
                <button class="btn-delete" onclick="deleteExpense(${index})">刪除</button>
            </div>
        `;
        expenseList.appendChild(li);
    });

    // 更新總額
    const totalTwd = Math.round(totalJpy * EXCHANGE_RATE);
    totalJpyEl.textContent = `¥${totalJpy.toLocaleString()}`;
    totalTwdEl.textContent = `約 NT$${totalTwd.toLocaleString()}`;

    // 儲存至瀏覽器 localStorage
    localStorage.setItem('okinawa_expenses', JSON.stringify(expenses));
}

// 新增花費事件
if (addExpBtn) {
    addExpBtn.addEventListener('click', () => {
        const amount = parseFloat(expAmountInput.value);
        const category = expCategorySelect.value;
        const note = expNoteInput.value.trim();

        if (isNaN(amount) || amount <= 0) {
            alert('請輸入有效的日幣金額！');
            return;
        }

        // 加入陣列
        expenses.push({ category, note, amount });

        // 清空輸入框
        expAmountInput.value = '';
        expNoteInput.value = '';

        // 重新繪製畫面
        renderExpenses();
    });
}

// 刪除單筆紀錄
function deleteExpense(index) {
    expenses.splice(index, 1);
    renderExpenses();
}

// 頁面載入後先渲染一次歷史紀錄
renderExpenses();


/* ==========================================
   2. 行程每日頁籤切換邏輯 (Day 1~5 Selector)
   ========================================== */
const dayBtns = document.querySelectorAll('.day-btn');
const dayContents = document.querySelectorAll('.day-content');

dayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. 移除所有天數按鈕的 active 狀態
        dayBtns.forEach(b => b.classList.remove('active'));
        // 2. 隱藏所有天的行程內容
        dayContents.forEach(content => content.classList.remove('active'));

        // 3. 啟用點擊的按鈕
        btn.classList.add('active');

        // 4. 顯示對應的行程區塊
        const targetDay = btn.getAttribute('data-day');
        const targetContent = document.getElementById(targetDay);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});