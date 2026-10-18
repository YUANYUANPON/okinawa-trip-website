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
   4. 地圖切換與繪製邏輯 (整合版)
   ========================================== */
let map = null;
let routeLayer = null; 
let currentSelectedDay = 'day1'; // 預設紀錄當前選擇的天數

function drawRouteOnMap(dayKey) {
    if (!map) return; 

    if (routeLayer) {
        routeLayer.clearLayers(); // 清除舊路線
    } else {
        routeLayer = L.featureGroup().addTo(map);
    }

    const locations = tripData[dayKey]; // 從新資料庫讀取
    
    if (!locations || locations.length === 0) return; 

    const latlngs = [];
    locations.forEach((loc, index) => {
        const marker = L.marker([loc.lat, loc.lng])
                        .bindPopup(`<b>${index + 1}. ${loc.name}</b>`);
        routeLayer.addLayer(marker);
        latlngs.push([loc.lat, loc.lng]);
    });

    const polyline = L.polyline(latlngs, {color: '#f27a4d', weight: 4});
    routeLayer.addLayer(polyline);

    map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });
}

// 監聽行程分頁按鈕，切換時連動更新地圖
dayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetDay = btn.getAttribute('data-day');
        currentSelectedDay = targetDay;
        drawRouteOnMap(currentSelectedDay); // 呼叫畫圖
    });
});

// 展開地圖按鈕
const toggleMapBtn = document.getElementById('toggle-map-btn');
if(toggleMapBtn) {
    toggleMapBtn.addEventListener('click', function() {
        const mapDiv = document.getElementById('map-container');
        if (mapDiv.style.display === 'none') {
            mapDiv.style.display = 'block';
            this.textContent = '返回行程列表';
            
            if (!map) {
                map = L.map('map-container').setView([26.1958, 127.6525], 11);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            }
            map.invalidateSize(); 
            drawRouteOnMap(currentSelectedDay); // 展開時畫出當天的路線
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
   1. 唯一資料來源：旅程總資料庫
   在這裡修改行程，HTML卡片與地圖會自動同步！
   ========================================== */
const tripData = {
    day1: [
        { 
            time: "16:40",
            name: "台中國際機場起飛，預計19:10抵達", 
            desc: "必備證件確認<br>• 護照：確認有效期限距離回程日至少還有 6 個月以上。•<br> Visit Japan Web：最晚在起飛前 6 小時完成線上登錄與 QR Code 截圖，可加速入境審查與海關申報流程。<br>• 駕照與譯本：若有在日本自駕需求，需攜帶台灣駕照正本與監理站申請的日文譯本。<br>!!!!!嚴禁攜帶所有肉類製品（如肉乾、香腸、火腿、含肉包子）、新鮮水果、蔬菜、植物與土壤。",
            lat: 24.262791200603534, 
            lng: 120.62441984756524
        },
        { 
            time: "18:05",
            name: "桃園國際機場T1起飛，預計20:50抵達", 
            desc: "無托運行李",
            lat: 25.082873559395377,  
            lng: 121.23764721553577
        },
        { 
            time: "19:10",
            name: "抵達沖繩那霸機場", 
            desc: "入境、拿行李後，搭單軌電車。<br>從抵達大廳走到國內線航廈，依循指標至戶外連通道即可抵達那霸機場站，站內設有自動售票機，購買單程票。<br>那霸機場不只是交通樞紐，更是非常好買、好逛的血拼據點！精華區域主要集中在國內線航廈2樓以及連結國內、國際線的「YUINICHI Street」（連通道2樓）。<br>• 多數商店、伴手禮店與連通道店家： 大約從 07:00 開始營業，至 20:30 結束。<br>• 國際線出境免稅店（DFS等）： 約 07:30 ～ 19:30（部分店家略有不同）。<br>• 最後一天離開前貼心提醒： 過了國際線海關後的免稅店與餐飲選擇非常少，強烈建議在入關前就在國內線航廈及2樓商場把伴手禮買齊、吃飽再進去。",
            lat: 26.20052375709535, 
            lng: 127.6465571909398
        },       
        { 
            time: "20:00",
            name: "住宿-東橫INN 沖繩那霸國際通美榮橋站", 
            desc: "前往美榮橋站-東橫INN。<br> PENG WEIPIN辦理入住(已線上付款含早餐)",
            lat: 26.2188, 
            lng: 127.6836
        },
        { 
            time: "20:30",
            name: "國際通", 
            desc: "晚餐、採買與旅程補給，先到先逛。",
            lat: 26.2159,
            lng: 127.6844 
        },
        { 
            time: "20:30",
            name: "MaxValu 牧志店超市", 
            desc: "位於日本沖繩縣那霸市國際通附近、24小時營業的大型連鎖超市，深受觀光客與在地人喜愛。",
            lat: 26.218910901746142, 
            lng: 127.6907730935187
        }
    ],
    day2: [
        {
            time: "08:00",
            name: "OTS臨空豐崎營業所取車",
            desc: "OTS租車預約JPY34100含保險(未付)。",
            lat: 26.159089793092924, 
            lng: 127.6543064404733
        },
        {
            time: "09:00",
            name: "波上宮",
            desc: "*最佳拍照位置：波之上臨港道路（高架橋上）<br>*經典視角：站在橋上的人行道上，可以將佇立在珊瑚礁懸崖上的朱紅色波上宮、清澈湛藍的「波之上海灘」與藍天白雲一次收入鏡頭，拍出宛如明信片的奇景。<br>*前往路線：1. 從波上宮的黑色大鳥居離開、往外走。2. 走到旁邊的小巷（鄰近波之上自動車學校）直走到底。3. 右手邊會看到上橋的階梯與人行步道，走上「波之上臨港道路」，往中段走即可找到最佳拍攝點。<br>*神社境內必拍亮點，黑色大鳥居：波上宮入口處的地標，全沖繩少見的黑色鳥居。朱紅拜殿與沖繩風獅爺：採用琉球傳統紅瓦屋頂，拜殿前有可愛的沖繩風獅爺（Shisa）守護，極具在地特色。和服體驗：許多旅人會先在國際通附近預約和服租借，穿著和服到神社與海灘拍照。<br>*實用拍攝與行程小貼士，停留時間：1小時（神社參拜約30分鐘，步行至橋上拍照約30分鐘；若要到海灘踩水則需更久）。<br>*御守時間：神社24小時開放，但購買人氣小書包交通安全御守、貝殼結緣守或紅型守的「授與所」開放時間為 09:00 - 17:00（御守一個約1,000日圓）。<br>*自駕停車提醒：波上宮境內的免費停車場僅限停30分鐘（僅供參拜）。若要悠閒散步到橋上拍照，建議直接導航停在周邊的收費投幣停車場（例如「若狹海濱停車場」或「波之上立體駐車場」），才不會被時間追著跑。。",
            lat: 26.220948622982807, 
            lng: 127.67104755119122
        },
        {
            time: "10:00",
            name: "座喜味城跡<br>位於沖繩縣讀谷村，是一座融合高超石造技術與歷史價值的世界文化遺產",
            desc: "建築與歷史特色<br>• 優美的弧線石牆：城牆並非生硬的直線，而是順應丘陵地形砌成柔和、具動態感的優雅弧線。<br>• 精密石造技術：展現了琉球古城中最精密的石造工藝，包含布壘砌與相方壘砌等工法。<br>• 沖繩最古老的拱形石門：城內保有沖繩現存最古老的弓形（拱形）石門，由楔形石材精巧咬合構成。<br>• 防禦設計：內部設有巧妙的武者隱身通道等軍事防禦結構。<br>• 絕佳視野：登上石牆頂端視野開闊，天氣晴朗時可遠眺東中國海、讀谷村風光，甚至能看見遠處的首里城與美麗夕陽。。",
            lat: 26.408585536780294, 
            lng: 127.7417841554693
        },
        {
            time: "11:00",
            name: "殘波岬",
            desc: "位於沖繩本島中部的讀谷村，是沖繩本島最西端的海岬，以綿延約2公里、高約30公尺的天然珊瑚礁斷崖絕壁與壯麗夕陽聞名。",
            lat: 26.442474293038188,  
            lng: 127.71379941290114
        },
        {
            time: "12:30",
            name: "萬座毛<br>位於沖繩本島西海岸的恩納村，是沖繩最具代表性的國家級海岸絕景之一。這裡最著名的景觀是一座高約20公尺、形狀酷似「大象鼻子」的隆起珊瑚礁斷崖（象鼻岩），搭配一望無際的 Tiffany 藍湛藍大海，是初訪沖繩必拍的經典地標",
            desc: "• 「毛」的意思：在沖繩方言（琉球語）中，「毛」指的是原野或草地。<br>• 名字由來：相傳在1726年，琉球王朝第十三代國王尚敬王來到此地巡視時，讚嘆海岬上這片廣闊翠綠的天然大草皮「足以容納萬人席地而坐」，因而得名。",
            lat: 26.50538411798285, 
            lng: 127.85043518465481
        },
        {
            time: "13:00",
            name: "午餐選擇-PST OKINAWA by the sea",
            desc: "位於恩納村的「全日空萬座海濱洲際酒店」海灘區一樓，是由東京六本木頂級拿坡里披薩名店「Pizza Studio Tamaki (PST)」開設的沖繩首家分店。該品牌實力極為強勁，不僅連續入選米其林指南必比登推薦、多次榮獲「50 Top Pizza Asia Pacific（亞太五十佳披薩）」獎項，其沖繩出身的主廚玉木翼更在世界級披薩廚師大賽（Beat Pizza 大獎）中榮獲全球第十名的殊榮，創下日本廚師的歷史最高紀錄。",
            lat: 26.504673527503424,  
            lng: 127.85982082883629
        },
        {
            time: "13:00",
            name: "午餐選擇-中村麵店",
            desc: "位於沖繩本島中部的恩納村國道58號沿線，是沖繩最具代表性的排隊名店之一。自1998年創業以來，這家沿海的傳統沖繩麵店便以「無敵海景」與獨家研發的「海藻沖繩麵」聞名，是許多旅客自駕玩西海岸時必去的美食地標。",
            lat: 26.50691842223897, 
            lng: 127.86528035581847
        },
        {
            time: "14:30",
            name: "部瀨名海中公園",
            desc: "位於沖繩本島北部名護市的部瀨名岬，是沖繩本島唯一的海中展望塔所在地。這裡主打「不用下水、不用全身弄濕、穿著日常便服」就能輕鬆進入5公尺深的海底，觀賞天然的熱帶魚與珊瑚礁。",
            lat: 26.538759352065043, 
            lng: 127.93490062883629 
        },
        {
            time: "16:30",
            name: "21世紀之森海灘",
            desc: "位於沖繩本島北部的名護市中心，是一座座落於「21世紀之森公園」內的廣闊人工白沙海灘。這裡過去主要作為日本職棒火腿隊春訓基地與當地市民的休閒秘境，近年經過大幅翻新後，於 2026 年全新啟用了複合式設施「Akemio Terrace」，搖身一變成為兼具最美海景星巴克、水上樂園與頂級親子遊樂場的沖繩北部話題新地標。",
            lat: 26.59152836394867, 
            lng: 127.96937687301777
        },
        {
            time: "17:00",
            name: "下午茶-Captain Kangaroo Hamburger",
            desc: "• Sparky Burger：招牌巨無霸漢堡，疊滿香脆的炸洋蔥與厚實多汁的牛肉排。<br>• 麵包外皮烤得微脆內裡鬆軟，肉排肉汁豐富。<br>• 附贈的薯條常會搭配特製調味粉，店家的炸雞也相當受好評。",
            lat: 26.624513627654864, 
            lng: 127.89095872725152
        },
        {
            time: "17:30",
            name: "瀨底島Okinawa Marine Studio<br>體驗30分鐘透明獨木舟",
            desc: "瀨底島（Sesoko Island） 位於日本沖繩縣本部町西北部，是一座周長約 8 公里、以清澈海水與純白沙灘聞名的離島。",
            lat: 26.65159537840534, 
            lng: 127.87372122355622
        },
        {
            time: "18:30",
            name: "晚餐選擇-アグーとんかつの店 沖縄やんばる家",
            desc: "位於沖繩縣本部町的一家特色高級豬排專賣店。",
            lat: 26.64897515614339, 
            lng: 127.90752409694461
        },
        {
            time: "18:00",
            name: "晚餐選擇-Yakiniku King 名護店",
            desc: "中價位吃到飽，肉質穩定度與自助菜單豐富度在連鎖店中評價優異。吃到飽（放題），採觸控平板點餐。限時100分鐘",
            lat: 26.60855350493695, 
            lng: 127.97027475305931
        },
        
        {
            time: "20:00",
            name: "永旺名護店",
            desc: "是沖繩本島北部最大規模的綜合購物商場兼超市。",
            lat: 26.609870459654342, 
            lng: 127.9839950134911
        },
        {
            time: "20:30",
            name: "住宿-名護パークサイドコンドミニアムTKステイ",
            desc: "入住airb&b",
            lat: 26.59813837785475, 
            lng: 127.96599037116367
        }
    ],
    day3: [
        {
            time: "07:50",
            name: "早餐選擇-CAMEL SANDWICH & SMOOTHIE",
            desc: "它座落於沖繩北部的本部町，距離最核心的景點美麗海水族館開車僅需 6～10 分鐘，因為早上 7:00 就開始營業，被無數旅客列為「前往水族館路上必買的神級早午餐」。這裡主打料多實在、現點現做的超厚實爆餡三明治，配上一杯沁涼的現打果昔，非常適合外帶帶上車，一路看著沖繩的藍海一邊享用。",
            lat: 26.676757250211512,  
            lng: 127.89121568650889
        },
        {
            time: "07:50",
            name: "早餐選擇-Potama - Okinawa Motobucho store",
            desc: "是沖繩風「豬肉蛋飯糰」靈魂代表品牌的北部限定旗艦店。距離美麗海水族館開車僅需 4-5 分鐘 。這間分店最大的特色就是擁有無敵的蔚藍海景陽台與本部町獨家限定口味，是前往水族館或自駕遊本部半島時，絕不能錯過的平價海景美食。<br>• 本部町限定：香檸南蠻炸雞飯糰（シークヮーサータルタル唐揚げ）• 特色：將剛炸好、酥脆多汁的日式唐揚炸雞，淋上融入沖繩特產「香檸（Seekwasa）」的特製南蠻塔塔醬。微酸清爽的果香中和了炸雞與午餐肉的油膩，層次極其豐富，是只有這間分店才吃得到的極品！<br>• 沖繩經典限定：苦瓜天婦羅飯糰（ゴーヤの天ぷら）• 特色：現炸的苦瓜天婦羅帶有淡淡的微苦與極致的酥脆感，搭配鰹魚節與午餐肉的鹹香，是體驗正宗沖繩地道風味的首選。<br>• 海島超人氣：島豆腐厚揚味噌飯糰（島豆腐の厚揚げ自家製油味噌）• 特色：外酥內嫩的現炸厚切沖繩島豆腐，刷上帶著甘甜風味的沖繩傳統自家製「油味噌」，鹹甜交織，深受男女老少喜愛。",
            lat: 26.682781536789133, 
            lng: 127.88318774232741
        },
        {
            time: "08:30",
            name: "沖繩美麗海水族館(Funpass)<br>座落於本部町的「海洋博公園」內，是全球最壯觀、規模最大的水族館之一。這裡以「邂逅沖繩之海」為主題，完美重現了從陽光普照的淺海珊瑚礁到水深 700 公尺的神祕深海生態。不論是巨大的鯨鯊、優雅滑翔的鬼蝠魟，還是深受大人小孩喜愛的免費戶外海豚秀，都是來到沖繩絕不可錯過的必訪地標。",
            desc: "• 海豚秀：10:30 / 11:30 / 13:00 / 15:00 /17:00。<br>• 黑潮探險（水上觀覽區）：• 看點：可從大水槽的正上方水面往下俯瞰鯨鯊與魟魚，並有工作人員現場解說。• 開放時間：一般為 9:00～10:45 以及 17:30～閉館前 15 分鐘（免預約，從 1 樓鯨鯊・魟魚展區專用電梯進入）<br>• Cafe Ocean Blue 咖啡廳：緊鄰黑潮之海大水槽旁的特等席咖啡廳。可以一邊享用輕食，一邊近距離看著鯨鯊在窗前游過。人潮多時需抽號碼牌入座（有 40 分鐘用餐時間限制）。<br>• 海洋觀賞室：提供從不同角度向上仰望大水槽的視角，宛如置身海底隧道。",
            lat: 26.69450574282452, 
            lng: 127.8779916423274
        },
        {
            time: "13:00(已訂位)",
            name: "午餐選擇-燒肉本部牧場 本部總店",
            desc: "12:30前往，提供高CP值的牧場直營「本部牛」午間套餐，營業時間為每日 11:30 至 15:00。",
            lat: 26.659064114732438, 
            lng: 127.8855927388437 
        },
        {
            time: "14:00",
            name: "午餐選擇-岸本食堂",
            desc: "創立於1905年（明治38年），是擁有超過百年歷史的沖繩麵發源地代表之一。<br>提供外帶服務！無論是招牌的沖繩麵（沖縄そば）還是每日限量的什錦炊飯（ジューシー），都可以打包帶走。",
            lat: 26.660996494503678,  
            lng: 127.89568035471139 
        },
        {
            time: "14:30",
            name: "回沖繩美麗海水族館",
            desc: "• 鯨鯊垂直餵食秀：每日 15:00 與 17:00。• 看點：平時水平游動的鯨鯊，會改以近乎垂直站立的姿態張開大口在水面吸食餌料，極具震撼力。建議提早 10～15 分鐘前來卡位。<br>15:30熱帶魚餵食解說（珊瑚之海 / 花園鰻區域)",
            lat: 26.69450574282452, 
            lng: 127.8779916423274
        },
        {
            time: "16:30",
            name: "今歸仁城跡<br>位於日本沖繩縣國頭郡今歸仁村的知名歷史古城遺跡，於2000年被登錄為世界文化遺產。",
            desc: "基本與歷史介紹<br>• 歷史背景：建於13世紀（三山時代），曾是統治沖繩北部的北山王國居城，有「北山城」或「北部巨城」之稱。<br>• 城牆特色：總長約1.5公里，最高處達8公尺，採用古生代三疊紀石灰岩與不易加工的「野面積」（不經修整直接堆疊）工法，線條優美宛如「沖繩版萬里長城」。<br>• 重要史跡：城內設有主郭、上之嶽等御嶽（琉球信仰聖地）與北山監守來歷碑記，並與傳說名刀「千代金丸」的歷史故事息息相關。",
            lat: 26.697044873297934, 
            lng: 127.93259530282344
        },
        {
            time: "17:30",
            name: "備瀬のフクギ並木",
            desc: "兩旁林立著百年福木的砂路，是單車與牛車遊覽的熱門地點。",
            lat: 26.701699384792178, 
            lng: 127.8802374377713
        },
        {
            time: "17:30",
            name: "星巴克 沖繩本部町店",
            desc: "夕陽。",
            lat: 26.682156938180906, 
            lng: 127.88356165581851
        },
        {
            time: "19:00",
            name: "晚餐選擇-HAMA濱壽司~名護店",
            desc: "是日本市佔率第一的平價連鎖壽司品牌在沖繩北部的超人氣據點。這裡以每盤 110 日圓（含稅）起的極高 CP 值聞名，不僅附設寬敞的免費大型停車場，更於 2026 年 10 月起全面延長營業時間為每日早上 10:00 至午夜 12:00，是沖繩北部自駕遊、親子或深夜用餐的絕佳美食補給站。。",
            lat: 26.607757097360476, 
            lng: 127.97727942546017
        },
        {
            time: "19:00",
            name: "晚餐選擇-Warren’s Place 2.1 Burgers & Beer",
            desc: "是一家位於沖繩名護市、在網路與社群上擁有超高評價（Google 4.8顆星）的美式職人漢堡店。這裡由極具個性的老闆 Warren 經營，主打「量少質精（Quality, not quantity）」的本格派漢堡。。",
            lat: 26.595316675872986, 
            lng: 127.9714623423274 
        },
        {
            time: "19:30",
            name: "名護パークサイドコンドミニアムTKステイ",
            desc: "airb&b",
            lat: 26.59813837785475, 
            lng: 127.96599037116367
        }

    ],
    day4: [
        {
            time: "09:00",
            name: "古宇利大橋",
            desc: "是沖繩著名的人氣景點，全長 1,960 公尺，是沖繩第二長的跨海大橋，連接沖繩本島北部名護市的「屋我地島」與今歸仁村的「古宇利島」",
            lat: 26.68738253320531, 
            lng: 128.01732064317292
        },
        {
            time: "09:30",
            name: "古宇利海洋塔",
            desc: "坐擁可遍覽遼闊海景的室內外觀景台，乘坐高爾夫球車穿越花園即可到達。",
            lat: 26.700812105342056, 
            lng: 128.0241738134911 
        },
        {
            time: "11:00",
            name: "早午餐選擇-古宇利蝦蝦飯",
            desc: "位於日本沖繩縣國頭郡今歸仁村古宇利島的超人氣美式夏威夷風情海鮮餐廳。",
            lat: 26.65159537840534, 
            lng: 127.87372122355622
        },
        {
            time: "11:00",
            name: "早午餐選擇-Airando Fiji Restaurant & Cafe",
            desc: "位於日本沖繩古宇利島，是亞洲少見、由斐濟籍主廚與沖繩籍老闆娘共同經營的斐濟料理餐廳與咖啡廳。",
            lat: 26.69857831011718, 
            lng: 128.01985264812717
        },
        {
            time: "12:30",
            name: "神話聖地ASMUI健行(Funpass)",
            desc: "位於沖繩本島最北端、世界自然遺產「山原（Yanbaru）」國頭村，是一處結合2億5千萬年熱帶喀斯特奇岩與琉球神話的靈性健行聖地。<br>• 語音導覽 App：園區提供專用 App「Pocket Curator」，沿途設有 26 個解說點與故事。因山區訊號較弱，建議事先在入園前下載好離線資料。<br>• 主要設施：包含遊客中心、Spirit Lounge 休息室飲料、展示琉球石文化的「沖繩石文化博物館」，以及提供自製手打麵與阿古豬沖繩麵的「Mori no Sobaya.」餐廳。",
            lat: 26.86171395329207, 
            lng: 128.25429864237466
        },
        {
            time: "16:30",
            name: "宜野座道路休息站",
            desc: "位於日本沖繩縣國頭郡宜野座村，是沖繩本島東海岸地區具代表性的綜合型公路休息站。",
            lat: 26.4737858187198,  
            lng: 127.95211055185302
        },
        {
            time: "17:00",
            name: "下午茶-king tacos金武本店",
            desc: "是沖繩著名地方美食「塔可飯」（Taco Rice）的總店。",
            lat: 26.453479812663296, 
            lng: 127.91724491349112
        },
        {
            time: "18:00",
            name: "晚餐選擇-外食家くじら 北中城店",
            desc: "位於日本沖繩縣北中城村的一家高人氣海景義式餐廳，主打手工現做義大利麵、披薩與在地新鮮海鮮料理。",
            lat: 26.3046466559497, 
            lng: 127.80053328465482
        },
        {
            time: "18:00",
            name: "晚餐選擇-浜屋沖繩麵",
            desc: "浜屋そば）是位於日本沖繩縣中頭郡北谷町的超人氣在地老店，距離美國村車程約 5 至 7 分鐘，是許多觀光客與當地人造訪宮城海岸時必吃的靈魂美食。<br>• 浜屋沖繩麵（浜屋そば）：招牌人氣 No.1，鋪滿招牌豬軟骨。其豬軟骨燉煮到極度軟爛，軟骨呈現如果凍般入口即化的口感，帶有豐富膠質。<br>• 綜合沖繩麵（沖縄そば）：可以一次吃到豬軟骨與滷得入味的三層肉（五花肉）雙主菜組合。<br>• 湯頭與麵條：使用豬骨、雞骨與鰹魚熬製的清爽鹽味湯頭，搭配 Q 彈有嚼勁的中寬扁小麥麵條。<br>• 特色吃法：桌上通常會備有泡盛辣椒與紅生姜，加入幾滴泡盛辣椒能讓湯頭香氣更上一層樓。<br>• 配餐與甜點：另有入味的炊飯 以及夏季限定的牛奶紅豆刨冰、黑蜜黃豆粉刨冰等古早味冰品。",
            lat: 26.330525940672537, 
            lng: 127.74438837497311 
        },
        {
            time: "18:00",
            name: "晚餐選擇-A&W 美浜店",
            desc: "是一間位於日本沖繩縣沖繩市的經典美式速食餐廳，主打濃厚的 1960 年代復古美國復古風情。",
            lat: 26.3046466559497, 
            lng: 127.80053328465482
        },
        {
            time: "19:00",
            name: "住宿-AIRB&B宮城海岸",
            desc: "入住",
            lat: 26.331156044749648, 
            lng: 127.74596765158803
        },
        {
            time: "20:00",
            name: "北谷Fisharena",
            desc: "10/24週六八點美國村海上煙火最佳觀賞位置<br>位於美國村北側的遊艇碼頭一帶。這裡比木棧道寬敞，視野毫無遮擋，且觀光客相對較少，拍照角度非常好。",
            lat: 26.3224099871283,  
            lng: 127.75451639642243
        }
        
    ], 
    day5: [
        {
            time: "08:00",
            name: "勝連城遺址",
            desc: "位於懸崖上的 15 世紀城堡遺跡，建有弧形牆面，並可飽覽大海全景。",
            lat: 26.330747632143886, 
            lng: 127.87906898650888
        },
        {
            time: "10:00",
            name: "Kaichu Rd",
            desc: "海中道路。",
            lat: 26.339658633586758, 
            lng: 127.92910107101648
        },
        {
            time: "11:00",
            name: "宮城島",
            desc: "位於勝連群島中、平安座島的東側，地勢較高（最高點海拔約120公尺）。",
            lat: 26.36970452801382, 
            lng: 127.9846140839988
        },
        {
            time: "12:00",
            name: "伊計島",
            desc: "位於勝連群島的最外圍，透過「伊計大橋」與宮城島相連，是開車跳島的終點站。",
            lat: 26.3933872152091, 
            lng: 127.99671621178364 
        },
        {
            time: "12:00(已訂位)",
            name: "午餐選擇-燒肉五苑 宇流麻店",
            desc: "是沖繩當地高人氣的平價燒肉吃到飽連鎖餐廳，以提供中文平板點餐、豐富品項與高性價比受到觀光客與家庭旅客喜愛。不限時。",
            lat: 26.38024023421215, 
            lng: 127.85472393194085
        },
        {
            time: "12:30",
            name: "午餐選擇-うるまの島そば 海をのむ",
            desc: "位於日本沖繩縣宇流麻市（Uruma）宮城島的一家特色沖繩麵（沖縄そば）專賣店，主打獨特海味拉麵。",
            lat: 26.35727190497901,  
            lng: 127.9706860404217
        },
        {
            time: "13:30",
            name: "購物選擇-永旺夢樂城沖繩來客夢AEON MALL Rycom",
            desc: "是全沖繩規模最大、店舖最齊全的度假風大型購物中心，地址位於沖繩縣中頭郡北中城村。",
            lat: 26.314747417520966, 
            lng: 127.7965482 
        },
        {
            time: "13:30",
            name: "購物選擇-SAN-A 浦添西海岸 PARCO CITY ",
            desc: "是沖繩規模最大的複合式購物中心，由當地最大的超市集團 SAN-A 與日本知名百貨 PARCO 共同打造，坐落於沖繩西海岸。<br>獅薩伴手禮店（parco 3樓）",
            lat: 26.261980303308192, 
            lng: 127.69815844232743
        },
        {
            time: "17:00",
            name: "下午茶-hoppepan",
            desc: "位於日本沖繩的超人氣排隊麵包店。<br>• Hoppeほっぺ在日文裡是「臉頰」的意思。<br>• 取名靈感來自日本俗語「ほっぺたが落ちる」，意指「好吃到臉頰都要掉下來了」。",
            lat: 26.237328133955284, 
            lng: 127.70494564418149
        },
        {
            time: "17:00",
            name: "下午茶-Blue Seal Chatan",
            desc: "位於國道 58 號沿線，鄰近沖繩熱門景點美國村入口。這間分店是 Blue Seal 體系中極具代表性的「BigDip」風格大店，曾入選日本 Tabelog 冰淇淋百名店。它完美融合了「誕生於美國、成長於沖繩」的品牌歷史，提供融合在地食材、針對海島氣候調整的清爽冰品。<br>• 鹽金楚糕（Salt Chinsuko）：人氣熱銷 No.1！將沖繩傳統糕點「金楚糕」融入香濃香草冰淇淋中，並使用北谷在地的海鹽提味，完美呈現鹹甜交織、帶有顆粒嚼勁的細緻口感。<br>• 藍色波浪（Blue Wave）：視覺感滿分的夏日南國風，由清爽的蘇打雪酪混搭鳳梨冰淇淋，口感輕盈不鎖喉。<br>• 沖繩紅芋（Beni-imo）：採用沖繩在地特產紫薯製作，每一口都能品嚐到濃郁香甜的在地風土美味。<br>• 隱藏版菜單：除了常規的紙杯與脆皮甜筒，北谷店更是少數提供超過 50 種口味美式可麗餅與熱狗堡、聖代等豐富輕食的分店。",
            lat: 26.314154292888432, 
            lng: 127.76135280264927 
        },
        {
            time: "18:00",
            name: "美國村",
            desc: "位於日本沖繩縣中頭郡北谷町，是一座融合美式復古風情與沖繩海濱美景的大型綜合度假與購物商圈。",
            lat: 26.510200887716124, 
            lng: 127.75724072792077
        },
        {
            time: "18:30",
            name: "晚餐選擇-牛排屋88 北谷店",
            desc: "（STEAK HOUSE 88 Chatan）是沖繩知名的老字號平價美式牛排連鎖店。",
            lat: 26.317199762040225, 
            lng: 127.75489269155852 
        },
        {
            time: "18:30",
            name: "晚餐選擇-グルメ迴轉壽司市場（美濱店）",
            desc: "人氣極高的產地直送平價迴轉壽司。",
            lat: 26.316963063620907,  
            lng: 127.75927888650888
        },
        {
            time: "19:00",
            name: "住宿-AIRB&B宮城海岸",
            desc: "入住",
            lat: 26.331156044749648, 
            lng: 127.74596765158803
        },

    ], 
    day6: [
        {
            time: "09:00",
            name: "玉泉洞(Funpass)<br>是日本沖繩縣南城市「沖繩世界文化王國」園區內的著名天然鐘乳石洞，也是日本第二大規模的鐘乳石洞",
            desc: "• 形成歷史：歷經約 30 萬年歲月由珊瑚礁藻類與地下水溶解沉積形成。<br>• 規模長度：全洞總長約 5,000 公尺，目前對外開放參觀的區域約為 890 公尺（約佔全長的五分之一）。<br>• 洞內環境：內部全年氣溫保持在約 21°C 至 24°C 之間，冬暖夏涼。<br>• 步行時間：單純走完參觀步道約需 30 至 40 分鐘，若拍照停留則建議預留 45 分鐘至 1 小時。。",
            lat: 26.140636059302484, 
            lng: 127.74935929814593
        },
        {
            time: "10:00",
            name: "沖繩世界",
            desc: "從玉泉洞的出口一走上地面，就會直接銜接「王國村」。這裡將數棟屋齡超過百年的琉球傳統紅瓦古民家從沖繩各地完整移築至此，更被列為日本國家登錄有形文化財。",
            lat: 26.1406636745928, 
            lng: 127.7489983395513 
        },
        {
            time: "10:30",
            name: "奧武島",
            desc: "位於沖繩南部南城市的一座超迷你海島。它與沖繩本島之間僅隔著一座約 100 公尺長的跨海短橋（奧武橋），不需要搭船，開車只需 35 至 40 分鐘即可輕鬆「跳島」抵達，非常適合和沖繩世界文化王國排在同一天！<br>這座周長僅 1.7 公里的純樸小漁村，在觀光客之間有兩個最著名的超療癒代名詞：「貓咪之島」與「平價炸天婦羅」。",
            lat: 26.130187860418058, 
            lng: 127.77266937672593 
        },
        {
            time: "11:30",
            name: "NIRAIKANAI橋展望台",
            desc: "「NIRAIKANAI」在沖繩傳統神話中，代表著「彼岸的神仙世界」或「豐饒理想鄉」。<br>開車在高速蜿蜒的跨海大橋上，前方就是海天一色的無邊際太平洋，真的讓人彷彿有種正要「開往神仙世界」的震撼感！",
            lat: 26.170440885214024,
            lng: 127.816234231338
        },
        {
            time: "12:00",
            name: "大城天婦羅店",
            desc: "相較於過橋第一家、名氣響亮但排隊人潮洶湧的「中本鮮魚店」，大城天婦羅店位於島的另一側海邊。這裡的步調更為悠閒、貓咪更多，最大的靈魂賣點在於「堅持現點現炸」，是想體驗最道地、最新鮮沖繩天婦羅的必訪名店！<br>*必點!!!!!<br>1. 水雲天婦羅（もずく）：沖繩特產的海藻。店家將它炸得像一朵黑色的大炸蝦餅，外酥內軟，帶有獨特的海味海苔香氣，是這裡的招牌。<br>2. 鮮魚（魚）：通常使用在地現撈的旗魚或白身魚，魚肉極為厚實細緻、完全沒有腥味。<br>3. 紅芋（紅いも）：口感綿密、甜而不膩，非常適合當作完美的甜點收尾。<br>4. 花枝 / 烏賊（いか）：肉質非常彈牙爽脆，而且很好咬斷，連長輩或小朋友都很愛。",
            lat: 26.130524836118017, 
            lng: 127.77088129680612 
        },
        {
            time: "12:00",
            name: "知念岬公園",
            desc: "是沖繩南部最不容錯過的三面環海懸崖景點。",
            lat: 26.176442487542626, 
            lng: 127.82916033534701
        },
        {
            time: "13:00",
            name: "午餐選擇-沖繩麵Tamaya Soba Headquarters",
            desc: "そば処 玉家 / Tamaya Soba Headquarters）位於日本沖繩縣南城市，是當地極具代表性的沖繩麵（Okinawa Soba）名店，曾榮獲當地電視台票選的「沖繩麵王者」頭銜。。",
            lat: 26.19184414343308, 
            lng: 127.74496257344508
        },
        {
            time: "13:00",
            name: "午餐選擇-苦瓜漢堡JEF Yonabaru",
            desc: "是沖繩在地發跡的本土美式速食品牌 JEF（ジェフ沖縄） 的歷史悠久創始總店。",
            lat: 26.20054681797917, 
            lng: 127.74753749406814
        },
        {
            time: "14:00",
            name: "ASHIBINAA Outlet",
            desc: "屬露天式購物商場，擁有超過 100 家國際精品與運動品牌（如 Gucci、Coach、Adidas、The North Face 等）。",
            lat: 26.16025151766797, 
            lng: 127.65778096403479 
        },
        {
            time: "17:30",
            name: "賴長島夕陽",
            desc: "位於沖繩那霸機場南方約 1.5 公里處的迷你離島。島上最具代表性的就是依山坡而建、一整片純白色階梯式建築的商場，襯托著沖繩的碧藍大海，因此擁有「沖繩小希臘」的美譽，是沖繩近年最熱門的網美打卡與放鬆勝地。",
            lat: 26.177622422246102,  
            lng: 127.6404431647695
        },
        {
            time: "18:30",
            name: "OTS臨空豐崎營業所（那霸機場）",
            desc: "7點前還車!!!。",
            lat: 26.159981882468692,  
            lng: 127.65434773650516
        },
        {
            time: "19:00",
            name: "iias 沖繩豐崎",
            desc: "結合大型商場、美食街、藥妝與 DMM Kariyushi 水族館。。",
            lat: 26.157988487631002, 
            lng: 127.65093596653412
        },
        {
            time: "20:00",
            name: "住宿1-那霸歌町大和Roynet飯店",
            desc: "trip.com預定已付款含早餐。",
            lat: 26.22320176721318, 
            lng: 127.69491121182273
        },
        {
            time: "20:00",
            name: "住宿2-東横INN那覇おもろまち駅前",
            desc: "東橫INN預定已付款含早餐。",
            lat: 26.222526718884474, 
            lng: 127.69734923770012 
        }

    ], 
    day7: [
        {
            time: "07:00",
            name: "達摩寺(Funpass)",
            desc: "達磨寺西來院兌換：開金運口金包御守，沒換到隔天再來。<br>位於日本沖繩縣那霸市首里古都的臨濟宗妙心寺派古剎。它隱身在首里城附近的寧靜巷弄中，距離熱鬧的國際通僅約 15 分鐘車程。雖然其佔地面積精緻小巧，但因境內遍布大量大大小小、色彩繽紛的達摩不倒翁與一條迷你的千本鳥居隧道，近年來在社群網路上迅速竄紅，成為自由行旅客到訪首里城時必排的隱藏版能量景點。",
            lat: 26.21795195350987,  
            lng: 127.72259608188158
        },
        {
            time: "09:00",
            name: "首里城",
            desc: "（Shurijo Castle）位於日本沖繩縣那霸市，是琉球王國政治、外交與文化的中心，擁有超過 500 年的歷史。它完美融合了中國與日本的築城技術與建築風格，展現出獨特的琉球式城堡（Gusuku）風貌。其歷史遺留的城牆與遺跡，在 2000 年被聯合國教科文組織列為世界文化遺產。<br>首里城園區面積高達 11.8 公頃（大約是 16 個足球場大），且依山而築，包含大量的斜坡與石階。如果沒有規劃就盲目亂走，不僅容易迷路，還會消耗大量體力。",
            lat: 26.217893231318854, 
            lng: 127.71950037599181
        },
        {
            time: "12:00",
            name: "午餐選擇-タイラ製麺所 那覇サンライズ通り店 okinawa soba noodle＆beer",
            desc: "是沖繩近年迅速竄紅、極具人氣的沖繩麵專賣店分店。",
            lat: 26.212953502780017, 
            lng: 127.68923901026916
        },
        {
            time: "13:00(已訂位)",
            name: "午餐選擇-敘敘苑燒肉 歌町店",
            desc: "是日本頂級連網燒肉品牌「敘敘苑」在沖繩非常受歡迎的分店。這家店坐落於那霸新都心的高級地段，直接進駐 Lucafu Omoromachi 商業大樓的 3 樓。相較於市區其他擁擠的餐廳，這裡提供更為高雅、寬敞且安靜的用餐環境，並配備專利無煙烤爐，讓你吃完燒肉身上完全不留油煙味。",
            lat: 26.224899889278948, 
            lng: 127.69826942606325 
        },
        {
            time: "14:00",
            name: "San-A Naha Main Place",
            desc: "是沖繩在地超市龍頭「SAN-A」旗下最具代表性的旗艦都市型購物中心。它坐落於繁華的「那霸新都心（Omoromachi）」核心地段，最大的優勢在於免自駕、搭單軌電車就能輕鬆直達，比起其他偏遠的郊區大型商場，這裡是自由行旅客在市區採購伴手禮、日用品與藥妝最完美的「一站式補給站」。",
            lat: 26.22597120922627, 
            lng: 127.69507147712328
        },
        {
            time: "20:00",
            name: "住宿-那霸歌町大和Roynet飯店",
            desc: "trip.com預定已付款含早餐。",
            lat: 26.223211391831583, 
            lng: 127.69508287320348
        },
        {
            time: "20:00",
            name: "住宿2-東横INN那覇おもろまち駅前",
            desc: "東橫INN預定已付款含早餐。",
            lat: 26.222526718884474, 
            lng: 127.69734923770012 
        }

    ], 
    day8: [
        {
            time: "07:00",
            name: "奥武山公園網球場",
            desc: "是沖繩首座且歷史悠久的都會公園，坐落於那霸市區，佔地超過30萬平方公尺（約20多公頃）。園區24小時開放且免費入園，是當地居民與觀光客散步、親子遊玩及舉辦大型活動的重要據點。",
            lat: 26.203723517316952,  
            lng: 127.67482012533108
        },
        {
            time: "08:00",
            name: "那霸市第一牧志公設市場",
            desc: "被譽為「沖繩人的廚房」。這座創立於1950年代的歷史老市場，在歷經近4年的全面整修後，於 2023 年 3 月全新新館重幕開張。新大樓環境明亮乾淨、動線流暢且設有空調，不僅是當地居民採買日常食材的中心，更是國際通商圈最具代表性的海鮮與美食觀光地標。",
            lat: 26.214765932908428, 
            lng: 127.68832275304506
        },
        {
            time: "10:00",
            name: "Tsuboya Yachimun Street 壺屋やちむん通り",
            desc: "是一條充滿文青氣息與歷史底蘊的沖繩陶器老街。在沖繩方言中，「やちむん（Yachimun）」正是「陶器」的意思。這條街起源於 1682 年的琉球王朝時代，當時王室為了振興陶業，將全沖繩的陶藝家與窯廠集中於此。幸運的是，這裡在二戰時期避開了戰火波及，至今仍完整保留了古老的沖繩紅瓦古民家、石板路與蜿蜒窄巷（沖繩語稱為 Sujiguwa）。。",
            lat: 26.213357771675298,  
            lng: 127.6913204045106
        },
        {
            time: "10:30",
            name: "前往那霸機場",
            desc: "購買境內菸、伴手禮和ANA限定娃。13:35起飛-14:20抵達桃園機場<br>那霸機場2樓：那霸空港店、那霸大廳1號店（安檢前，可免稅）、那霸登機門店（安檢後）",
            lat: 26.21402226098878,  
            lng: 127.67934381071758
        },
        {
            time: "11:00",
            name: "琉貿百貨",
            desc: "超美跨海大橋，停車拍海景。",
            lat: 26.21402226098878,  
            lng: 127.67934381071758
        },
        {
            time: "12:00",
            name: "午餐選擇-A＆W 國際通松尾店",
            desc: "A&W 是源自美國的經典美式速食連鎖品牌，自1963年登陸沖繩以來，目前在日本本土本島完全沒有分店，是名副其實的「沖繩限定」美式復古餐廳。當地人常暱稱它為「安打」（アンダ）。",
            lat: 26.213867316938583,  
            lng: 127.68077194700662 
        },
        {
            time: "13:30",
            name: "前往那霸機場",
            desc: "可提早前往逛機場免稅店，16:45起飛-17:35抵達台中機場。<br>必買伴手禮推薦<br>• 御菓子御殿「元祖紅芋塔」： 沖繩經典不敗名物，紫心地瓜天然甜美。<br>• 南風堂「雪鹽金楚糕」： 傳統琉球酥餅結合宮古島雪鹽，鹹甜酥脆。<br>• oHacorte「檸檬蛋糕」與「旅行夾心塔」： 知名水果塔名店推出的常溫甜點，酸甜清爽超適合送禮。<br>• ほうき星「黑糖可麗露」： 外層微酥、內餡濕潤 Q 彈，有沖繩黑糖、當地綠茶等多種特色口味。<br>• ROYCE' 石垣島「黑糖巧克力」： 融合沖繩在地黑糖的香濃風味。<br>• 生海葡萄： 包裝完善的新鮮海葡萄，買回家稍微沾和風醬汁即可還原居酒屋美味（記得不放冰箱，隨身或托運）。",
            lat: 26.206915574086494,  
            lng: 127.65220056052665
        }

    ]// 可自行擴充
};

function renderItineraryCards() {
    // 遍歷 day1, day2, day3...
    for (const dayKey in tripData) {
        const container = document.getElementById(dayKey);
        if (!container) continue; // 如果 HTML 沒有這個容器就跳過

        const locations = tripData[dayKey];
        container.innerHTML = ''; // 清空容器

        // 幫該天的每一個景點做出一張卡片
        locations.forEach(loc => {
            // 利用 encodeURIComponent 把景點名稱轉為安全的網址編碼
            const safeQuery = encodeURIComponent(loc.name);
            const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${safeQuery}`;

            // 組裝 HTML 字串
            const cardHTML = `
                <article class="card">
                    <div class="time">${loc.time}</div>
                    <div class="info">
                        <h3>${loc.name}</h3>
                        <p>${loc.desc}</p>
                        <a href="${googleMapUrl}" target="_blank">導航到這裡 ↗</a>
                    </div>
                </article>
            `;
            
            // 把這張卡片塞進該天的容器裡
            container.innerHTML += cardHTML;
        });

        // 如果該天沒有行程，顯示提示
        if (locations.length === 0) {
            container.innerHTML = '<p style="color:#888;">這天還沒有安排行程喔！</p>';
        }
    }
}

// 網頁一載入，就馬上執行渲染卡片
renderItineraryCards();

/* ==========================================
   自動判定「今天」是 Day 幾，並同步更新「今天」分頁
   ========================================== */
function syncTodayItinerary() {
    // 設定旅程第一天的日期 
    const tripStartDate = new Date('2026-10-16T00:00:00');
    // 取得當前系統時間 (今天 9/2 會自動抓取)
    const today = new Date(); 
    
    // 計算時間差 (將毫秒轉換為天數)
    const diffTime = today - tripStartDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    const currentDayIndex = diffDays + 1; // 差 0 天 = Day 1, 差 3 天 = Day 4
    
    const todayHeader = document.getElementById('today-header');
    const todayContainer = document.getElementById('today-schedule-container');

    // 如果目前日期在 Day 1 ~ Day 8 範圍內
    if (currentDayIndex >= 1 && currentDayIndex <= 8) {
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


/* ==========================================
   2. 自動產生 HTML 行程卡片
   ========================================== */
