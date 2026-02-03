// 全局错误捕获
window.onerror = function(msg, url, line) { console.error("Sys Error:", msg); return false; };

const DB_KEY = "algo_v12_clean"; 

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

// --- 语录库 (扩充至 30 条) ---
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

let appData = { xp: 0, level: 1, maxRating: 0, todos: [], logs: [], targets: [], history: [] };
let timerState = { isRunning: false, startTime: 0, totalTime: 0, date: "" };
let timerInterval = null;
let quoteIdx = 0;
let currentTheme = { p: '#4f46e5', a: '#db2777' };
let pendingDeleteAction = null; 

function setContent(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
function setStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; }

window.onload = () => {
    try {
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
        try { const savedColors = localStorage.getItem('themeColors'); if(savedColors) { currentTheme = JSON.parse(savedColors); applyTheme(currentTheme.p, currentTheme.a); } } catch(e) {}

        loadData(); loadTimer(); checkDailySettlement(); renderUI();
        
        setInterval(() => {
            const now = new Date();
            const timeStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,'0') + "-" + String(now.getDate()).padStart(2,'0') + " " + String(now.getHours()).padStart(2,'0') + ":" + String(now.getMinutes()).padStart(2,'0');
            setContent('currentDateDisplay', timeStr);
        }, 1000);

        setInterval(checkDailySettlement, 60000); 
        updateQuote();
        setInterval(() => { quoteIdx = (quoteIdx + 1) % QUOTES.length; updateQuote(); }, 30000); // 30秒换一次语录

        if(timerState.isRunning) { startTimerTicker(); updateTimerUI(true); } else { updateTimerDisplay(timerState.totalTime); }

        const delBtn = document.getElementById('confirmDeleteBtn');
        if(delBtn) { delBtn.onclick = () => { if(pendingDeleteAction) pendingDeleteAction(); closeModal('confirmModal'); }; }

    } catch(e) { console.error("Init Error:", e); }
};

function getRealDate() {
    const now = new Date();
    const y = now.getFullYear(); const m = String(now.getMonth() + 1).padStart(2, '0'); const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getTaskTargetDate() {
    const now = new Date(); const limit = new Date(); limit.setHours(23, 30, 0, 0);
    if (now > limit) { const t = new Date(now); t.setDate(t.getDate() + 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }
    return getRealDate();
}

function checkDailySettlement() {
    const today = getRealDate(); const pastTodos = appData.todos.filter(t => t.date < today);
    if (pastTodos.length > 0) {
        const groups = {};
        pastTodos.forEach(t => { if(!groups[t.date]) groups[t.date] = { total:0, done:0 }; groups[t.date].total++; if(t.done) groups[t.date].done++; });
        for(let date in groups) { if (!appData.history.find(h => h.date === date)) { const rec = groups[date]; const pct = rec.total === 0 ? 0 : Math.round((rec.done / rec.total) * 100); appData.history.unshift({ date, ...rec, pct }); } }
        appData.todos = appData.todos.filter(t => t.date >= today); saveData(); renderUI(); showToast("📅 昨日任务已结算", "info");
    }
}

function addTodo() {
    const text = document.getElementById('todoInput').value; const type = document.getElementById('todoType').value;
    if(!text) return showToast("请输入内容", "error");
    const targetDate = getTaskTargetDate(); const isTomorrow = targetDate !== getRealDate();
    let icon = "📖"; if(type === '赛') icon = "🏆"; if(type === '学') icon = "🧠";
    appData.todos.push({ id: Date.now(), text: `${isTomorrow ? "[明日] " : ""}${icon} ${text}`, rawText: text, date: targetDate, done: false, type: type });
    document.getElementById('todoInput').value = ''; saveData();
    if(isTomorrow) showToast("已加入明日计划", "success");
}

function scrollToCommit(text, id) {
    const section = document.getElementById('submitSection');
    if(section) { section.scrollIntoView({ behavior: 'smooth', block: 'center' }); section.classList.add('highlight-pulse'); setTimeout(() => section.classList.remove('highlight-pulse'), 1500); }
    const nameInput = document.getElementById('probName'); if(nameInput) { nameInput.value = text || ""; nameInput.focus(); }
    const hiddenId = document.getElementById('linkedTaskId'); if(hiddenId) hiddenId.value = id; 
    showToast("AC后自动完成任务", "info");
}

function submitAC() {
    const name = document.getElementById('probName').value; const rVal = document.getElementById('ratingSelect').value;
    const probLink = document.getElementById('probLink').value; const solLink = document.getElementById('solLink').value;
    const linkedId = document.getElementById('linkedTaskId').value;
    if(!name || !rVal) return showToast("请填写完整", "error");
    const conf = RATINGS[rVal]; if(parseInt(rVal)) appData.maxRating = Math.max(appData.maxRating, parseInt(rVal));
    if (linkedId) { const task = appData.todos.find(t => t.id == linkedId); if(task) task.done = true; } else { const match = appData.todos.find(t => t.text.includes(name) && !t.done); if(match) match.done = true; }
    appData.logs.unshift({ id: Date.now(), date: getRealDate(), name, ratingVal: rVal, link: probLink, sol: solLink, xp: conf.xp });
    appData.xp += conf.xp;
    const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1; if(nextLv > appData.level) { appData.level = nextLv; showToast(`🎉 升级啦 LV.${nextLv}`, "success"); }
    document.getElementById('probName').value = ''; document.getElementById('probLink').value = ''; document.getElementById('solLink').value = ''; document.getElementById('linkedTaskId').value = '';
    saveData(); openModal('acModal'); fireConfetti();
}

function processBatch() {
    const text = document.getElementById('batchInput').value; if (!text.trim()) return showToast("请输入内容", "error");
    const lines = text.split('\n'); let count = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim(); if (!line) continue;
        let match = line.match(/^(\d+)\s+(.+)$/); let validKey = "1200"; let name = "";
        if (match) { const num = parseInt(match[1]); name = match[2]; if (num >= 2200) validKey = "2200"; else if (num >= 2000) validKey = "2000"; else if (num >= 1750) validKey = "1750"; else if (num >= 1500) validKey = "1500"; else validKey = "1200"; appData.maxRating = Math.max(appData.maxRating, num); }
        else { const charMatch = line.match(/^([红橙黄绿蓝紫黑])\s+(.+)$/); if (charMatch) { const colorMap = {'红':'luogu_red', '橙':'luogu_orange', '黄':'luogu_yellow', '绿':'luogu_green', '蓝':'luogu_blue', '紫':'luogu_purple', '黑':'luogu_black'}; validKey = colorMap[charMatch[1]] || "1200"; name = charMatch[2]; } else { continue; } }
        const config = RATINGS[validKey]; appData.logs.unshift({ id: Date.now() + i, date: getRealDate(), name: name, ratingVal: validKey, link: "", sol: "", xp: config.xp });
        appData.xp += config.xp; count++;
    }
    if (count > 0) { const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1; if (nextLv > appData.level) { appData.level = nextLv; } saveData(); closeModal('batchModal'); document.getElementById('batchInput').value = ""; showToast(`⚡ 导入 ${count} 题`, "success"); fireConfetti(); } else { showToast("格式错误", "error"); }
}

function renderUI() {
    setContent('lvNum', appData.level); setContent('curXP', appData.xp);
    const nextXP = 50 * Math.pow(appData.level, 2); setContent('nextXP', nextXP);
    const prevXP = 50 * Math.pow(appData.level - 1, 2); const pct = ((appData.xp - prevXP) / (nextXP - prevXP)) * 100;
    setStyle('xpFill', 'width', `${Math.max(0, Math.min(pct, 100))}%`); setContent('totalAC', appData.logs.length);
    renderChart(); renderTodos(); renderHistory(); renderLogs(); renderCalendar(); renderCountdowns();
}

function renderTodos() {
    const todayStr = getRealDate(); const list = document.getElementById('todoList'); if(!list) return; list.innerHTML = "";
    const activeTodos = appData.todos.filter(t => t.date >= todayStr);
    const todayOnly = appData.todos.filter(t => t.date === todayStr); const doneCount = todayOnly.filter(t => t.done).length; const progress = todayOnly.length ? Math.round((doneCount/todayOnly.length)*100) : 0;
    setStyle('dailyProgress', 'width', `${progress}%`); setContent('progressText', `${progress}%`);
    const bar = document.getElementById('dailyProgress'); if(bar) { if(progress === 100 && todayOnly.length > 0) bar.style.backgroundColor = "#10b981"; else bar.style.backgroundColor = currentTheme.p; }
    if(activeTodos.length === 0) list.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:20px;">今日无任务</div>`;
    activeTodos.sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.done - b.done; });
    activeTodos.forEach(t => {
        const goBtn = !t.done ? `<button class="btn-go-ac" onclick="scrollToCommit('${escapeHtml(t.rawText)}', ${t.id})">🚀</button>` : '';
        list.innerHTML += `<div class="todo-item ${t.done?'done':''} ${t.type==='赛'?'type-race':''}"> <div style="flex:1; cursor:pointer;" onclick="toggleTodo(${t.id})">${escapeHtml(t.text)}</div> ${goBtn} <span class="btn-del" onclick="requestDelete('todo', ${t.id})">✕</span> </div>`;
    });
}

function renderHistory() {
    const histList = document.getElementById('historyList'); if(!histList) return; histList.innerHTML = "";
    if(appData.history.length === 0) { histList.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无历史</div>`; return; }
    appData.history.slice(0, 7).forEach(h => { histList.innerHTML += `<div class="history-item"> <span>${h.date}</span> <span>完成度: <b style="color:${h.pct>=80?'#10b981':'#64748b'}">${h.pct}%</b> (${h.done}/${h.total})</span> </div>`; });
}

function renderLogs() {
    const searchInput = document.getElementById('searchInput'); const searchText = searchInput ? searchInput.value.toLowerCase() : "";
    const logBox = document.getElementById('logList'); if(!logBox) return; logBox.innerHTML = '';
    const filteredLogs = appData.logs.filter(l => l.name.toLowerCase().includes(searchText));
    if(filteredLogs.length === 0 && !searchText) { logBox.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无记录</div>`; return; }
    filteredLogs.slice(0, 30).forEach(l => {
        const conf = RATINGS[l.ratingVal] || RATINGS["1200"];
        let links = ''; if(l.link) links += `<a href="${escapeHtml(l.link)}" target="_blank" class="link-btn link-prob">📄 原题</a>`; if(l.sol) links += `<a href="${escapeHtml(l.sol)}" target="_blank" class="link-btn link-sol">📝 代码</a>`;
        const div = document.createElement('div'); div.className = 'log-card'; div.style.borderLeftColor = conf.color;
        div.innerHTML = `<div style="flex:1"> <div style="font-weight:bold;display:flex;align-items:center;flex-wrap:wrap;"> <span class="rating-tag" style="background:${conf.color}">${conf.label}</span>${escapeHtml(l.name)} </div> <div style="font-size:0.8rem;color:var(--text-light);margin-top:5px;">${l.date} · +${l.xp} XP</div> </div> <div style="display:flex;align-items:center;"> ${links} <div class="btn-del" onclick="requestDelete('log', ${l.id})">✕</div> </div>`;
        logBox.appendChild(div);
    });
}

function renderCalendar() {
    const grid = document.getElementById('calGrid'); if(!grid) return; grid.innerHTML = "";
    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth(); setContent('calTitle', `${y}年 ${m+1}月`);
    const firstDay = new Date(y, m, 1).getDay(); const daysInMonth = new Date(y, m+1, 0).getDate();
    const activeDays = {}; appData.logs.forEach(l => activeDays[l.date] = true); const todayStr = getRealDate(); let streak = 0;
    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
    for(let d=1; d<=daysInMonth; d++) {
        const dStr = String(d).padStart(2,'0'); const mStr = String(m+1).padStart(2,'0'); const dateStr = `${y}-${mStr}-${dStr}`;
        const el = document.createElement('div'); el.className = `cal-cell ${activeDays[dateStr] ? 'active' : ''} ${dateStr===todayStr?'today':''}`; el.innerText = d; grid.appendChild(el);
        if(new Date(dateStr) <= now && activeDays[dateStr]) streak++; else if(new Date(dateStr) < now && !activeDays[dateStr]) streak = 0;
    }
    setContent('streakDays', streak);
}

function renderChart() {
    const ctx = document.getElementById('radarChart'); if (ctx && window.Chart) {
        const groupStats = [0, 0, 0, 0, 0]; appData.logs.forEach(l => { const conf = RATINGS[l.ratingVal] || RATINGS["1200"]; if (conf) groupStats[conf.group]++; });
        if (window.myRadarChart) window.myRadarChart.destroy();
        const isDark = document.body.classList.contains('dark'); const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; const textColor = isDark ? '#94a3b8' : '#64748b'; const themeColor = currentTheme.p;
        window.myRadarChart = new Chart(ctx, { type: 'radar', data: { labels: ['入门', '普及', '提高', '省选', 'NOI'], datasets: [{ label: 'AC', data: groupStats, backgroundColor: themeColor + '33', borderColor: themeColor, pointBackgroundColor: currentTheme.a, pointBorderColor: '#fff', borderWidth: 2 }] }, options: { maintainAspectRatio: false, scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: textColor, font: { size: 10, family: 'JetBrains Mono' } }, ticks: { display: false, backdropColor: 'transparent' } } }, plugins: { legend: { display: false } } } });
    }
}

function renderCountdowns() {
    const list = document.getElementById('countdownList'); if(!list) return; list.innerHTML = "";
    if (!appData.targets || appData.targets.length === 0) { list.innerHTML = "<div style='text-align:center; color:#999; font-size:0.8rem;'>暂无比赛日程</div>"; return; }
    appData.targets.forEach((t) => {
        const diff = Math.ceil((new Date(t.date) - new Date()) / 86400000); const urgentClass = (diff <= 7 && diff >= 0) ? 'urgent' : ''; const dayText = diff >= 0 ? `${diff} 天` : '已结束';
        list.innerHTML += `<div class="cd-row"> <span class="cd-name">${escapeHtml(t.name)}</span> <span class="cd-days ${urgentClass}">${dayText}</span> </div>`;
    });
}

function renderTargetList() {
    const list = document.getElementById('targetList'); if(!list) return; list.innerHTML = "";
    (appData.targets || []).forEach((t, idx) => { list.innerHTML += `<div class="target-item"> <span>${escapeHtml(t.name)} <small>(${t.date})</small></span> <span class="del-target" onclick="removeTarget(${idx})">✕</span> </div>`; });
}

// --- Tools ---
function openModal(id) { const el = document.getElementById(id); if(el) { el.classList.add('show'); if(id === 'targetModal') renderTargetList(); } }
function closeModal(id) { const el = document.getElementById(id); if(el) el.classList.remove('show'); }
function requestDelete(type, id) { pendingDeleteAction = () => { if(type === 'todo') deleteTodo(id); if(type === 'log') deleteLog(id); }; openModal('confirmModal'); }
function toggleTodo(id) { const todo = appData.todos.find(t => t.id === id); if(todo) { todo.done = !todo.done; saveData(); } }
function deleteTodo(id) { appData.todos = appData.todos.filter(t => t.id !== id); saveData(); showToast("任务已删除", "success"); }
function deleteLog(id) { const idx = appData.logs.findIndex(l => l.id === id); if(idx !== -1) { appData.xp = Math.max(0, appData.xp - appData.logs[idx].xp); appData.logs.splice(idx, 1); saveData(); showToast("记录已删除", "success"); } }
function addTarget() { const name = document.getElementById('newTargetName').value; const date = document.getElementById('newTargetDate').value; if(!name || !date) return showToast("请填写完整", "error"); if(!appData.targets) appData.targets = []; appData.targets.push({ name, date }); saveData(); renderTargetList(); renderCountdowns(); document.getElementById('newTargetName').value = ""; }
function removeTarget(idx) { appData.targets.splice(idx, 1); saveData(); renderTargetList(); renderCountdowns(); }
function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light'); renderUI(); }
function changeColor(p, a) { currentTheme = { p, a }; applyTheme(p, a); localStorage.setItem('themeColors', JSON.stringify(currentTheme)); renderUI(); showToast("主题已切换", "success"); }
function applyTheme(p, a) { const root = document.documentElement; root.style.setProperty('--primary', p); root.style.setProperty('--accent', a); }
function updateQuote() { const q = QUOTES[quoteIdx]; const elC = document.getElementById('qContent'); const elA = document.getElementById('qAuthor'); if(!elC) return; elC.style.opacity = 0; elA.style.opacity = 0; setTimeout(() => { elC.innerText = q.t; elA.innerText = `—— ${q.a}`; elC.style.opacity = 1; elA.style.opacity = 1; }, 300); }
function loadData() { try { const saved = localStorage.getItem(DB_KEY); if (saved) { const parsed = JSON.parse(saved); appData = { ...appData, ...parsed }; if(!appData.targets) appData.targets = []; if(!appData.todos) appData.todos = []; if(!appData.logs) appData.logs = []; if(!appData.history) appData.history = []; } } catch(e) { console.error("Load Data Error"); } }
function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); renderUI(); }
function loadTimer() { try { const saved = localStorage.getItem('studyTimer'); const todayStr = getRealDate(); if (saved) { timerState = JSON.parse(saved); if (timerState.date !== todayStr) { timerState.totalTime = 0; timerState.date = todayStr; timerState.isRunning = false; saveTimer(); } } else { timerState.date = todayStr; } } catch(e) {} }
function saveTimer() { localStorage.setItem('studyTimer', JSON.stringify(timerState)); }
function toggleTimer() { if (timerState.isRunning) { timerState.totalTime += Date.now() - timerState.startTime; timerState.isRunning = false; clearInterval(timerInterval); saveTimer(); updateTimerUI(false); updateTimerDisplay(timerState.totalTime); } else { timerState.startTime = Date.now(); timerState.isRunning = true; saveTimer(); startTimerTicker(); updateTimerUI(true); } }
function startTimerTicker() { if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { const currentSession = Date.now() - timerState.startTime; updateTimerDisplay(timerState.totalTime + currentSession); }, 1000); }
function updateTimerDisplay(ms) { const totalSeconds = Math.floor(ms / 1000); const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0'); const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'); const s = String(totalSeconds % 60).padStart(2, '0'); const el = document.getElementById('totalTimeDisplay'); if(el) el.innerText = `${h}:${m}:${s}`; }
function updateTimerUI(isRunning) { const btn = document.getElementById('timerBtn'); const status = document.getElementById('timerStatus'); if (isRunning) { btn.innerText = "⏸️ 暂停"; btn.classList.remove('start'); btn.classList.add('stop'); status.innerText = "🔥 专注中"; status.classList.remove('offline'); status.classList.add('online'); } else { btn.innerText = "🚀 开始专注"; btn.classList.remove('stop'); btn.classList.add('start'); status.innerText = "😴 休息中"; status.classList.remove('online'); status.classList.add('offline'); } }
function exportData() { const dataStr = JSON.stringify(appData); const blob = new Blob([dataStr], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `algo_backup_${getRealDate()}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); showToast("存档已导出", "success"); }
function importData(input) { const file = input.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const json = JSON.parse(e.target.result); if(confirm("确定覆盖吗？")) { appData = json; saveData(); showToast("读档成功！", "success"); setTimeout(()=>location.reload(), 1000); } } catch(err) { showToast("文件格式错误", "error"); } input.value = ''; }; reader.readAsText(file); }
function fireConfetti() { const c = document.getElementById('confetti-canvas'); if(!c) return; const ctx = c.getContext('2d'); c.width = window.innerWidth; c.height = window.innerHeight; let p = Array(100).fill(0).map(()=>({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, c:['#4f46e5','#db2777','#f59e0b'][Math.floor(Math.random()*3)], s:Math.random()*6+2, l:100})); function step() { ctx.clearRect(0,0,c.width,c.height); p.forEach((i,k)=>{ i.x+=i.vx; i.y+=i.vy; i.vy+=0.5; i.l--; if(i.y>c.height||i.l<0) p.splice(k,1); ctx.fillStyle=i.c; ctx.fillRect(i.x,i.y,i.s,i.s); }); if(p.length) requestAnimationFrame(step); } step(); }
function escapeHtml(text) { if (!text) return text; return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function getStreak(d) { const today = getRealDate(); let streak = 0; let checkDate = new Date(today); for(let i=0; i<365; i++) { const dateStr = checkDate.toISOString().split('T')[0]; const hasLog = d.logs.some(l => l.date === dateStr); if(hasLog) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else { if(i===0) { checkDate.setDate(checkDate.getDate() - 1); continue; } break; } } return streak; }
function getTodayCount(d) { const today = getRealDate(); return d.logs.filter(l => l.date === today).length; }
function showToast(msg, type = 'info') { let container = document.querySelector('.toast-container'); if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); } const el = document.createElement('div'); el.className = `toast ${type}`; el.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'💡'}</span><span>${msg}</span>`; container.appendChild(el); setTimeout(() => { el.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => el.remove(), 300); }, 3000); }