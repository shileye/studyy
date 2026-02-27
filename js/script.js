// 全局错误捕获
window.onerror = function(msg, url, line) {
    console.error("Sys Error:", msg);
    return false;
};

const DB_KEY = "algo_v12_clean"; 

// --- 配置区 ---
const RATINGS = {
    "1200": { color: "#9ca3af", label: "Newbie", xp: 10, group: 0 },
    "1500": { color: "#2dd4bf", label: "Pupil", xp: 25, group: 1 },
    "1750": { color: "#3b82f6", label: "Specialist", xp: 45, group: 2 },
    "2000": { color: "#a855f7", label: "Expert", xp: 70, group: 3 },
    "2200": { color: "#ef4444", label: "Master", xp: 100, group: 4 },
    "luogu_red":    { color: "#FE4C61", label: "入门", xp: 5, group: 0 },
    "luogu_orange": { color: "#F39C11", label: "普及-", xp: 15, group: 0 },
    "luogu_yellow": { color: "#FFC116", label: "普及/提高-", xp: 30, group: 1 },
    "luogu_green":  { color: "#52C41A", label: "普及+/提高", xp: 50, group: 2 },
    "luogu_blue":   { color: "#3498DB", label: "提高+/省选-", xp: 70, group: 3 },
    "luogu_purple": { color: "#9D3DCF", label: "省选/NOI-", xp: 90, group: 4 },
    "unrated":      { color: "#64748b", label: "Unrated", xp: 20, group: 0 }
};

const QUOTES = [
    {t:"十年生死两茫茫，不思量，自难忘。", a:"苏轼"},
    {t:"Talk is cheap. Show me the code.", a:"Linus"},
    {t:"菜是原罪，练是救赎。", a:"小羊肖恩"},
    {t:"为了看一眼山顶的风景，我愿意流干汗水。", a:"攀登者"},
    {t:"种一棵树最好的时间是十年前，其次是现在。", a:"Dambisa Moyo"},
    {t:"你所热爱的，就是你的生活。", a:"《英雄联盟》"},
    {t:"星光不问赶路人，时光不负有心人。", a:"大冰"},
    {t:"Stay hungry, stay foolish.", a:"Steve Jobs"},
    {t:"Debug 了一整夜，天亮了，Bug 还在。", a:"无名码农"},
    {t:"我本可以忍受黑暗，如果我不曾见过太阳。", a:"艾米莉·狄金森"},
    {t:"AC 是唯一的真理。", a:"Algo_Warrior"},
    {t:"无数次 WA 之后，AC 的声音最动听。", a:"ICPC"},
    {t:"孤独是强者的必修课。", a:"佚名"},
    {t:"满屏的红，是通往绿色的必经之路。", a:"Codeforces"},
    {t:"代码不会骗人，骗人的是逻辑。", a:"Logic"},
    {t:"生活不只是眼前的苟且，还有诗和远方的田野。", a:"高晓松"},
    {t:"愿你出走半生，归来仍是少年。", a:"孙光曼"},
    {t:"既然选择了远方，便只顾风雨兼程。", a:"汪国真"},
    {t:"The only way to do great work is to love what you do.", a:"Steve Jobs"},
    {t:"凛冬将至。", a:"《权力的游戏》"},
    {t:"凡是过往，皆为序章。", a:"莎士比亚"},
    {t:"我们终此一生，就是要摆脱他人的期待，找到真正的自己。", a:"无声告白"},
    {t:"没有不可治愈的伤痛，没有不能结束的沉沦。", a:"村上春树"},
    {t:"如果结果不如你所愿，就在尘埃落定前奋力一搏。", a:"夏目友人帐"},
    {t:"你当像鸟飞往你的山。", a:"塔拉·维斯特弗"},
    {t:"凌晨四点的洛杉矶。", a:"Kobe Bryant"},
    {t:"与其感慨路难行，不如马上出发。", a:"行动派"},
    {t:"每一个不曾起舞的日子，都是对生命的辜负。", a:"尼采"},
    {t:"键盘敲烂，月薪过万（大嘘）。", a:"打工人"},
    {t:"人生如逆旅，我亦是行人。", a:"苏轼"}
];

const FORTUNES = [
    "大吉 - 宜刷图论", "中吉 - 宜补题", "小吉 - 宜复习模版", "平 - 宜休息", 
    "大吉 - 今日 AC 率 100%", "吉 - 手感火热", "凶 - 忌写大模拟", "大凶 - 可能会 WA"
];

let appData = { xp: 0, level: 1, maxRating: 0, todos: [], logs: [], targets: [], history: [] };
let timerState = { isRunning: false, startTime: 0, totalTime: 0, date: "" };
let timerInterval = null;
let quoteIdx = 0;
let currentTheme = { p: '#4f46e5', a: '#db2777' };
let pendingDeleteAction = null; 

// --- 安全 DOM 操作助手 ---
function setContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
function setStyle(id, prop, val) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = val;
}

// --- 初始化 ---
window.onload = () => {
    try {
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
        try {
            const savedColors = localStorage.getItem('themeColors');
            if(savedColors) {
                currentTheme = JSON.parse(savedColors);
                applyTheme(currentTheme.p, currentTheme.a);
            }
        } catch(e) {}

        loadData();
        loadTimer();
        checkDailySettlement();
        renderUI();

        // ⚡ =============== 新增：空间跃迁接收器 =============== ⚡
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('auto_ac')) {
            const autoData = urlParams.get('auto_ac');
            // 直接借用你原本的“极速入库”输入框，神不知鬼不觉地塞进去
            const batchBox = document.getElementById('batchInput');
            if (batchBox) {
                batchBox.value = autoData;
                // 瞬间触发批量入库函数！
                processBatch(); 
            }
            // 杀人诛心：擦除网址里的密码，防止你一刷新网页又重复添加一遍
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        // ⚡ ==================================================== ⚡
        
        setInterval(() => {
            const now = new Date();
            const timeStr = now.getFullYear() + "-" + 
                String(now.getMonth()+1).padStart(2,'0') + "-" + 
                String(now.getDate()).padStart(2,'0') + " " + 
                String(now.getHours()).padStart(2,'0') + ":" + 
                String(now.getMinutes()).padStart(2,'0');
            setContent('currentDateDisplay', timeStr);
        }, 1000);

        setInterval(checkDailySettlement, 60000); 
        updateQuote();
        setInterval(() => { quoteIdx = (quoteIdx + 1) % QUOTES.length; updateQuote(); }, 30000);

        if(timerState.isRunning) {
            startTimerTicker();
            updateTimerUI(true);
        } else {
            updateTimerDisplay(timerState.totalTime);
        }

        const delBtn = document.getElementById('confirmDeleteBtn');
        if(delBtn) {
            delBtn.onclick = () => {
                if(pendingDeleteAction) pendingDeleteAction();
                closeModal('confirmModal');
            };
        }

    } catch(e) { console.error("Init Error:", e); }
};

// --- 时间逻辑 ---
function getRealDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getTaskTargetDate() {
    const now = new Date();
    const limit = new Date();
    limit.setHours(23, 30, 0, 0);

    if (now > limit) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const y = tomorrow.getFullYear();
        const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const d = String(tomorrow.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    } else {
        return getRealDate();
    }
}

// --- 每日结算 ---
function checkDailySettlement() {
    const today = getRealDate();
    const pastTodos = appData.todos.filter(t => t.date < today);
    
    if (pastTodos.length > 0) {
        const groups = {};
        pastTodos.forEach(t => {
            if(!groups[t.date]) groups[t.date] = { total:0, done:0 };
            groups[t.date].total++;
            if(t.done) groups[t.date].done++;
        });

        for(let date in groups) {
            if (!appData.history.find(h => h.date === date)) {
                const rec = groups[date];
                const pct = rec.total === 0 ? 0 : Math.round((rec.done / rec.total) * 100);
                appData.history.unshift({ date, ...rec, pct });
            }
        }
        
        appData.todos = appData.todos.filter(t => t.date >= today);
        saveData();
        renderUI(); 
        showToast("📅 昨日任务已结算", "info");
    }
}

// --- 功能函数 ---
function drawFortune() {
    const res = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    setContent('fortuneResult', res);
    fireConfetti();
}

function toggleCommitArea() {
    const el = document.getElementById('submitSection');
    if (el.style.display === 'none') {
        el.style.display = 'block';
        el.scrollIntoView({ behavior: 'smooth' });
    } else {
        el.style.display = 'none';
    }
}

// 🎯 魔改升级：支持智能抓取链接的添加任务
function addTodo() {
    const textRaw = document.getElementById('todoInput').value;
    const type = document.getElementById('todoType').value;
    if(!textRaw) return showToast("请输入内容", "error");

    // 用正则自动找出粘贴内容里的网址
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const extractedLinks = textRaw.match(urlRegex);
    const link = extractedLinks ? extractedLinks[0] : "";
    
    // 把链接从文字里剔除，保持任务名字清爽
    const cleanText = textRaw.replace(urlRegex, '').trim() || "未命名任务";

    const targetDate = getTaskTargetDate(); 
    const isTomorrow = targetDate !== getRealDate();
    const displayPrefix = isTomorrow ? "[明日] " : "";
    
    let icon = "📖";
    if(type === '赛') icon = "🏆";
    if(type === '学') icon = "🧠";

    appData.todos.push({
        id: Date.now(),
        text: `${displayPrefix}${icon} ${cleanText}`,
        rawText: cleanText, 
        link: link, // 把抓到的链接存起来！
        date: targetDate,
        done: false,
        type: type
    });
    
    document.getElementById('todoInput').value = '';
    saveData();
    
    if(isTomorrow) showToast("已加入明日计划", "success");
}

function scrollToCommit(text, id) {
    const section = document.getElementById('submitSection');
    if(section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        section.classList.add('highlight-pulse');
        setTimeout(() => section.classList.remove('highlight-pulse'), 1500);
    }
    
    const nameInput = document.getElementById('probName');
    if(nameInput) {
        nameInput.value = text || "";
        nameInput.focus();
    }
    
    const hiddenId = document.getElementById('linkedTaskId');
    if(hiddenId) hiddenId.value = id; 
    
    showToast("AC后自动完成任务", "info");
}

function submitAC() {
    const name = document.getElementById('probName').value;
    const rVal = document.getElementById('ratingSelect').value;
    const probLink = document.getElementById('probLink').value;
    const solLink = document.getElementById('solLink').value;
    const linkedId = document.getElementById('linkedTaskId').value;

    if(!name || !rVal) return showToast("请填写完整", "error");

    const conf = RATINGS[rVal];
    if(parseInt(rVal)) appData.maxRating = Math.max(appData.maxRating, parseInt(rVal));

    if (linkedId) {
        const task = appData.todos.find(t => t.id == linkedId);
        if(task) task.done = true;
    } else {
        const match = appData.todos.find(t => t.text.includes(name) && !t.done);
        if(match) match.done = true;
    }

    appData.logs.unshift({
        id: Date.now(),
        date: getRealDate(),
        name, ratingVal: rVal,
        link: probLink,
        sol: solLink,
        xp: conf.xp
    });
    appData.xp += conf.xp;
    
    const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
    if(nextLv > appData.level) { appData.level = nextLv; showToast(`🎉 升级啦 LV.${nextLv}`, "success"); }

    document.getElementById('probName').value = '';
    document.getElementById('probLink').value = '';
    document.getElementById('solLink').value = '';
    document.getElementById('linkedTaskId').value = '';
    
    saveData();
    openModal('acModal');
    fireConfetti();
}

function processBatch() {
    const text = document.getElementById('batchInput').value;
    if (!text.trim()) return showToast("请输入内容", "error");

    const lines = text.split('\n');
    let count = 0;
    
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        
        let match = line.match(/^(\d+)\s+(.+)$/);
        let validKey = "1200"; 
        let rawName = "";

        if (match) {
            const num = parseInt(match[1]);
            rawName = match[2];
            if (num >= 2200) validKey = "2200";
            else if (num >= 2000) validKey = "2000";
            else if (num >= 1750) validKey = "1750";
            else if (num >= 1500) validKey = "1500";
            else validKey = "1200";
            appData.maxRating = Math.max(appData.maxRating, num);
        } else {
            const charMatch = line.match(/^([红橙黄绿蓝紫黑]|unrated)\s+(.+)$/);
            if (charMatch) {
                const colorMap = {'红':'luogu_red', '橙':'luogu_orange', '黄':'luogu_yellow', '绿':'luogu_green', '蓝':'luogu_blue', '紫':'luogu_purple', '黑':'luogu_black', 'unrated':'unrated'};
                validKey = colorMap[charMatch[1]] || "unrated";
                rawName = charMatch[2];
            } else { continue; }
        }

        // 神奇的拆分魔法：如果有 | 竖线，就把名字和链接拆开
        let finalName = rawName;
        let finalLink = "";
        if (rawName.includes("|")) {
            let splitParts = rawName.split("|");
            finalName = splitParts[0].trim();
            finalLink = splitParts[1].trim();
        }

        const config = RATINGS[validKey] || RATINGS["unrated"];
        appData.logs.unshift({
            id: Date.now() + i, 
            date: getRealDate(),
            name: finalName,
            ratingVal: validKey,
            link: finalLink, 
            sol: "", 
            xp: config.xp
        });
        appData.xp += config.xp;
        count++;
    }

    if (count > 0) {
        const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
        if (nextLv > appData.level) { appData.level = nextLv; }
        saveData();
        closeModal('batchModal');
        document.getElementById('batchInput').value = "";
        showToast(`⚡ 导入 ${count} 题`, "success");
        fireConfetti();
    } else { showToast("格式错误", "error"); }
}

// --- 渲染函数 ---
function renderUI() {
    setContent('lvNum', appData.level);
    setContent('curXP', appData.xp);
    
    const nextXP = 50 * Math.pow(appData.level, 2);
    setContent('nextXP', nextXP);
    
    const prevXP = 50 * Math.pow(appData.level - 1, 2);
    const pct = ((appData.xp - prevXP) / (nextXP - prevXP)) * 100;
    
    setStyle('xpFill', 'width', `${Math.max(0, Math.min(pct, 100))}%`);
    setContent('totalAC', appData.logs.length);

    renderChart();
    renderTodos();
    renderHistory();
    renderLogs();
    renderCountdowns();
    renderHeatmap();
    renderCalendar(); 
}

// 🎯 魔改升级：渲染带传送门链接的任务列表
function renderTodos() {
    const todayStr = getRealDate();
    const list = document.getElementById('todoList');
    if(!list) return;
    list.innerHTML = "";
    
    const activeTodos = appData.todos.filter(t => t.date >= todayStr);
    const todayOnly = appData.todos.filter(t => t.date === todayStr);
    const doneCount = todayOnly.filter(t => t.done).length;
    const progress = todayOnly.length ? Math.round((doneCount/todayOnly.length)*100) : 0;
    
    setStyle('dailyProgress', 'width', `${progress}%`);
    setContent('progressText', `${progress}%`);
    
    const bar = document.getElementById('dailyProgress');
    if(bar) {
        if(progress === 100 && todayOnly.length > 0) bar.style.backgroundColor = "#10b981";
        else bar.style.backgroundColor = currentTheme.p;
    }

    if(activeTodos.length === 0) list.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:20px;">今日无任务</div>`;
    
    activeTodos.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.done - b.done;
    });

    activeTodos.forEach(t => {
        const goAcBtn = !t.done ? 
            `<button class="btn-go-ac" onclick="scrollToCommit('${escapeHtml(t.rawText)}', ${t.id})">✅ 提交</button>` 
            : '';
            
        // 如果有链接而且还没做完，就显示传送门按钮！
        const goProbBtn = (!t.done && t.link) ? 
            `<a href="${escapeHtml(t.link)}" target="_blank" class="btn-go-ac" style="text-decoration:none; background:var(--primary); color:white;">🔗 传送</a>` 
            : '';

        list.innerHTML += `
        <div class="todo-item ${t.done?'done':''} ${t.type==='赛'?'type-race':''}">
            <div style="flex:1; cursor:pointer;" onclick="toggleTodo(${t.id})">${escapeHtml(t.text)}</div>
            <div style="display:flex; gap: 8px; align-items: center;">
                ${goProbBtn}
                ${goAcBtn}
                <span class="btn-del" onclick="requestDelete('todo', ${t.id})">✕</span>
            </div>
        </div>`;
    });
}

function renderHistory() {
    const histList = document.getElementById('historyList');
    if(!histList) return;
    histList.innerHTML = "";
    if(appData.history.length === 0) {
        histList.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无历史</div>`;
        return;
    }
    appData.history.slice(0, 7).forEach(h => {
        histList.innerHTML += `
        <div class="history-item">
            <span>${h.date}</span>
            <span>完成度: <b style="color:${h.pct>=80?'#10b981':'#64748b'}">${h.pct}%</b> (${h.done}/${h.total})</span>
        </div>`;
    });
}

function renderLogs() {
    const searchInput = document.getElementById('searchInput');
    const searchText = searchInput ? searchInput.value.toLowerCase() : "";
    const logBox = document.getElementById('logList');
    if(!logBox) return;
    logBox.innerHTML = '';
    
    const filteredLogs = appData.logs.filter(l => l.name.toLowerCase().includes(searchText));
    
    if(filteredLogs.length === 0 && !searchText) {
        logBox.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无记录</div>`;
        return;
    }

    filteredLogs.slice(0, 30).forEach(l => {
        const conf = RATINGS[l.ratingVal] || RATINGS["1200"];
        const div = document.createElement('div');
        div.className = 'log-card';
        div.style.borderLeftColor = conf.color;
        
        let links = '';
        if(l.link) links += `<a href="${escapeHtml(l.link)}" target="_blank" class="link-btn link-prob">📄 原题</a>`;
        if(l.sol) links += `<a href="${escapeHtml(l.sol)}" target="_blank" class="link-btn link-sol">📝 代码</a>`;

        div.innerHTML = `
            <div style="flex:1">
                <div style="font-weight:bold;display:flex;align-items:center;flex-wrap:wrap;">
                    <span class="rating-tag" style="background:${conf.color}">${conf.label}</span>${escapeHtml(l.name)}
                </div>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:5px;">${l.date} · +${l.xp} XP</div>
            </div>
            <div style="display:flex;align-items:center;">
                ${links}
                <div class="btn-del" onclick="requestDelete('log', ${l.id})">✕</div>
            </div>
        `;
        logBox.appendChild(div);
    });
}

function renderChart() {
    const ctx = document.getElementById('radarChart');
    if (ctx && window.Chart) {
        const groupStats = [0, 0, 0, 0, 0]; 
        appData.logs.forEach(l => { 
            const conf = RATINGS[l.ratingVal] || RATINGS["1200"]; 
            if (conf) groupStats[conf.group]++; 
        });
        if (window.myRadarChart) window.myRadarChart.destroy();
        const isDark = document.body.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const themeColor = currentTheme.p;
        window.myRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['入门', '普及', '提高', '省选', 'NOI'],
                datasets: [{ label: 'AC', data: groupStats, backgroundColor: themeColor + '33', borderColor: themeColor, pointBackgroundColor: currentTheme.a, pointBorderColor: '#fff', borderWidth: 2 }]
            },
            options: { maintainAspectRatio: false, scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: textColor, font: { size: 10, family: 'JetBrains Mono' } }, ticks: { display: false, backdropColor: 'transparent' } } }, plugins: { legend: { display: false } } }
        });
    }
}

function renderCountdowns() {
    const list = document.getElementById('countdownList');
    if(!list) return;
    list.innerHTML = "";
    if (!appData.targets || appData.targets.length === 0) { 
        list.innerHTML = "<div style='text-align:center; color:#999; font-size:0.8rem;'>暂无比赛日程</div>"; 
        return; 
    }
    
    // 自动排序
    appData.targets.sort((a, b) => new Date(a.date) - new Date(b.date));

    appData.targets.forEach((t) => {
        const diff = Math.ceil((new Date(t.date) - new Date()) / 86400000);
        const urgentClass = (diff <= 7 && diff >= 0) ? 'urgent' : '';
        const dayText = diff >= 0 ? `${diff} 天` : '已结束';
        list.innerHTML += `
        <div class="cd-row">
            <span class="cd-name">${escapeHtml(t.name)}</span>
            <span class="cd-days ${urgentClass}">${dayText}</span>
        </div>`;
    });
}

function renderTargetList() {
    const list = document.getElementById('targetList');
    if(!list) return;
    list.innerHTML = "";
    (appData.targets || []).forEach((t, idx) => {
        list.innerHTML += `
        <div class="target-item">
            <span>${escapeHtml(t.name)} <small>(${t.date})</small></span>
            <span class="del-target" onclick="removeTarget(${idx})">✕</span>
        </div>`;
    });
}

// --- 热力图 & 日历 ---
function renderHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    grid.innerHTML = "";
    
    const today = new Date();
    const daysToShow = 140; 
    const counts = {};
    appData.logs.forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; });

    for (let i = daysToShow; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const count = counts[dateStr] || 0;
        let level = 'heat-l0';
        if (count >= 1) level = 'heat-l1';
        if (count >= 3) level = 'heat-l2';
        if (count >= 5) level = 'heat-l3';
        if (count >= 8) level = 'heat-l4';

        const cell = document.createElement('div');
        cell.className = `heat-cell ${level}`;
        cell.title = `${dateStr}: ${count} AC`;
        grid.appendChild(cell);
    }
}

function renderCalendar() {
    const grid = document.getElementById('calGrid');
    if(!grid) return;
    grid.innerHTML = "";
    
    const now = new Date();
    const y = now.getFullYear(); 
    const m = now.getMonth();
    setContent('calTitle', `${y}年 ${m+1}月`);
    
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    
    const activeDays = {};
    appData.logs.forEach(l => activeDays[l.date] = true);
    const todayStr = getRealDate();
    let streak = 0;

    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
    for(let d=1; d<=daysInMonth; d++) {
        const dStr = String(d).padStart(2,'0');
        const mStr = String(m+1).padStart(2,'0');
        const dateStr = `${y}-${mStr}-${dStr}`;
        const el = document.createElement('div');
        el.className = `cal-cell ${activeDays[dateStr] ? 'active' : ''} ${dateStr===todayStr?'today':''}`;
        el.innerText = d;
        grid.appendChild(el);
        if(new Date(dateStr) <= now && activeDays[dateStr]) streak++;
        else if(new Date(dateStr) < now && !activeDays[dateStr]) streak = 0;
    }
    setContent('streakDays', streak);
}

// --- 战绩分析 ---
function openStatsModal() {
    openModal('statsModal');
    
    setContent('statTotal', appData.logs.length);
    setContent('statMaxStreak', getStreak(appData));
    
    const counts = {};
    let best = 0;
    appData.logs.forEach(l => {
        counts[l.date] = (counts[l.date] || 0) + 1;
        if(counts[l.date] > best) best = counts[l.date];
    });
    setContent('statBestDay', best);

    const ctxTrend = document.getElementById('trendChart');
    if(ctxTrend) {
        const labels = [];
        const data = [];
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            labels.push(d.getMonth()+1 + '-' + d.getDate());
            data.push(counts[dStr] || 0);
        }
        
        if(window.trendChartInst) window.trendChartInst.destroy();
        window.trendChartInst = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'AC 数',
                    data: data,
                    borderColor: currentTheme.p,
                    backgroundColor: currentTheme.p + '33',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { plugins: { legend: {display:false} }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }

    const ctxDist = document.getElementById('distChart');
    if(ctxDist) {
        const groups = [0,0,0,0,0];
        appData.logs.forEach(l => {
            const conf = RATINGS[l.ratingVal] || RATINGS["1200"];
            if(conf && conf.group !== undefined) groups[conf.group]++;
        });
        
        if(window.distChartInst) window.distChartInst.destroy();
        window.distChartInst = new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: ['入门', '普及', '提高', '省选', 'NOI'],
                datasets: [{
                    data: groups,
                    backgroundColor: ['#9ca3af', '#2dd4bf', '#3b82f6', '#a855f7', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: { plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } } }
        });
    }
}

// --- 辅助工具 ---
function openModal(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('show');
        if(id === 'targetModal') renderTargetList();
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if(el) el.classList.remove('show');
}

function requestDelete(type, id) {
    pendingDeleteAction = () => {
        if(type === 'todo') deleteTodo(id);
        if(type === 'log') deleteLog(id);
    };
    openModal('confirmModal');
}

function toggleTodo(id) {
    const todo = appData.todos.find(t => t.id === id);
    if(todo) { todo.done = !todo.done; saveData(); }
}

function deleteTodo(id) {
    appData.todos = appData.todos.filter(t => t.id !== id);
    saveData();
    showToast("任务已删除", "success");
}

function deleteLog(id) {
    const idx = appData.logs.findIndex(l => l.id === id);
    if(idx !== -1) {
        appData.xp = Math.max(0, appData.xp - appData.logs[idx].xp);
        appData.logs.splice(idx, 1);
        saveData();
        showToast("记录已删除", "success");
    }
}

function addTarget() {
    const name = document.getElementById('newTargetName').value;
    const date = document.getElementById('newTargetDate').value;
    if(!name || !date) return showToast("请填写完整信息", "error");
    if(!appData.targets) appData.targets = [];
    appData.targets.push({ name, date });
    saveData();
    renderTargetList();
    renderCountdowns();
    document.getElementById('newTargetName').value = "";
}

function removeTarget(idx) {
    appData.targets.splice(idx, 1);
    saveData();
    renderTargetList();
    renderCountdowns();
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    renderUI(); 
}

function changeColor(p, a) {
    currentTheme = { p, a };
    applyTheme(p, a);
    localStorage.setItem('themeColors', JSON.stringify(currentTheme));
    renderUI();
    showToast("主题已切换", "success");
}

function applyTheme(p, a) {
    const root = document.documentElement;
    root.style.setProperty('--primary', p);
    root.style.setProperty('--accent', a);
}

function updateQuote() {
    const q = QUOTES[quoteIdx];
    const elC = document.getElementById('qContent');
    const elA = document.getElementById('qAuthor');
    if(!elC) return;
    elC.style.opacity = 0;
    elA.style.opacity = 0;
    setTimeout(() => {
        elC.innerText = q.t;
        elA.innerText = `—— ${q.a}`;
        elC.style.opacity = 1;
        elA.style.opacity = 1;
    }, 300);
}

function loadData() {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            appData = { ...appData, ...parsed };
            if(!appData.targets) appData.targets = [];
            if(!appData.todos) appData.todos = [];
            if(!appData.logs) appData.logs = [];
            if(!appData.history) appData.history = [];
        }
    } catch(e) { console.error("Load Data Error"); }
}

function saveData() {
    localStorage.setItem(DB_KEY, JSON.stringify(appData));
    renderUI();
}

function loadTimer() {
    try {
        const saved = localStorage.getItem('studyTimer'); 
        const todayStr = getRealDate(); 
        if (saved) { 
            timerState = JSON.parse(saved); 
            if (timerState.date !== todayStr) { 
                timerState.totalTime = 0; 
                timerState.date = todayStr; 
                timerState.isRunning = false; 
                saveTimer(); 
            } 
        } else { timerState.date = todayStr; }
    } catch(e) {}
}

function saveTimer() { localStorage.setItem('studyTimer', JSON.stringify(timerState)); }

function toggleTimer() {
    if (timerState.isRunning) {
        timerState.totalTime += Date.now() - timerState.startTime;
        timerState.isRunning = false;
        clearInterval(timerInterval);
        saveTimer();
        updateTimerUI(false);
        updateTimerDisplay(timerState.totalTime);
    } else {
        timerState.startTime = Date.now();
        timerState.isRunning = true;
        saveTimer();
        startTimerTicker();
        updateTimerUI(true);
    }
}

function startTimerTicker() {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const currentSession = Date.now() - timerState.startTime;
        updateTimerDisplay(timerState.totalTime + currentSession);
    }, 1000);
}

function updateTimerDisplay(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    const el = document.getElementById('totalTimeDisplay');
    if(el) el.innerText = `${h}:${m}:${s}`;
}

function updateTimerUI(isRunning) {
    const btn = document.getElementById('timerBtn');
    const status = document.getElementById('timerStatus');
    if (isRunning) {
        btn.innerText = "⏸️ 暂停";
        btn.classList.remove('start'); btn.classList.add('stop');
        status.innerText = "🔥 专注中"; status.classList.remove('offline'); status.classList.add('online');
    } else {
        btn.innerText = "🚀 开始专注";
        btn.classList.remove('stop'); btn.classList.add('start');
        status.innerText = "😴 休息中"; status.classList.remove('online'); status.classList.add('offline');
    }
}

function exportData() {
    const dataStr = JSON.stringify(appData);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algo_backup_${getRealDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("存档已导出", "success");
}

function importData(input) {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            if(confirm("确定要覆盖当前记录吗？")) {
                appData = json;
                saveData();
                showToast("读档成功！", "success");
                setTimeout(()=>location.reload(), 1000);
            }
        } catch(err) { showToast("文件格式错误", "error"); }
        input.value = '';
    };
    reader.readAsText(file);
}

function fireConfetti() {
    const c = document.getElementById('confetti-canvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    let p = Array(100).fill(0).map(()=>({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, c:['#4f46e5','#db2777','#f59e0b'][Math.floor(Math.random()*3)], s:Math.random()*6+2, l:100}));
    function step() {
        ctx.clearRect(0,0,c.width,c.height);
        p.forEach((i,k)=>{ i.x+=i.vx; i.y+=i.vy; i.vy+=0.5; i.l--; if(i.y>c.height||i.l<0) p.splice(k,1); ctx.fillStyle=i.c; ctx.fillRect(i.x,i.y,i.s,i.s); });
        if(p.length) requestAnimationFrame(step);
    }
    step();
}

function escapeHtml(text) {
    if (!text) return text;
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getStreak(d) { 
    const today = getRealDate();
    let streak = 0;
    let checkDate = new Date(today);
    for(let i=0; i<365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasLog = d.logs.some(l => l.date === dateStr);
        if(hasLog) { streak++; checkDate.setDate(checkDate.getDate() - 1); } 
        else { if(i===0) { checkDate.setDate(checkDate.getDate() - 1); continue; } break; }
    }
    return streak;
}

function getTodayCount(d) {
    const today = getRealDate();
    return d.logs.filter(l => l.date === today).length;
}

function showToast(msg, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'💡'}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}
// ================= 赛博雷达：CF 官方 API 对接 =================
async function syncCodeforces() {
    // 1. 第一次用会问你账号，之后就自动记住了
    let handle = localStorage.getItem('cf_handle');
    if (!handle) {
        handle = prompt("📡 首次连接雷达，请输入你的 Codeforces ID (例如: shileye666)：");
        if (!handle) return;
        localStorage.setItem('cf_handle', handle);
    }

    showToast(`正在扫描 ${handle} 的战绩...`, "info");

    try {
        // 2. 调用 CF 官方接口，抓取你最近的 30 条提交
        const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=30`);
        const data = await res.json();

        if (data.status !== "OK") {
            return showToast("同步失败，请检查 ID 是否正确", "error");
        }

        let newAcCount = 0;
        const subs = data.result;

        // 3. 从旧到新遍历，只挑出 Accepted 的题
        for (let i = subs.length - 1; i >= 0; i--) {
            const sub = subs[i];
            if (sub.verdict === "OK") {
                const prob = sub.problem;
                const rawName = `${prob.index} - ${prob.name}`;
                
                // 🛡️ 绝对防御：防止重复添加
                const isExist = appData.logs.some(l => l.name.includes(prob.name));
                if (isExist) continue; 

                // 🧠 动态计分引擎：优先同步官方 Rating
                let rVal = "1200"; 
                let finalXp = 20;

                if (prob.rating) {
                    // 如果官方有 Rating (例如 1400)，直接作为分类
                    const r = prob.rating;
                    finalXp = Math.floor(r / 40); // 经验公式：Rating越高XP越高 (例如1600分=40XP)
                    
                    // 映射到你的雷达图分类
                    if (r >= 2200) rVal = "2200";
                    else if (r >= 2000) rVal = "2000";
                    else if (r >= 1750) rVal = "1750";
                    else if (r >= 1500) rVal = "1500";
                    else rVal = "1200";
                } else {
                    // 针对刚打完还没出 Rating 的新题 (Unrated)
                    const level = prob.index.charAt(0);
                    if (['A', 'B'].includes(level)) { rVal = "1200"; finalXp = 15; }
                    else if (level === 'C') { rVal = "1500"; finalXp = 25; }
                    else if (level === 'D') { rVal = "1750"; finalXp = 35; }
                    else { rVal = "2000"; finalXp = 45; }
                }

                // 🔗 自动生成原题传送门
                const link = `https://codeforces.com/contest/${prob.contestId}/problem/${prob.index}`;
                
                // 📅 转换时间
                const dateObj = new Date(sub.creationTimeSeconds * 1000);
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

                // 写入记录
                appData.logs.unshift({
                    id: sub.id,
                    date: dateStr,
                    name: rawName,
                    ratingVal: rVal,
                    link: link,
                    sol: "",
                    xp: finalXp
                });
                appData.xp += finalXp;
                newAcCount++;
            }
        }

        // 4. 结算收尾
        if (newAcCount > 0) {
            const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
            if (nextLv > appData.level) { appData.level = nextLv; }
            saveData();
            showToast(`🎉 雷达同步完成！自动捕获 ${newAcCount} 道新 AC`, "success");
            fireConfetti();
        } else {
            showToast("⚡ 扫描完毕，暂无遗漏的新 AC", "info");
        }

    } catch (err) {
        console.error(err);
        showToast("网络请求失败，请稍后再试", "error");
    }
}
// ================= AtCoder 官方 API 对接 =================
async function syncAtCoder() {
    let handle = localStorage.getItem('at_handle');
    if (!handle) {
        handle = prompt("🇯🇵 请输入你的 AtCoder ID：");
        if (!handle) return;
        localStorage.setItem('at_handle', handle);
    }

    showToast(`正在扫描 AtCoder: ${handle}...`, "info");

    try {
        // 使用 Kenkoooo API 抓取提交记录
        const res = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=${Math.floor(Date.now()/1000) - 86400 * 7}`);
        const data = await res.json();

        let newAcCount = 0;
        // 过滤出 Accepted (AC) 的题目
        const acSubs = data.filter(s => s.result === "AC");

        for (const sub of acSubs) {
            const isExist = appData.logs.some(l => l.name.includes(sub.problem_id));
            if (isExist) continue;

            // ABC 难度估分逻辑
            let rVal = "1200"; 
            let xp = 20;
            const probId = sub.problem_id;
            if (probId.includes('_c')) { rVal = "1500"; xp = 35; }
            else if (probId.includes('_d')) { rVal = "1750"; xp = 50; }
            else if (probId.includes('_e')) { rVal = "2000"; xp = 80; }

            const dateObj = new Date(sub.epoch_second * 1000);
            const dateStr = dateObj.toISOString().split('T')[0];

            appData.logs.unshift({
                id: `at-${sub.id}`,
                date: dateStr,
                name: `ABC - ${sub.problem_id.toUpperCase()}`,
                ratingVal: rVal,
                link: `https://atcoder.jp/contests/${sub.contest_id}/tasks/${sub.problem_id}`,
                sol: "",
                xp: xp
            });
            appData.xp += xp;
            newAcCount++;
        }

        if (newAcCount > 0) {
            saveData();
            showToast(`🎉 ABC 同步完成！新增 ${newAcCount} 条记录`, "success");
            fireConfetti();
        } else {
            showToast("🍵 AtCoder 暂无新 AC", "info");
        }
    } catch (err) {
        showToast("AtCoder API 连接超时", "error");
    }
}