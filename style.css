/* ==========================================
   1. 底部主導航列切換 (今天、行程、花費、筆記)
   ========================================== */
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除所有啟用狀態
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // 啟用點擊的按鈕與對應區塊
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

/* ==========================================
   2. 行程每日頁籤切換邏輯 (Day 1~5)
   ========================================== */
const dayBtns = document.querySelectorAll('.day-btn');
const dayContents = document.querySelectorAll('.day-content');

dayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        dayBtns.forEach(b => b.classList.remove('active'));
        dayContents.forEach(content => content.classList.remove('active'));
        
        btn.classList.add('active');
        const targetDay = btn.getAttribute('data-day');
        const targetContent = document.getElementById(targetDay);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});

/* ==========================================
   3. 記帳功能邏輯 (Expense Tracker)
   ========================================== */
const EXCHANGE_RATE = 0.201; 
let expenses = JSON.parse(localStorage.getItem('okinawa_expenses')) || [];

const expAmountInput = document.getElementById('exp-amount');
const expCategorySelect = document.getElementById('exp-category');
const expNoteInput = document.getElementById('exp-note');
const addExpBtn = document.getElementById('add-exp-btn');
const expenseList = document.getElementById('expense-list');
const totalJpyEl = document.getElementById('total-jpy');
const totalTwdEl = document.getElementById('total-twd');

function renderExpenses() {
    if(!expenseList) return; // 確保元素存在
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

    const totalTwd = Math.round(totalJpy * EXCHANGE_RATE);
    totalJpyEl.textContent = `¥${totalJpy.toLocaleString()}`;
    totalTwdEl.textContent = `約 NT$${totalTwd.toLocaleString()}`;
    localStorage.setItem('okinawa_expenses', JSON.stringify(expenses));
}

if (addExpBtn) {
    addExpBtn.addEventListener('click', () => {
        const amount = parseFloat(expAmountInput.value);
        const category = expCategorySelect.value;
        const note = expNoteInput.value.trim();

        if (isNaN(amount) || amount <= 0) {
            alert('請輸入有效的日幣金額！');
            return;
        }
        expenses.push({ category, note, amount });
        expAmountInput.value = '';
        expNoteInput.value = '';
        renderExpenses();
    });
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    renderExpenses();
}
renderExpenses(); // 初始載入

/* ==========================================
   4. 地圖切換與繪製邏輯
   ========================================== */
const toggleMapBtn = document.getElementById('toggle-map-btn');
let mapInitialized = false;

if(toggleMapBtn) {
    toggleMapBtn.addEventListener('click', function() {
        const mapDiv = document.getElementById('map-container');
        if (mapDiv.style.display === 'none') {
            mapDiv.style.display = 'block';
            this.textContent = '返回行程列表';
            
            if (!mapInitialized) {
                // 初始化 Leaflet 地圖 (以沖繩那霸機場為中心點示範)
                const map = L.map('map-container').setView([26.1958, 127.6525], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                L.marker([26.1958, 127.6525]).bindPopup("<b>那霸機場</b>").addTo(map);
                L.marker([26.1965, 127.6620]).bindPopup("<b>小祿站</b>").addTo(map);
                mapInitialized = true;
            }
        } else {
            mapDiv.style.display = 'none';
            this.textContent = '🗺️ 切換地圖路線';
        }
    });
}

/* ==========================================
   5. 匯出 TXT 文字檔功能
   ========================================== */
function downloadTxtFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const exportNotesBtn = document.getElementById('export-notes-btn');
if(exportNotesBtn) {
    exportNotesBtn.addEventListener('click', () => {
        const text = document.getElementById('journal-text').value.trim();
        if (!text) {
            alert("日誌目前是空的喔！");
            return;
        }
        const dateStr = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
        downloadTxtFile(text, `旅途日誌_${dateStr}.txt`);
    });
}

const exportExpBtn = document.getElementById('export-exp-btn');
if(exportExpBtn) {
    exportExpBtn.addEventListener('click', () => {
        if (expenses.length === 0) {
            alert("目前沒有任何花費紀錄！");
            return;
        }
        let exportText = "【沖繩自駕遊 - 花費明細】\n==========================\n\n";
        let total = 0;
        expenses.forEach((item, index) => {
            total += item.amount;
            const noteText = item.note ? ` (${item.note})` : '';
            exportText += `${index + 1}. [${item.category}] ¥${item.amount}${noteText}\n`;
        });
        exportText += "\n==========================\n";
        exportText += `總計花費：¥${total.toLocaleString()}`;
        
        const dateStr = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
        downloadTxtFile(exportText, `花費明細_${dateStr}.txt`);
    });
}
/* ==========================================
   自動判定「今天」是 Day 幾，並同步更新「今天」分頁
   ========================================== */
function syncTodayItinerary() {
    // 設定旅程第一天的日期 (2026年8月30日)
    const tripStartDate = new Date('2026-08-30T00:00:00');
    // 取得當前系統時間 (今天 9/2 會自動抓取)
    const today = new Date(); 
    
    // 計算時間差 (將毫秒轉換為天數)
    const diffTime = today - tripStartDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    const currentDayIndex = diffDays + 1; // 差 0 天 = Day 1, 差 3 天 = Day 4
    
    const todayHeader = document.getElementById('today-header');
    const todayContainer = document.getElementById('today-schedule-container');

    // 如果目前日期在 Day 1 ~ Day 5 範圍內
    if (currentDayIndex >= 1 && currentDayIndex <= 5) {
        // 1. 自動觸發行程頁籤的點擊，切換到 Day X
        const targetBtn = document.querySelector(`.day-btn[data-day="day${currentDayIndex}"]`);
        if (targetBtn) {
            targetBtn.click(); 
        }

        // 2. 更新「今天」分頁的標題
        if (todayHeader) {
            todayHeader.textContent = `Day ${currentDayIndex} 今日行程`;
        }

        // 3. 把行程區塊 (dayX) 的內容，完整複製到「今天」的容器裡
        const currentDayContent = document.getElementById(`day${currentDayIndex}`);
        if (currentDayContent && todayContainer) {
            todayContainer.innerHTML = currentDayContent.innerHTML;
        }
    } else {
        // 如果今天不在旅程區間內 (例如出發前或回國後)
        if (todayHeader) {
            todayHeader.textContent = "今天沒有行程安排";
        }
        if (todayContainer) {
            todayContainer.innerHTML = "<p>好好休息！目前不在表定的旅程日期內喔。</p>";
        }
    }
}

// 網頁載入時執行判定
syncTodayItinerary();
