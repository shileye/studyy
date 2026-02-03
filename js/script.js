// 全局错误捕获
window.onerror = function(msg, url, line) {
    console.error("Sys Error:", msg);
    return false;
};

// ★★★ 恢复数据 Key ★★★
const DB_KEY = "algo_v7_cow"; 

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
    {t:"种一棵树最好的时间是十年前，其次是现在。", a:"Dambisa Moyo"}
];

const BADGES = [
    { id: "b1", icon: "🌱", title: "初出茅庐", check: (d) => d.logs.length >= 1 },
    { id: "b2", icon: "🔥", title: "持之以恒", check: (d) => getStreak(d) >= 3 },
    { id: "b3", icon: "🦁", title: "毅力帝", check: (d) => getStreak(d) >= 7 },
    { id: "b4", icon: "⚡", title: "肝帝", check: (d) => getTodayCount(d) >= 5 },
    { id: "b5", icon: "⚔️", title: "挑战者", check: (d) => d.maxRating >= 1600 },
    { id: "b6", icon: "👑", title: "大师", check: (d) => d.maxRating >= 1900 },
    { id: "b7", icon: "👽", title: "传说", check: (d) => d.maxRating >= 2100 },
    { id: "b8", icon: "💯", title: "百题斩", check: (d) => d.logs.length >= 100 }
];

let appData = { xp: 0, level: 1, maxRating: 0, todos: [], logs: [], targets: [], history: [] };
let timerState = { isRunning: false, startTime: 0, totalTime: 0, date: "" };
let timerInterval = null;
let quoteIdx = 0;
let currentTheme = { p: '#4f46e5', a: '#db2777' };
let pendingDeleteAction = null; // 用于存储待执行的删除操作

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
        
        // 实时时钟
        setInterval(() => {
            const now = new Date();
            const timeStr = now.getFullYear() + "-" + 
                String(now.getMonth()+1).padStart(2,'0') + "-" + 
                String(now.getDate()).padStart(2,'0') + " " + 
                String(now.getHours()).padStart(2,'0') + ":" + 
                String(now.getMinutes()).padStart(2,'0');
            const el = document.getElementById('currentDateDisplay');
            if(el) el.innerText = timeStr;
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

        // 绑定删除弹窗的确认按钮
        document.getElementById('confirmDeleteBtn').onclick = () => {
            if (pendingDeleteAction) pendingDeleteAction();
            closeModal('confirmModal');
        };

    } catch(e) { console.error("Init Error:", e); }
};

// --- 时间核心 ---
function getRealDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTaskTargetDate() {
    const now = new Date();
    const limit = new Date();
    limit.setHours(23, 30, 0, 0); // 23:30 自动分界

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
        showToast("📅 昨日任务已结算入库", "info");
    }
}

// --- 任务联动核心逻辑 ---
function addTodo() {
    const text = document.getElementById('todoInput').value;
    const type = document.getElementById('todoType').value;
    if(!text) return showToast("请输入任务内容", "error");

    const targetDate = getTaskTargetDate(); 
    const isTomorrow = targetDate !== getRealDate();
    const displayPrefix = isTomorrow ? "[明日] " : "";
    
    let icon = "📖";
    if(type === '赛') icon = "🏆";
    if(type === '学') icon = "🧠";

    appData.todos.push({
        id: Date.now(),
        text: `${displayPrefix}${icon} ${text}`,
        rawText: text, // 保留原始文本方便填充
        date: targetDate,
        done: false,
        type: type
    });
    
    document.getElementById('todoInput').value = '';
    saveData();
    
    if(isTomorrow) {
        showToast("已加入明日计划 (23:30后算明天)", "success");
    }
}

// ★★★ 联动跳转：点击任务 -> 填充提交区 ★★★
function scrollToCommit(text, id) {
    // 去掉前缀图标和标记，只保留题目名
    const cleanText = text.replace(/^(\[明日\] )?([📖🏆🧠] )?/, '');
    
    document.getElementById('probName').value = cleanText;
    document.getElementById('linkedTaskId').value = id; // 记住这个任务ID
    
    // 滚动并高亮
    const section = document.getElementById('submitSection');
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    section.classList.add('highlight-pulse');
    setTimeout(() => section.classList.remove('highlight-pulse'), 2000);
    
    document.getElementById('probName').focus();
    showToast("已准备提交，AC后自动完成任务", "info");
}

function submitAC() {
    const name = document.getElementById('probName').value;
    const rVal = document.getElementById('ratingSelect').value;
    const probLink = document.getElementById('probLink').value;
    const solLink = document.getElementById('solLink').value;
    const linkedId = document.getElementById('linkedTaskId').value;

    if(!name || !rVal) return showToast("请填写完整信息", "error");

    const conf = RATINGS[rVal];
    if(parseInt(rVal)) appData.maxRating = Math.max(appData.maxRating, parseInt(rVal));

    // 1. 尝试完成联动任务
    if (linkedId) {
        const linkedTask = appData.todos.find(t => t.id == linkedId);
        if (linkedTask) linkedTask.done = true;
    } 
    // 2. 备用逻辑：如果是手动输入的，尝试匹配同名任务
    else {
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

    // 清理表单
    document.getElementById('probName').value = '';
    document.getElementById('probLink').value = '';
    document.getElementById('solLink').value = '';
    document.getElementById('linkedTaskId').value = ''; // 清除联动状态
    
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
        let validKey = "1200"; let name = "";

        if (match) {
            const num = parseInt(match[1]);
            name = match[2];
            if (num >= 2200) validKey = "2200";
            else if (num >= 2000) validKey = "2000";
            else if (num >= 1750) validKey = "1750";
            else if (num >= 1500) validKey = "1500";
            else validKey = "1200";
            appData.maxRating = Math.max(appData.maxRating, num);
        } else {
            const charMatch = line.match(/^([红橙黄绿蓝紫黑])\s+(.+)$/);
            if (charMatch) {
                const colorMap = {'红':'luogu_red', '橙':'luogu_orange', '黄':'luogu_yellow', '绿':'luogu_green', '蓝':'luogu_blue', '紫':'luogu_purple', '黑':'luogu_black'};
                validKey = colorMap[charMatch[1]] || "1200";
                name = charMatch[2];
            } else { continue; }
        }

        const config = RATINGS[validKey];
        appData.logs.unshift({
            id: Date.now() + i, 
            date: getRealDate(),
            name: name, ratingVal: validKey,
            link: "", sol: "", xp: config.xp
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
        showToast(`⚡ 成功导入 ${count} 题！`, "success");
        fireConfetti();
    } else { showToast("格式错误", "error"); }
}

// --- 渲染逻辑 ---
function renderUI() {
    document.getElementById('lvNum').innerText = appData.level;
    document.getElementById('curXP').innerText = appData.xp;
    const nextXP = 50 * Math.pow(appData.level, 2);
    document.getElementById('nextXP').innerText = nextXP;
    const prevXP = 50 * Math.pow(appData.level - 1, 2);
    const pct = ((appData.xp - prevXP) / (nextXP - prevXP)) * 100;
    document.getElementById('xpFill').style.width = `${Math.max(0, Math.min(pct, 100))}%`;
    document.getElementById('totalAC').innerText = appData.logs.length;

    renderBadges();
    renderChart();
    renderTodos();
    renderHistory();
    renderLogs();
    renderCalendar();
    renderCountdowns();
}

function renderTodos() {
    const todayStr = getRealDate();
    const list = document.getElementById('todoList');
    list.innerHTML = "";
    
    const activeTodos = appData.todos.filter(t => t.date >= todayStr);
    
    const todayOnlyTodos = appData.todos.filter(t => t.date === todayStr);
    const doneCount = todayOnlyTodos.filter(t => t.done).length;
    const progress = todayOnlyTodos.length ? Math.round((doneCount/todayOnlyTodos.length)*100) : 0;
    
    document.getElementById('dailyProgress').style.width = `${progress}%`;
    document.getElementById('progressText').innerText = `${progress}%`;
    if(progress === 100 && todayOnlyTodos.length > 0) document.getElementById('dailyProgress').style.backgroundColor = "#10b981";
    else document.getElementById('dailyProgress').style.backgroundColor = currentTheme.p;

    if(activeTodos.length === 0) list.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:20px;">今日任务已清空 / 尚未添加</div>`;
    
    activeTodos.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.done - b.done;
    });

    activeTodos.forEach(t => {
        list.innerHTML += `
        <div class="todo-item ${t.done?'done':''} ${t.type==='赛'?'type-race':''}">
            <div style="flex:1; cursor:pointer;" onclick="toggleTodo(${t.id})">${escapeHtml(t.text)}</div>
            ${!t.done ? `<button class="btn-go-ac" onclick="scrollToCommit('${escapeHtml(t.rawText)}', ${t.id})">🚀 去 AC</button>` : ''}
            <span class="btn-del" onclick="requestDelete('todo', ${t.id})">✕</span>
        </div>`;
    });
}

function renderHistory() {
    const histList = document.getElementById('historyList');
    histList.innerHTML = "";
    if(appData.history.length === 0) {
        histList.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无历史数据</div>`;
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
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const logBox = document.getElementById('logList');
    logBox.innerHTML = '';
    const filteredLogs = appData.logs.filter(l => l.name.toLowerCase().includes(searchText));
    
    if(filteredLogs.length === 0 && !searchText) {
        logBox.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无刷题记录</div>`;
        return;
    }

    filteredLogs.slice(0, 30).forEach(l => {
        const conf = RATINGS[l.ratingVal] || RATINGS["1200"];
        const div = document.createElement('div');
        div.className = 'log-card';
        div.style.borderLeftColor = conf.color;
        
        let links = '';
        if(l.link) links += `<a href="${escapeHtml(l.link)}" target="_blank" class="link-btn link-prob">📄 原题</a>`;
        if(l.sol) links += `<a href="${escapeHtml(l.sol)}" target="_blank" class="link-btn link-sol">📝 题解/代码</a>`;

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

function renderCalendar() {
    const grid = document.getElementById('calGrid');
    if(!grid) return;
    grid.innerHTML = "";
    const now = new Date();
    const y = now.getFullYear(); const m = now.getMonth();
    document.getElementById('calTitle').innerText = `${y}年 ${m+1}月`;
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
    document.getElementById('streakDays').innerText = streak;
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

function renderBadges() {
    const badgeBox = document.getElementById('badgeGrid');
    badgeBox.innerHTML = '';
    BADGES.forEach(b => {
        const unlocked = b.check(appData);
        badgeBox.innerHTML += `<div class="badge ${unlocked?'unlocked':''}" data-title="${b.title}">${b.icon}</div>`;
    });
}

function renderCountdowns() {
    const container = document.getElementById('countdownList');
    if(!container) return;
    container.innerHTML = "";
    const targets = appData.targets || [];
    if (targets.length === 0) { 
        container.innerHTML = "<div style='text-align:center; color:#999; font-size:0.8rem;'>暂无比赛日程</div>"; 
        return; 
    }
    targets.forEach((t, idx) => {
        const targetDate = new Date(t.date);
        const now = new Date();
        const diff = Math.ceil((targetDate - now) / 86400000);
        const urgentClass = (diff <= 7 && diff >= 0) ? 'urgent' : '';
        const dayText = diff >= 0 ? `${diff} 天` : '已结束';
        container.innerHTML += `
        <div class="cd-row">
            <span class="cd-name">${escapeHtml(t.name)}</span>
            <span class="cd-days ${urgentClass}">${dayText}</span>
        </div>`;
    });
}

function renderTargetList() {
    const list = document.getElementById('targetList');
    list.innerHTML = "";
    (appData.targets || []).forEach((t, idx) => {
        list.innerHTML += `
        <div class="target-item">
            <span>${escapeHtml(t.name)} <small>(${t.date})</small></span>
            <span class="del-target" onclick="removeTarget(${idx})">✕</span>
        </div>`;
    });
}

// --- 辅助工具 (弹窗、删除、主题等) ---

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

// 优雅删除：请求删除 -> 弹出确认框
function requestDelete(type, id) {
    // 存储这个操作，等弹窗确认后再执行
    pendingDeleteAction = () => {
        if(type === 'todo') deleteTodo(id);
        if(type === 'log') deleteLog(id);
    };
    openModal('confirmModal');
}

function toggleTodo(id) {
    const todo = appData.todos.find(t => t.id === id);
    if(todo) {
        todo.done = !todo.done;
        saveData();
    }
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
    elC.style.opacity = 0; elA.style.opacity = 0;
    setTimeout(() => {
        elC.innerText = q.t;
        elA.innerText = `—— ${q.a}`;
        elC.style.opacity = 1; elA.style.opacity = 1;
    }, 300);
}

function loadData() {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            appData = { ...appData, ...parsed };
            // 兼容性检查
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
        // 停止
        timerState.totalTime += Date.now() - timerState.startTime;
        timerState.isRunning = false;
        clearInterval(timerInterval);
        saveTimer();
        updateTimerUI(false);
        updateTimerDisplay(timerState.totalTime);
    } else {
        // 开始
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
        btn.innerText = "⏸️ 暂停 (Clock Out)";
        btn.classList.remove('start'); btn.classList.add('stop');
        status.innerText = "🔥 专注中"; status.classList.remove('offline'); status.classList.add('online');
    } else {
        btn.innerText = "🚀 开始专注 (Clock In)";
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
            if(confirm("确定要覆盖当前记录吗？此操作不可撤销。")) {
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

function generateAIPrompt() {
    const today = getRealDate();
    const logs = appData.logs.filter(l => l.date === today);
    if (logs.length === 0) return showToast("今天没做题", "info");
    const list = logs.map(l => `- ${l.name} (${RATINGS[l.ratingVal].label})`).join('\n');
    const prompt = `我今天练习了算法，做了以下题目：\n${list}\n请帮我复盘今天的学习情况。`;
    navigator.clipboard.writeText(prompt).then(() => showToast("AI 提示词已复制", "success"));
}

function copyReport() {
    const today = getRealDate();
    const logs = appData.logs.filter(l => l.date === today);
    if(logs.length === 0) return showToast("今天无记录", "error");
    const list = logs.map(l => `✅ [${RATINGS[l.ratingVal].label}] ${l.name}`).join('\n');
    navigator.clipboard.writeText(`📅 ${today} 打卡\n${list}`).then(() => showToast("战报已复制", "success"));
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