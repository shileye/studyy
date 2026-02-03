const DB_KEY = "algo_v7_cow"; // 保持 Key 不变，尝试找回数据

// ★★★ 23点结算逻辑 ★★★
function getLogicalDate() {
    const now = new Date();
    // 如果当前时间 >= 23点，算作"明天"
    if (now.getHours() >= 23) {
        now.setDate(now.getDate() + 1);
    }
    return now.toISOString().split('T')[0];
}

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
    "luogu_black":  { color: "#0E1D69", label: "NOI/NOI+", xp: 120, group: 4 }
};

const QUOTES = [
    {t:"十年生死两茫茫，不思量，自难忘。", a:"苏轼"}, {t:"欲买桂花同载酒，终不似，少年游。", a:"刘过"},
    {t:"Talk is cheap. Show me the code.", a:"Linus"}, {t:"菜是原罪，练是救赎。", a:"小羊肖恩"},
    {t:"为了看一眼山顶的风景，我愿意流干汗水。", a:"攀登者"}
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

let appData = { xp: 0, level: 1, maxRating: 0, todos: [], logs: [], targets: [] };
let quoteIdx = 0;
let currentTheme = { p: '#4f46e5', a: '#db2777' };
let timerInterval = null;
let timerState = { isRunning: false, startTime: 0, totalTime: 0, lastDate: "" };

// ★★★ 修复：Loading 卡死问题，加 try-catch 保护 ★★★
window.onload = () => {
    try {
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
        const savedColors = localStorage.getItem('themeColors');
        if(savedColors) {
            currentTheme = JSON.parse(savedColors);
            applyTheme(currentTheme.p, currentTheme.a);
        }

        loadData();
        loadTimer();
        
        // 显示逻辑日
        document.getElementById('logicalDateDisplay').innerText = `当前逻辑日: ${getLogicalDate()}`;

        renderUI();
        renderCountdowns();
        updateQuote();
        
        setInterval(() => { quoteIdx = (quoteIdx + 1) % QUOTES.length; updateQuote(); }, 30000);
        setInterval(renderCountdowns, 60000);
        
        if(timerState.isRunning) {
            startTimerTicker();
            updateTimerUI(true);
        } else {
            updateTimerDisplay(timerState.totalTime);
        }
    } catch(e) {
        console.error("Init Error:", e);
        showToast("初始化出错，请尝试清除缓存", "error");
    }
};

// --- 数据加载 (修复数据丢失风险) ---
function loadData() {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            appData = JSON.parse(saved);
            // 兼容性修补：防止旧数据缺少字段导致报错
            if(!appData.targets) appData.targets = [];
            if(!appData.todos) appData.todos = [];
            if(!appData.logs) appData.logs = [];
        }
    } catch(e) {
        console.error("Data Load Error");
    }
}
function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); renderUI(); }

// --- 倒计时逻辑 ---
function getTargets() { return appData.targets || []; }
function openTargetModal() { document.getElementById('targetModal').classList.add('show'); renderTargetList(); }
function closeTargetModal() { document.getElementById('targetModal').classList.remove('show'); }

function renderTargetList() {
    const list = document.getElementById('targetList');
    list.innerHTML = "";
    getTargets().forEach((t, idx) => {
        list.innerHTML += `<div class="target-item"><span>${escapeHtml(t.name)} <small>(${t.date})</small></span><span class="del-target" onclick="removeTarget(${idx})">✕</span></div>`;
    });
}

function addTarget() {
    const name = document.getElementById('newTargetName').value;
    const date = document.getElementById('newTargetDate').value;
    if(!name || !date) return showToast("请填写完整信息", "error");
    appData.targets.push({ name, date });
    saveData(); renderTargetList(); renderCountdowns();
    document.getElementById('newTargetName').value = "";
}

function removeTarget(idx) { appData.targets.splice(idx, 1); saveData(); renderTargetList(); renderCountdowns(); }

function renderCountdowns() {
    const container = document.getElementById('countdownList');
    container.innerHTML = "";
    const targets = getTargets();
    if (targets.length === 0) { container.innerHTML = "<div style='text-align:center; color:#999; font-size:0.8rem;'>暂无比赛日程</div>"; return; }
    targets.forEach(t => {
        const targetDate = new Date(t.date);
        const now = new Date();
        const diff = targetDate - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const urgentClass = (days <= 7 && days >= 0) ? 'urgent' : '';
        const dayText = days >= 0 ? `${days} 天` : '已结束';
        container.innerHTML += `<div class="cd-row"><span class="cd-name">${escapeHtml(t.name)}</span><span class="cd-days ${urgentClass}">${dayText}</span></div>`;
    });
}

// --- 任务管理 (使用逻辑日) ---
function addTodo() {
    const text = document.getElementById('todoInput').value;
    const type = document.getElementById('todoType').value;
    if (!text) return;
    
    let display = "";
    if (type === '赛') display += "🏆 ";
    else if (type === '学') display += "🧠 ";
    else display += "📖 ";
    display += text;

    // ★★★ 关键：存入的是逻辑日 ★★★
    const logicalDate = getLogicalDate();

    appData.todos.push({ id: Date.now(), text: display, type: type, date: logicalDate, done: false });
    document.getElementById('todoInput').value = '';
    saveData();
}

// --- 渲染 (使用逻辑日) ---
function renderUI() {
    document.getElementById('lvNum').innerText = appData.level;
    document.getElementById('curXP').innerText = appData.xp;
    const nextXP = 50 * Math.pow(appData.level, 2);
    document.getElementById('nextXP').innerText = nextXP;
    const prevXP = 50 * Math.pow(appData.level - 1, 2);
    const pct = ((appData.xp - prevXP) / (nextXP - prevXP)) * 100;
    document.getElementById('xpFill').style.width = `${Math.max(0, Math.min(pct, 100))}%`;
    document.getElementById('totalAC').innerText = appData.logs.length;

    const badgeBox = document.getElementById('badgeGrid');
    badgeBox.innerHTML = '';
    BADGES.forEach(b => {
        const unlocked = b.check(appData);
        badgeBox.innerHTML += `<div class="badge ${unlocked?'unlocked':''}" data-title="${b.title}">${b.icon}</div>`;
    });

    const groupStats = [0, 0, 0, 0, 0]; 
    appData.logs.forEach(l => { const conf = RATINGS[l.ratingVal]; if (conf) groupStats[conf.group]++; });
    
    const ctx = document.getElementById('radarChart');
    if (ctx && window.Chart) {
        if (window.myRadarChart) window.myRadarChart.destroy();
        const isDark = document.body.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const themeColor = currentTheme.p;
        window.myRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['新手/入门', '普及', '提高/省选-', '大师/省选', '传奇/NOI'],
                datasets: [{ label: 'AC数量', data: groupStats, backgroundColor: themeColor + '33', borderColor: themeColor, pointBackgroundColor: currentTheme.a, pointBorderColor: '#fff', borderWidth: 2 }]
            },
            options: { maintainAspectRatio: false, scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: textColor, font: { size: 9, family: 'JetBrains Mono' } }, ticks: { display: false, backdropColor: 'transparent' } } }, plugins: { legend: { display: false } } }
        });
    }

    const sortedKeys = Object.keys(RATINGS).sort((a,b) => RATINGS[b].xp - RATINGS[a].xp);
    
    // Todos 渲染 (按逻辑日)
    const todoBox = document.getElementById('todoList');
    todoBox.innerHTML = '';
    const today = getLogicalDate(); // ★★★ 获取逻辑日 ★★★
    
    const showTodos = appData.todos.filter(t => !t.done || t.date === today);
    const completedToday = appData.todos.filter(t => t.date === today && t.done).length;
    const totalToday = appData.todos.filter(t => t.date === today).length;
    
    const progressPct = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);
    document.getElementById('dailyProgress').style.width = `${progressPct}%`;
    document.getElementById('progressText').innerText = `${progressPct}%`;
    if(progressPct === 100 && totalToday > 0) document.getElementById('dailyProgress').style.backgroundColor = "#10b981";
    else document.getElementById('dailyProgress').style.backgroundColor = currentTheme.p;

    if(showTodos.length===0) todoBox.innerHTML='<div style="color:#999;font-size:0.8rem; text-align:center; padding:10px;">今日任务已清空</div>';
    showTodos.forEach(t => {
        const isContest = t.type === '赛';
        const styleClass = isContest ? 'contest' : '';
        todoBox.innerHTML += `
        <div class="todo-item ${t.done?'done':''} ${styleClass}">
            <div style="display:flex;align-items:center;flex:1;">
                <span class="btn-del" style="margin-left:0;margin-right:8px;font-size:1rem;" onclick="deleteTodo(${t.id})">✕</span>
                <span style="font-size:0.9rem; cursor:pointer;" onclick="toggleTodo(${t.id})">${escapeHtml(t.text)}</span>
            </div>
            ${!t.done?`<button class="btn btn-ai" style="padding:4px 8px;font-size:0.75rem" onclick="setPendingTodo('${escapeHtml(t.text)}')">提交</button>`:'<span style="cursor:pointer;" onclick="toggleTodo('+t.id+')">✔️</span>'}
        </div>`;
    });

    // Logs 渲染
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const logBox = document.getElementById('logList');
    logBox.innerHTML = '';
    const filteredLogs = appData.logs.filter(l => l.name.toLowerCase().includes(searchText));
    filteredLogs.slice(0, 30).forEach(l => {
        const conf = RATINGS[l.ratingVal] || RATINGS["1200"];
        const div = document.createElement('div');
        div.className = 'log-card';
        div.style.borderLeftColor = conf.color;
        div.innerHTML = `
            <div style="flex:1">
                <div style="font-weight:bold;display:flex;align-items:center;flex-wrap:wrap;">
                    <span class="rating-tag" style="background:${conf.color}">${conf.label}</span>${escapeHtml(l.name)}
                </div>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:5px;">${l.date.split('T')[0]} · +${l.xp} XP</div>
            </div>
            <div class="link-group" style="display:flex;align-items:center;">
                ${l.link ? `<a href="${escapeHtml(l.link)}" target="_blank" class="link-prob">原题</a>` : ''}
                ${l.sol ? `<a href="${escapeHtml(l.sol)}" target="_blank" class="link-sol">代码</a>` : ''}
                <div class="btn-del" onclick="deleteLog(${l.id})" title="删除记录">✕</div>
            </div>
        `;
        logBox.appendChild(div);
    });
}

// --- 基础函数 ---
function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light'); renderUI(); }
function changeColor(p, a) { currentTheme = { p, a }; applyTheme(p, a); localStorage.setItem('themeColors', JSON.stringify(currentTheme)); renderUI(); showToast("主题已切换", "success"); }
function applyTheme(p, a) { const root = document.documentElement; root.style.setProperty('--primary', p); root.style.setProperty('--accent', a); }
function updateQuote() { const q = QUOTES[quoteIdx]; const elC = document.getElementById('qContent'), elA = document.getElementById('qAuthor'); if(!elC) return; elC.style.opacity = 0; elA.style.opacity = 0; setTimeout(() => { elC.innerText = q.t; elA.innerText = `—— ${q.a}`; elC.style.opacity = 1; elA.style.opacity = 1; }, 300); }
function loadTimer() { const saved = localStorage.getItem('studyTimer'); const todayStr = getLogicalDate(); if (saved) { timerState = JSON.parse(saved); if (timerState.lastDate !== todayStr) { timerState.totalTime = 0; timerState.lastDate = todayStr; timerState.isRunning = false; saveTimer(); } } else { timerState.lastDate = todayStr; } }
function saveTimer() { localStorage.setItem('studyTimer', JSON.stringify(timerState)); }
function toggleTimer() { if (timerState.isRunning) { timerState.totalTime += Date.now() - timerState.startTime; timerState.isRunning = false; clearInterval(timerInterval); saveTimer(); updateTimerUI(false); updateTimerDisplay(timerState.totalTime); showToast("休息一下吧！", "info"); } else { timerState.startTime = Date.now(); timerState.isRunning = true; saveTimer(); startTimerTicker(); updateTimerUI(true); showToast("开始专注！加油！", "success"); } }
function startTimerTicker() { if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { const currentSession = Date.now() - timerState.startTime; updateTimerDisplay(timerState.totalTime + currentSession); }, 1000); }
function updateTimerDisplay(ms) { const totalSeconds = Math.floor(ms / 1000); const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0'); const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'); const s = String(totalSeconds % 60).padStart(2, '0'); document.getElementById('totalTimeDisplay').innerText = `${h}:${m}:${s}`; }
function updateTimerUI(isRunning) { const btn = document.getElementById('timerBtn'); const status = document.getElementById('timerStatus'); if (isRunning) { btn.innerText = "⏸️ 暂停 / 结束"; btn.classList.remove('start'); btn.classList.add('stop'); status.innerText = "🔥 专注中"; status.classList.remove('offline'); status.classList.add('online'); } else { btn.innerText = "🚀 开始专注"; btn.classList.remove('stop'); btn.classList.add('start'); status.innerText = "😴 休息中"; status.classList.remove('online'); status.classList.add('offline'); } }
function exportData() { const dataStr = JSON.stringify(appData); const blob = new Blob([dataStr], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `algo_backup_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); showToast("存档已导出", "success"); }
function importData(input) { const file = input.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const json = JSON.parse(e.target.result); if(json.logs && json.xp !== undefined) { if(confirm("确定要覆盖当前记录吗？")) { appData = json; saveData(); showToast("读档成功", "success"); } } else { showToast("文件格式错误", "error"); } } catch(err) { showToast("解析失败", "error"); } input.value = ''; }; reader.readAsText(file); }
function getStreak(d) { return parseInt(document.getElementById('streakDays')?.innerText || 0); }
function getTodayCount(d) { const today = getLogicalDate(); return d.logs.filter(l => l.date.startsWith(today)).length; }
function toggleTodo(id) { const todo = appData.todos.find(t => t.id === id); if(todo) { todo.done = !todo.done; saveData(); } }
function deleteLog(id) { if(!confirm("删除记录？")) return; const idx = appData.logs.findIndex(l => l.id === id); if(idx !== -1) { appData.xp = Math.max(0, appData.xp - appData.logs[idx].xp); appData.logs.splice(idx, 1); saveData(); } }
function deleteTodo(id) { if(!confirm("删除任务？")) return; appData.todos = appData.todos.filter(t => t.id !== id); saveData(); }
function setPendingTodo(text) { document.getElementById('probName').value = text; document.getElementById('submitZone').scrollIntoView({ behavior: 'smooth' }); document.getElementById('probName').focus(); }
function showACModal() { document.getElementById('acModal').classList.add('show'); }
function closeAC() { document.getElementById('acModal').classList.remove('show'); }
function closeBatchModal() { document.getElementById('batchModal').classList.remove('show'); }
function openBatchModal() { document.getElementById('batchModal').classList.add('show'); }
function generateAIPrompt() { const today = getLogicalDate(); const logs = appData.logs.filter(l => l.date.startsWith(today)); if (logs.length === 0) return showToast("今天没做题", "info"); const list = logs.map(l => `- ${l.name} (${RATINGS[l.ratingVal].label})`).join('\n'); navigator.clipboard.writeText(`今日刷题：\n${list}\n请评价。`).then(() => showToast("提示词已复制", "success")); }
function copyReport() { const today = getLogicalDate(); const logs = appData.logs.filter(l => l.date.startsWith(today)); if(logs.length === 0) return showToast("今天无记录", "error"); const list = logs.map(l => `✅ [${RATINGS[l.ratingVal].label}] ${l.name}`).join('\n'); navigator.clipboard.writeText(`📅 ${today} 打卡\n${list}`).then(() => showToast("战报已复制", "success")); }
function fireConfetti() { const c = document.getElementById('confetti-canvas'); const x = c.getContext('2d'); c.width = window.innerWidth; c.height = window.innerHeight; let p = []; for(let i=0; i<150; i++) p.push({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*15, vy:(Math.random()-0.5)*15-5, c:['#4f46e5','#db2777','#f59e0b'][Math.floor(Math.random()*3)], s:Math.random()*6+2, l:120}); function a() { x.clearRect(0,0,c.width,c.height); p.forEach((i,k)=>{ i.x+=i.vx; i.y+=i.vy; i.vy+=0.3; i.l--; x.fillStyle=i.c; x.fillRect(i.x,i.y,i.s,i.s); if(i.l<=0) p.splice(k,1); }); if(p.length>0) requestAnimationFrame(a); } a(); }
function escapeHtml(t) { if(!t) return t; return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function showToast(m, t='info') { const c = document.querySelector('.toast-container') || document.body.appendChild(Object.assign(document.createElement('div'), {className: 'toast-container'})); const e = document.createElement('div'); e.className = `toast ${t}`; e.innerHTML = `<span>${t==='success'?'✅':t==='error'?'❌':'💡'}</span><span>${m}</span>`; c.appendChild(e); setTimeout(() => { e.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => e.remove(), 300); }, 3000); }
function submitAC() {
    const name = document.getElementById('probName').value;
    const rVal = document.getElementById('ratingSelect').value;
    if (!name) return showToast("题目名称必填", "error");
    if (!rVal) return showToast("请选择难度/Rating", "error");
    const config = RATINGS[rVal];
    const numRating = parseInt(rVal);
    if (!isNaN(numRating)) appData.maxRating = Math.max(appData.maxRating, numRating);
    const match = appData.todos.find(t => t.text.includes(name) && !t.done);
    if (match) match.done = true;
    appData.logs.unshift({ id: Date.now(), date: getLogicalDate(), name, ratingVal: rVal, link: document.getElementById('probLink').value, sol: document.getElementById('solLink').value, xp: config.xp });
    appData.xp += config.xp;
    const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
    if (nextLv > appData.level) { appData.level = nextLv; showToast(`升级啦！Lv.${nextLv}`, "success"); }
    document.getElementById('probName').value = ''; document.getElementById('probLink').value = ''; document.getElementById('solLink').value = '';
    saveData(); showACModal(); fireConfetti();
}
function processBatch() {
    const text = document.getElementById('batchInput').value;
    if (!text.trim()) return showToast("请输入内容", "error");
    const lines = text.split('\n');
    let count = 0; let totalXP = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        let match = line.match(/^(\d+)\s+(.+)$/);
        let validKey = "1200"; let name = "";
        if (match) {
            const num = parseInt(match[1]);
            name = match[2];
            if (num >= 2200) validKey = "2200"; else if (num >= 2000) validKey = "2000"; else if (num >= 1750) validKey = "1750"; else if (num >= 1500) validKey = "1500"; else validKey = "1200";
            appData.maxRating = Math.max(appData.maxRating, num);
        } else {
            const charMatch = line.match(/^([红橙黄绿蓝紫黑])\s+(.+)$/);
            if (charMatch) { const colorMap = {'红':'luogu_red', '橙':'luogu_orange', '黄':'luogu_yellow', '绿':'luogu_green', '蓝':'luogu_blue', '紫':'luogu_purple', '黑':'luogu_black'}; validKey = colorMap[charMatch[1]] || "1200"; name = charMatch[2]; } else continue;
        }
        const config = RATINGS[validKey];
        appData.logs.unshift({ id: Date.now() + i, date: getLogicalDate(), name: name, ratingVal: validKey, link: "", sol: "", xp: config.xp });
        appData.xp += config.xp; totalXP += config.xp; count++;
    }
    if (count > 0) { const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1; if (nextLv > appData.level) { appData.level = nextLv; } saveData(); closeBatchModal(); document.getElementById('batchInput').value = ""; showToast(`成功导入 ${count} 题！`, "success"); fireConfetti(); } else { showToast("格式错误", "error"); }
}