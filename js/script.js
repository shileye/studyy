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

const QUOTES = [
    {t:"逃避补题，就是逃避拿牌的机会。", a:"教练"},
    {t:"赛场上流的泪，都是平时没补题脑子里进的水。", a:"ACMer"},
    {t:"如果连昨天的耻辱都洗刷不掉，今天学再多新花样也没用。", a:"Algo_Warrior"},
    {t:"别刷舒适区的题了，去碰那个你害怕的算法。", a:"心魔"},
    {t:"无数次 WA 之后，AC 的声音最动听。", a:"ICPC"},
    {t:"满屏的红，是通往绿色的必经之路。", a:"Codeforces"}
];

const FORTUNES = [
    "大吉 - 宜立刻清理耻辱柱", "中吉 - 宜重写昨天的题", "小吉 - 宜复习模版", "平 - 戒骄戒躁", 
    "大凶 - 再不补题要退役了", "吉 - 适合刚一道大模拟", "凶 - 忌学习没用的奇技淫巧"
];

let appData = { xp: 0, level: 1, maxRating: 0, todos: [], logs: [], targets: [], history: [], templates: [] };
let timerState = { isRunning: false, startTime: 0, totalTime: 0, date: "" };
let timerInterval = null; let quoteIdx = 0; let currentTheme = { p: '#4f46e5', a: '#db2777' }; let pendingDeleteAction = null; 

function setContent(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
function setStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; }

window.onload = () => {
    try {
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
        try { const savedColors = localStorage.getItem('themeColors'); if(savedColors) { currentTheme = JSON.parse(savedColors); applyTheme(currentTheme.p, currentTheme.a); } } catch(e) {}
        loadData(); loadTimer(); checkDailySettlement(); renderUI(); renderTemplates();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('auto_ac')) {
            const batchBox = document.getElementById('batchInput');
            if (batchBox) { batchBox.value = urlParams.get('auto_ac'); processBatch(); }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        setInterval(() => {
            const now = new Date();
            setContent('currentDateDisplay', `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
        }, 1000);

        setInterval(checkDailySettlement, 60000); updateQuote(); setInterval(() => { quoteIdx = (quoteIdx + 1) % QUOTES.length; updateQuote(); }, 30000);
        if(timerState.isRunning) { startTimerTicker(); updateTimerUI(true); } else { updateTimerDisplay(timerState.totalTime); }

        const delBtn = document.getElementById('confirmDeleteBtn');
        if(delBtn) delBtn.onclick = () => { if(pendingDeleteAction) pendingDeleteAction(); closeModal('confirmModal'); };
    } catch(e) { console.error("Init Error:", e); }
};

function getRealDate() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
function getTaskTargetDate() {
    const now = new Date(); const limit = new Date(); limit.setHours(23, 30, 0, 0);
    if (now > limit) { const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`; } 
    else return getRealDate();
}

// 🩸 结算机制大改：普通的当天清掉，【补题】如果没做，永不删除，留在耻辱柱！
function checkDailySettlement() {
    const today = getRealDate();
    const pastTodos = appData.todos.filter(t => t.date < today);
    if (pastTodos.length > 0) {
        const groups = {};
        pastTodos.forEach(t => {
            if(!groups[t.date]) groups[t.date] = { total:0, done:0 };
            groups[t.date].total++; if(t.done) groups[t.date].done++;
        });
        for(let date in groups) {
            if (!appData.history.find(h => h.date === date)) {
                appData.history.unshift({ date, ...groups[date], pct: groups[date].total === 0 ? 0 : Math.round((groups[date].done / groups[date].total) * 100) });
            }
        }
        // 保留今天以后的，以及以前欠下且没还的【补题】账！
        appData.todos = appData.todos.filter(t => t.date >= today || (t.type === '学' && !t.done));
        saveData(); renderUI(); showToast("📅 昨日已结算。你遗留的补题账已记入耻辱柱。", "info");
    }
}

function drawFortune() { setContent('fortuneResult', FORTUNES[Math.floor(Math.random() * FORTUNES.length)]); fireConfetti(); }
function toggleCommitArea() {
    const el = document.getElementById('submitSection');
    if (el.style.display === 'none') { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth' }); } else { el.style.display = 'none'; }
}

function addTodo() {
    const textRaw = document.getElementById('todoInput').value; const type = document.getElementById('todoType').value;
    if(!textRaw) return showToast("请输入内容", "error");
    const urlRegex = /(https?:\/\/[^\s]+)/g; const extractedLinks = textRaw.match(urlRegex);
    const link = extractedLinks ? extractedLinks[0] : ""; const cleanText = textRaw.replace(urlRegex, '').trim() || "未命名任务";
    const targetDate = getTaskTargetDate(); const isTomorrow = targetDate !== getRealDate();
    let icon = "📖"; if(type === '赛') icon = "🏆"; if(type === '学') icon = "🩸";

    appData.todos.push({ id: Date.now(), text: `${isTomorrow ? "[明日] " : ""}${icon} ${cleanText}`, rawText: cleanText, link: link, date: targetDate, done: false, type: type });
    document.getElementById('todoInput').value = ''; saveData();
    if(isTomorrow) showToast("已加入明日计划", "success");
    else if(type === '学') showToast("🩸 已标记为高优先补题！请尽早拔除！", "blood");
}

function scrollToCommit(text, id) {
    const section = document.getElementById('submitSection');
    if(section) { section.style.display = 'block'; section.scrollIntoView({ behavior: 'smooth', block: 'center' }); section.classList.add('highlight-pulse'); setTimeout(() => section.classList.remove('highlight-pulse'), 1500); }
    const nameInput = document.getElementById('probName'); if(nameInput) { nameInput.value = text || ""; nameInput.focus(); }
    const hiddenId = document.getElementById('linkedTaskId'); if(hiddenId) hiddenId.value = id; 
}

// 🩸 斩杀！判定 300% 暴击
function submitAC() {
    const name = document.getElementById('probName').value;
    const rVal = document.getElementById('ratingSelect').value;
    const topicVal = document.getElementById('topicSelect').value;
    const probLink = document.getElementById('probLink').value;
    const solLink = document.getElementById('solLink').value;
    const linkedId = document.getElementById('linkedTaskId').value;

    if(!name || rVal === "--- 难度评级 ---" || topicVal === "--- 🎯 科技树归属 ---") {
        return showToast("请填写完整！题目名、难度、科技树缺一不可！", "error");
    }

    const conf = RATINGS[rVal];
    if(parseInt(rVal)) appData.maxRating = Math.max(appData.maxRating, parseInt(rVal));

    let isUpsolve = false;
    if (linkedId) {
        const task = appData.todos.find(t => t.id == linkedId);
        if(task) { task.done = true; if(task.type === '学') isUpsolve = true; }
    } else {
        const match = appData.todos.find(t => t.text.includes(name) && !t.done);
        if(match) { match.done = true; if(match.type === '学') isUpsolve = true; }
    }

    // EXP 暴击计算
    let finalXp = conf.xp;
    if(isUpsolve) {
        finalXp *= 3;
        setContent('acSubtext', "🩸 成功拔除耻辱柱！EXP x 300% 暴击！");
        setTimeout(()=> showToast("狂暴：+ " + finalXp + " EXP !!", "blood"), 500);
        fireBloodConfetti(); // 专属血金爆炸特效
    } else {
        setContent('acSubtext', "太强了！继续保持！");
        fireConfetti();
    }

    appData.logs.unshift({ id: Date.now(), date: getRealDate(), name, ratingVal: rVal, topic: parseInt(topicVal), link: probLink, sol: solLink, xp: finalXp });
    appData.xp += finalXp;
    
    const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
    if(nextLv > appData.level) { appData.level = nextLv; setTimeout(()=> showToast(`🎉 升级啦 LV.${nextLv}`, "success"), 1500); }

    document.getElementById('probName').value = ''; document.getElementById('probLink').value = ''; document.getElementById('solLink').value = ''; document.getElementById('linkedTaskId').value = '';
    
    saveData(); openModal('acModal');
}

function processBatch() {
    const text = document.getElementById('batchInput').value;
    if (!text.trim()) return showToast("请输入内容", "error");
    const lines = text.split('\n'); let count = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim(); if (!line) continue;
        let match = line.match(/^(\d+)\s+(.+)$/); let validKey = "1200"; let rawName = "";
        if (match) {
            const num = parseInt(match[1]); rawName = match[2];
            if (num >= 2200) validKey = "2200"; else if (num >= 2000) validKey = "2000"; else if (num >= 1750) validKey = "1750"; else if (num >= 1500) validKey = "1500";
        } else {
            const charMatch = line.match(/^([红橙黄绿蓝紫黑]|unrated)\s+(.+)$/);
            if (charMatch) { const colorMap = {'红':'luogu_red', '橙':'luogu_orange', '黄':'luogu_yellow', '绿':'luogu_green', '蓝':'luogu_blue', '紫':'luogu_purple', '黑':'luogu_black', 'unrated':'unrated'}; validKey = colorMap[charMatch[1]] || "unrated"; rawName = charMatch[2]; } 
            else continue;
        }
        let finalName = rawName; let finalLink = "";
        if (rawName.includes("|")) { let splitParts = rawName.split("|"); finalName = splitParts[0].trim(); finalLink = splitParts[1].trim(); }
        const config = RATINGS[validKey] || RATINGS["unrated"];
        // 极速入库默认丢进 "思维" (topic 0)
        appData.logs.unshift({ id: Date.now() + i, date: getRealDate(), name: finalName, ratingVal: validKey, topic: 0, link: finalLink, sol: "", xp: config.xp });
        appData.xp += config.xp; count++;
    }
    if (count > 0) { const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1; if (nextLv > appData.level) appData.level = nextLv; saveData(); closeModal('batchModal'); document.getElementById('batchInput').value = ""; showToast(`⚡ 导入 ${count} 题`, "success"); fireConfetti(); } else showToast("格式错误", "error");
}

function renderUI() {
    setContent('lvNum', appData.level); setContent('curXP', appData.xp);
    const nextXP = 50 * Math.pow(appData.level, 2); setContent('nextXP', nextXP);
    const prevXP = 50 * Math.pow(appData.level - 1, 2);
    setStyle('xpFill', 'width', `${Math.max(0, Math.min(((appData.xp - prevXP) / (nextXP - prevXP)) * 100, 100))}%`);
    setContent('totalAC', appData.logs.length);
    renderChart(); renderTodos(); renderHistory(); renderLogs(); renderCountdowns(); renderHeatmap(); renderCalendar(); 
}

// 🩸 渲染耻辱柱
function renderTodos() {
    const todayStr = getRealDate(); const list = document.getElementById('todoList'); if(!list) return;
    list.innerHTML = "";
    
    // 把今天以前没做完的补题任务也抓出来
    const activeTodos = appData.todos.filter(t => t.date >= todayStr || (t.type === '学' && !t.done));
    const todayOnly = appData.todos.filter(t => t.date === todayStr);
    const progress = todayOnly.length ? Math.round((todayOnly.filter(t => t.done).length/todayOnly.length)*100) : 0;
    
    setStyle('dailyProgress', 'width', `${progress}%`); setContent('progressText', `${progress}%`);
    const bar = document.getElementById('dailyProgress');
    if(bar) bar.style.backgroundColor = (progress === 100 && todayOnly.length > 0) ? "#10b981" : currentTheme.p;

    if(activeTodos.length === 0) { list.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:20px;">耻辱柱空空如也，今日无任务</div>`; return; }
    
    activeTodos.sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.done - b.done; });

    activeTodos.forEach(t => {
        let shameClass = '';
        if (t.type === '学' && !t.done && t.date < todayStr) shameClass = 'shame-pulse'; // 只要是昨天的补题没做完，直接滴血警告！

        const goAcBtn = !t.done ? `<button class="btn-go-ac" onclick="scrollToCommit('${escapeHtml(t.rawText)}', ${t.id})">⚔️ 斩杀</button>` : '';
        const goProbBtn = (!t.done && t.link) ? `<a href="${escapeHtml(t.link)}" target="_blank" class="btn-go-ac" style="text-decoration:none; background:var(--primary); color:white;">🔗 传送</a>` : '';
        
        list.innerHTML += `
        <div class="todo-item ${t.done?'done':''} ${t.type==='赛'?'type-race':''} ${t.type==='学'?'type-study':''} ${shameClass}">
            <div style="flex:1; cursor:pointer;" onclick="toggleTodo(${t.id})">${escapeHtml(t.text)} ${shameClass ? '<span style="color:var(--danger);font-size:0.7rem;">(已逾期，正在滴血)</span>' : ''}</div>
            <div style="display:flex; gap: 8px; align-items: center;">${goProbBtn}${goAcBtn}<span class="btn-del" onclick="requestDelete('todo', ${t.id})">✕</span></div>
        </div>`;
    });
}

function renderHistory() {
    const histList = document.getElementById('historyList'); if(!histList) return;
    histList.innerHTML = ""; if(appData.history.length === 0) { histList.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无历史</div>`; return; }
    appData.history.slice(0, 7).forEach(h => { histList.innerHTML += `<div class="history-item"><span>${h.date}</span><span>完成度: <b style="color:${h.pct>=80?'#10b981':'#64748b'}">${h.pct}%</b> (${h.done}/${h.total})</span></div>`; });
}

function renderLogs() {
    const searchInput = document.getElementById('searchInput'); const searchText = searchInput ? searchInput.value.toLowerCase() : "";
    const logBox = document.getElementById('logList'); if(!logBox) return;
    logBox.innerHTML = ''; const filteredLogs = appData.logs.filter(l => l.name.toLowerCase().includes(searchText));
    if(filteredLogs.length === 0 && !searchText) { logBox.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">暂无记录</div>`; return; }

    const topicNames = ['🧩 思维', '🌲 数据结构', '🕸️ 图论', '🧮 数学', '💡 DP', '🔤 字符串'];

    filteredLogs.slice(0, 30).forEach(l => {
        const conf = RATINGS[l.ratingVal] || RATINGS["1200"];
        const div = document.createElement('div'); div.className = 'log-card'; div.style.borderLeftColor = conf.color;
        let links = ''; if(l.link) links += `<a href="${escapeHtml(l.link)}" target="_blank" class="link-btn link-prob">📄 原题</a>`; if(l.sol) links += `<a href="${escapeHtml(l.sol)}" target="_blank" class="link-btn link-sol">📝 代码</a>`;
        
        let tName = l.topic !== undefined && l.topic >= 0 && l.topic <= 5 ? topicNames[l.topic] : '🧩 未分类';
        
        div.innerHTML = `
            <div style="flex:1">
                <div style="font-weight:bold;display:flex;align-items:center;flex-wrap:wrap;">
                    <span class="rating-tag" style="background:${conf.color}">${conf.label}</span>
                    <span style="font-size:0.75rem; color:#94a3b8; margin-right:8px; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px;">${tName}</span>
                    ${escapeHtml(l.name)}
                </div>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:5px;">${l.date} · +${l.xp} XP</div>
            </div>
            <div style="display:flex;align-items:center;">${links}<div class="btn-del" onclick="requestDelete('log', ${l.id})">✕</div></div>`;
        logBox.appendChild(div);
    });
}

// 🕸️ 全新科技树雷达！
function renderChart() {
    const ctx = document.getElementById('radarChart');
    if (ctx && window.Chart) {
        // [思维, 数据结构, 图论, 数学, DP, 字符串]
        const groupStats = [0, 0, 0, 0, 0, 0]; 
        appData.logs.forEach(l => { 
            let t = l.topic !== undefined ? parseInt(l.topic) : 0; // 以前旧数据没有topic的，默认丢进思维
            if (t >= 0 && t <= 5) groupStats[t]++; 
        });
        
        if (window.myRadarChart) window.myRadarChart.destroy();
        const gridColor = document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const textColor = document.body.classList.contains('dark') ? '#f1f5f9' : '#334155';
        
        window.myRadarChart = new Chart(ctx, {
            type: 'radar',
            data: { 
                labels: ['🧩 思维/贪心', '🌲 数据结构', '🕸️ 图论', '🧮 数学', '💡 DP', '🔤 字符串'], 
                datasets: [{ 
                    label: '掌握度 (AC数)', 
                    data: groupStats, 
                    backgroundColor: currentTheme.p + '44', 
                    borderColor: currentTheme.p, 
                    pointBackgroundColor: currentTheme.a, 
                    pointBorderColor: '#fff', 
                    borderWidth: 2 
                }] 
            },
            options: { 
                maintainAspectRatio: false, 
                scales: { 
                    r: { 
                        angleLines: { color: gridColor }, 
                        grid: { color: gridColor }, 
                        pointLabels: { color: textColor, font: { size: 11, family: 'Noto Serif SC', weight: 'bold' } }, 
                        ticks: { display: false, backdropColor: 'transparent' } 
                    } 
                }, 
                plugins: { legend: { display: false } } 
            }
        });
    }
}

function renderCountdowns() { const list = document.getElementById('countdownList'); if(!list) return; list.innerHTML = ""; if (!appData.targets || appData.targets.length === 0) { list.innerHTML = "<div style='text-align:center; color:#999; font-size:0.8rem;'>暂无比赛日程</div>"; return; } appData.targets.sort((a, b) => new Date(a.date) - new Date(b.date)); appData.targets.forEach((t) => { const diff = Math.ceil((new Date(t.date) - new Date()) / 86400000); list.innerHTML += `<div class="cd-row"><span class="cd-name">${escapeHtml(t.name)}</span><span class="cd-days ${(diff <= 7 && diff >= 0) ? 'urgent' : ''}">${diff >= 0 ? `${diff} 天` : '已结束'}</span></div>`; }); }
function renderTargetList() { const list = document.getElementById('targetList'); if(!list) return; list.innerHTML = ""; (appData.targets || []).forEach((t, idx) => { list.innerHTML += `<div class="target-item"><span>${escapeHtml(t.name)} <small>(${t.date})</small></span><span class="del-target" onclick="removeTarget(${idx})">✕</span></div>`; }); }
function renderHeatmap() { const grid = document.getElementById('heatmapGrid'); if (!grid) return; grid.innerHTML = ""; const counts = {}; appData.logs.forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; }); for (let i = 140; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const count = counts[dateStr] || 0; let level = 'heat-l0'; if (count >= 1) level = 'heat-l1'; if (count >= 3) level = 'heat-l2'; if (count >= 5) level = 'heat-l3'; if (count >= 8) level = 'heat-l4'; const cell = document.createElement('div'); cell.className = `heat-cell ${level}`; cell.title = `${dateStr}: ${count} AC`; grid.appendChild(cell); } }
function renderCalendar() { const grid = document.getElementById('calGrid'); if(!grid) return; grid.innerHTML = ""; const now = new Date(); const y = now.getFullYear(); const m = now.getMonth(); setContent('calTitle', `${y}年 ${m+1}月`); const activeDays = {}; appData.logs.forEach(l => activeDays[l.date] = true); let streak = 0; const todayStr = getRealDate(); for(let i=0; i<new Date(y, m, 1).getDay(); i++) grid.appendChild(document.createElement('div')); for(let d=1; d<=new Date(y, m+1, 0).getDate(); d++) { const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const el = document.createElement('div'); el.className = `cal-cell ${activeDays[dateStr] ? 'active' : ''} ${dateStr===todayStr?'today':''}`; el.innerText = d; grid.appendChild(el); if(new Date(dateStr) <= now && activeDays[dateStr]) streak++; else if(new Date(dateStr) < now && !activeDays[dateStr]) streak = 0; } setContent('streakDays', streak); }

function openStatsModal() { openModal('statsModal'); setContent('statTotal', appData.logs.length); setContent('statMaxStreak', getStreak(appData)); const counts = {}; let best = 0; appData.logs.forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; if(counts[l.date] > best) best = counts[l.date]; }); setContent('statBestDay', best); const ctxTrend = document.getElementById('trendChart'); if(ctxTrend) { const labels = []; const data = []; for(let i=6; i>=0; i--) { const d = new Date(); d.setDate(d.getDate() - i); labels.push(d.getMonth()+1 + '-' + d.getDate()); data.push(counts[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] || 0); } if(window.trendChartInst) window.trendChartInst.destroy(); window.trendChartInst = new Chart(ctxTrend, { type: 'line', data: { labels: labels, datasets: [{ label: 'AC 数', data: data, borderColor: currentTheme.p, backgroundColor: currentTheme.p + '33', tension: 0.4, fill: true }] }, options: { plugins: { legend: {display:false} }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } }); } const ctxDist = document.getElementById('distChart'); if(ctxDist) { const groups = [0,0,0,0,0]; appData.logs.forEach(l => { const conf = RATINGS[l.ratingVal] || RATINGS["1200"]; if(conf && conf.group !== undefined) groups[conf.group]++; }); if(window.distChartInst) window.distChartInst.destroy(); window.distChartInst = new Chart(ctxDist, { type: 'doughnut', data: { labels: ['入门', '普及', '提高', '省选', 'NOI'], datasets: [{ data: groups, backgroundColor: ['#9ca3af', '#2dd4bf', '#3b82f6', '#a855f7', '#ef4444'], borderWidth: 0 }] }, options: { plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } } } }); } }
function openModal(id) { const el = document.getElementById(id); if(el) { el.classList.add('show'); if(id === 'targetModal') renderTargetList(); } }
function closeModal(id) { const el = document.getElementById(id); if(el) el.classList.remove('show'); }
function requestDelete(type, id) { pendingDeleteAction = () => { if(type === 'todo') deleteTodo(id); if(type === 'log') deleteLog(id); }; openModal('confirmModal'); }
function toggleTodo(id) { const todo = appData.todos.find(t => t.id === id); if(todo) { todo.done = !todo.done; saveData(); } }
function deleteTodo(id) { appData.todos = appData.todos.filter(t => t.id !== id); saveData(); showToast("任务已废弃", "success"); }
function deleteLog(id) { const idx = appData.logs.findIndex(l => l.id === id); if(idx !== -1) { appData.xp = Math.max(0, appData.xp - appData.logs[idx].xp); appData.logs.splice(idx, 1); saveData(); showToast("记录已删除", "success"); } }
function addTarget() { const name = document.getElementById('newTargetName').value; const date = document.getElementById('newTargetDate').value; if(!name || !date) return showToast("请填写完整信息", "error"); if(!appData.targets) appData.targets = []; appData.targets.push({ name, date }); saveData(); renderTargetList(); renderCountdowns(); document.getElementById('newTargetName').value = ""; }
function removeTarget(idx) { appData.targets.splice(idx, 1); saveData(); renderTargetList(); renderCountdowns(); }
function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light'); renderUI(); }
function changeColor(p, a) { currentTheme = { p, a }; applyTheme(p, a); localStorage.setItem('themeColors', JSON.stringify(currentTheme)); renderUI(); showToast("主题已切换", "success"); }
function applyTheme(p, a) { const root = document.documentElement; root.style.setProperty('--primary', p); root.style.setProperty('--accent', a); }
function updateQuote() { const q = QUOTES[quoteIdx]; const elC = document.getElementById('qContent'); const elA = document.getElementById('qAuthor'); if(!elC) return; elC.style.opacity = 0; elA.style.opacity = 0; setTimeout(() => { elC.innerText = q.t; elA.innerText = `—— ${q.a}`; elC.style.opacity = 1; elA.style.opacity = 1; }, 300); }

function loadData() {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved); appData = { ...appData, ...parsed };
            if(!appData.targets) appData.targets = []; if(!appData.todos) appData.todos = []; if(!appData.logs) appData.logs = []; if(!appData.history) appData.history = []; if(!appData.templates) appData.templates = [];
        }
    } catch(e) { console.error("Load Data Error"); }
}
function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); renderUI(); }
function loadTimer() { try { const saved = localStorage.getItem('studyTimer'); const todayStr = getRealDate(); if (saved) { timerState = JSON.parse(saved); if (timerState.date !== todayStr) { timerState.totalTime = 0; timerState.date = todayStr; timerState.isRunning = false; saveTimer(); } } else { timerState.date = todayStr; } } catch(e) {} }
function saveTimer() { localStorage.setItem('studyTimer', JSON.stringify(timerState)); }
function toggleTimer() { if (timerState.isRunning) { timerState.totalTime += Date.now() - timerState.startTime; timerState.isRunning = false; clearInterval(timerInterval); saveTimer(); updateTimerUI(false); updateTimerDisplay(timerState.totalTime); } else { timerState.startTime = Date.now(); timerState.isRunning = true; saveTimer(); startTimerTicker(); updateTimerUI(true); } }
function startTimerTicker() { if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { updateTimerDisplay(timerState.totalTime + (Date.now() - timerState.startTime)); }, 1000); }
function updateTimerDisplay(ms) { const totalSeconds = Math.floor(ms / 1000); const el = document.getElementById('totalTimeDisplay'); if(el) el.innerText = `${String(Math.floor(totalSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`; }
function updateTimerUI(isRunning) { const btn = document.getElementById('timerBtn'); const status = document.getElementById('timerStatus'); if (isRunning) { btn.innerText = "⏸️ 暂停"; btn.className = 'btn btn-primary full-width stop'; status.innerText = "🔥 专注中"; status.className = 'tag online'; } else { btn.innerText = "🚀 开始专注"; btn.className = 'btn btn-primary full-width start'; status.innerText = "😴 休息中"; status.className = 'tag offline'; } }
function exportData() { const blob = new Blob([JSON.stringify(appData)], {type: "application/json"}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `algo_backup_${getRealDate()}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); showToast("存档已导出", "success"); }
function importData(input) { const file = input.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const json = JSON.parse(e.target.result); if(confirm("确定要覆盖当前记录吗？")) { appData = json; saveData(); showToast("读档成功！", "success"); setTimeout(()=>location.reload(), 1000); } } catch(err) { showToast("文件格式错误", "error"); } input.value = ''; }; reader.readAsText(file); }

// 蓝粉普通撒花
function fireConfetti() {
    const c = document.getElementById('confetti-canvas'); if(!c) return; const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    let p = Array(100).fill(0).map(()=>({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, c:['#4f46e5','#db2777','#10b981'][Math.floor(Math.random()*3)], s:Math.random()*6+2, l:100}));
    function step() { ctx.clearRect(0,0,c.width,c.height); p.forEach((i,k)=>{ i.x+=i.vx; i.y+=i.vy; i.vy+=0.5; i.l--; if(i.y>c.height||i.l<0) p.splice(k,1); ctx.fillStyle=i.c; ctx.fillRect(i.x,i.y,i.s,i.s); }); if(p.length) requestAnimationFrame(step); }
    step();
}

// 🩸 狂暴血金撒花
function fireBloodConfetti() {
    const c = document.getElementById('confetti-canvas'); if(!c) return; const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    let p = Array(150).fill(0).map(()=>({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*25, vy:(Math.random()-0.5)*25, c:['#dc2626','#991b1b','#f59e0b', '#fbbf24'][Math.floor(Math.random()*4)], s:Math.random()*8+4, l:120}));
    function step() { ctx.clearRect(0,0,c.width,c.height); p.forEach((i,k)=>{ i.x+=i.vx; i.y+=i.vy; i.vy+=0.5; i.l--; if(i.y>c.height||i.l<0) p.splice(k,1); ctx.fillStyle=i.c; ctx.fillRect(i.x,i.y,i.s,i.s); }); if(p.length) requestAnimationFrame(step); }
    step();
}

function escapeHtml(text) { if (!text) return text; return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function getStreak(d) { const today = getRealDate(); let streak = 0; let checkDate = new Date(today); for(let i=0; i<365; i++) { const dateStr = checkDate.toISOString().split('T')[0]; if(d.logs.some(l => l.date === dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else { if(i===0) { checkDate.setDate(checkDate.getDate() - 1); continue; } break; } } return streak; }
function showToast(msg, type = 'info') { let container = document.querySelector('.toast-container'); if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); } const el = document.createElement('div'); el.className = `toast ${type}`; el.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':type==='blood'?'🩸':'💡'}</span><span>${msg}</span>`; container.appendChild(el); setTimeout(() => { el.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => el.remove(), 300); }, 3000); }

async function syncCodeforces() {
    let handle = localStorage.getItem('cf_handle'); if (!handle) { handle = prompt("📡 请输入你的 Codeforces ID："); if (!handle) return; localStorage.setItem('cf_handle', handle); }
    showToast(`正在扫描 ${handle} 的战绩...`, "info");
    try {
        const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=30`); const data = await res.json();
        if (data.status !== "OK") return showToast("同步失败", "error");
        let newAcCount = 0; const subs = data.result;
        for (let i = subs.length - 1; i >= 0; i--) {
            const sub = subs[i];
            if (sub.verdict === "OK") {
                const prob = sub.problem; const rawName = `${prob.index} - ${prob.name}`;
                if (appData.logs.some(l => l.name.includes(prob.name))) continue; 
                let rVal = "1200"; let finalXp = 20;
                if (prob.rating) { const r = prob.rating; finalXp = Math.floor(r / 40); if (r >= 2200) rVal = "2200"; else if (r >= 2000) rVal = "2000"; else if (r >= 1750) rVal = "1750"; else if (r >= 1500) rVal = "1500"; else rVal = "1200"; } 
                else { const level = prob.index.charAt(0); if (['A', 'B'].includes(level)) { rVal = "1200"; finalXp = 15; } else if (level === 'C') { rVal = "1500"; finalXp = 25; } else if (level === 'D') { rVal = "1750"; finalXp = 35; } else { rVal = "2000"; finalXp = 45; } }
                const dateObj = new Date(sub.creationTimeSeconds * 1000);
                appData.logs.unshift({ id: sub.id, date: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`, name: rawName, ratingVal: rVal, topic: 0, link: `https://codeforces.com/contest/${prob.contestId}/problem/${prob.index}`, sol: "", xp: finalXp });
                appData.xp += finalXp; newAcCount++;
            }
        }
        if (newAcCount > 0) { const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1; if (nextLv > appData.level) appData.level = nextLv; saveData(); showToast(`🎉 捕获 ${newAcCount} 道新 AC`, "success"); fireConfetti(); } else { showToast("暂无新 AC", "info"); }
    } catch (err) { showToast("网络请求失败", "error"); }
}

async function syncAtCoder() {
    let handle = localStorage.getItem('at_handle'); if (!handle) { handle = prompt("🇯🇵 请输入你的 AtCoder ID："); if (!handle) return; localStorage.setItem('at_handle', handle); }
    showToast(`正在扫描 AtCoder: ${handle}...`, "info");
    try {
        const res = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=${Math.floor(Date.now()/1000) - 86400 * 7}`); const data = await res.json();
        let newAcCount = 0; const acSubs = data.filter(s => s.result === "AC");
        for (const sub of acSubs) {
            if (appData.logs.some(l => l.name.includes(sub.problem_id))) continue;
            let rVal = "1200"; let xp = 20; const probId = sub.problem_id;
            if (probId.includes('_c')) { rVal = "1500"; xp = 35; } else if (probId.includes('_d')) { rVal = "1750"; xp = 50; } else if (probId.includes('_e')) { rVal = "2000"; xp = 80; }
            appData.logs.unshift({ id: `at-${sub.id}`, date: new Date(sub.epoch_second * 1000).toISOString().split('T')[0], name: `ABC - ${sub.problem_id.toUpperCase()}`, ratingVal: rVal, topic: 0, link: `https://atcoder.jp/contests/${sub.contest_id}/tasks/${sub.problem_id}`, sol: "", xp: xp });
            appData.xp += xp; newAcCount++;
        }
        if (newAcCount > 0) { saveData(); showToast(`🎉 ABC 新增 ${newAcCount} 条记录`, "success"); fireConfetti(); } else { showToast("🍵 暂无新 AC", "info"); }
    } catch (err) { showToast("连接超时", "error"); }
}

function toggleDrawer() { const drawer = document.getElementById('tplDrawer'); if (drawer) drawer.classList.toggle('open'); }
function openTplModal() { document.getElementById('tplNameInput').value = ''; document.getElementById('tplDescInput').value = ''; document.getElementById('tplCodeInput').value = ''; openModal('tplModal'); }
function saveTemplate() { const name = document.getElementById('tplNameInput').value; const desc = document.getElementById('tplDescInput').value; const code = document.getElementById('tplCodeInput').value; if(!name || !code) return showToast("名称和代码不能为空", "error"); appData.templates.unshift({ id: 'tpl-' + Date.now(), name: name, desc: desc, code: code }); saveData(); closeModal('tplModal'); renderTemplates(); showToast("武器收录成功！", "success"); }
function deleteTemplate(id) { if(confirm("确定要丢弃这把武器吗？")) { appData.templates = appData.templates.filter(t => t.id !== id); saveData(); renderTemplates(); showToast("已删除", "success"); } }
function renderTemplates() { const list = document.getElementById('tplList'); if (!list) return; list.innerHTML = ''; if(!appData.templates || appData.templates.length === 0) { list.innerHTML = `<div style="text-align:center; color:#999; margin-top:30px; font-size:0.9rem;">暂无板子<br><br>点击右上角 [➕ 新增] 开始收录你的神仙代码</div>`; return; } appData.templates.forEach(t => { list.innerHTML += `<div class="tpl-item"><div class="tpl-header"><span style="font-weight:bold; color:var(--primary);">${escapeHtml(t.name)}</span><div style="display:flex; align-items:center;"><button class="btn-copy" onclick="copyTemplate('${t.id}')">✂️ 复制</button><span class="btn-del" onclick="deleteTemplate('${t.id}')" style="font-size:1.1rem; margin-left:8px;" title="删除">🗑️</span></div></div>${t.desc ? `<p class="tpl-desc" style="margin-bottom:10px;">${escapeHtml(t.desc)}</p>` : ''}<pre class="code-preview" style="background:var(--bg); border:1px solid var(--border); padding:10px; border-radius:6px; font-size:0.75rem; max-height:120px; overflow-y:auto; font-family:'JetBrains Mono'; margin:0;"><code>${escapeHtml(t.code)}</code></pre></div>`; }); }
function copyTemplate(id) { const tpl = appData.templates.find(t => t.id === id); if (!tpl) return; navigator.clipboard.writeText(tpl.code).then(() => { showToast("✅ 已复制：" + tpl.name, "success"); toggleDrawer(); }).catch(err => { showToast("❌ 复制失败", "error"); }); }