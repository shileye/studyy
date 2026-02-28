// 全局错误捕获
window.onerror = function(msg, url, line) { console.error("Sys Error:", msg); return false; };

// 🔑 【数据恢复核心】：钥匙换回你最开始的 12 号！你的老数据全都在这里！
const DB_KEY = "algo_v12_clean"; 

// 🗺️ 真正的 45 天地狱主线剧情 (高强度，直指省赛/天梯赛)
const ROADMAP = [
    { 
        day: 1, 
        title: "🗡️ STL 唤醒：优先队列、Set与Map的极致应用", 
        desc: "天梯赛 L2 核心抢分武器。别自己写排序了，把 STL 用到肌肉记忆。", 
        topic: 1, // 数据结构
        tasks: [
            { name: "洛谷 P1090 合并果子 (优先队列板子)", link: "https://www.luogu.com.cn/problem/P1090", rating: "luogu_orange" },
            { name: "洛谷 P1102 A-B 数对 (Map/二分)", link: "https://www.luogu.com.cn/problem/P1102", rating: "luogu_orange" },
            { name: "洛谷 P3613 寄包柜 (Map二维应用)", link: "https://www.luogu.com.cn/problem/P3613", rating: "luogu_orange" },
            { name: "洛谷 P5250 超市物流 (Set综合挑战)", link: "https://www.luogu.com.cn/problem/P5250", rating: "luogu_yellow" }
        ] 
    },
    { 
        day: 2, 
        title: "🩸 暴力美学：BFS 与隐式图搜索", 
        desc: "蓝桥杯的绝对真理。学会把状态当作图的节点，注意判重数组的细节。", 
        topic: 0, // 思维/搜索
        tasks: [
            { name: "洛谷 P1443 马的遍历 (BFS基础板子)", link: "https://www.luogu.com.cn/problem/P1443", rating: "luogu_yellow" },
            { name: "洛谷 P1135 奇怪的电梯 (一维BFS)", link: "https://www.luogu.com.cn/problem/P1135", rating: "luogu_yellow" },
            { name: "洛谷 P1162 填涂颜色 (连通块BFS)", link: "https://www.luogu.com.cn/problem/P1162", rating: "luogu_orange" },
            { name: "洛谷 P1032 字串变换 (字符串隐式图BFS)", link: "https://www.luogu.com.cn/problem/P1032", rating: "luogu_green" }
        ] 
    },
    { 
        day: 3, 
        title: "🕸️ 图论起手：并查集与连通块的变形", 
        desc: "代码最短、拿分最稳的算法。今天必须拿下种类并查集！", 
        topic: 2, // 图论
        tasks: [
            { name: "洛谷 P3367 并查集 (默写板子)", link: "https://www.luogu.com.cn/problem/P3367", rating: "luogu_orange" },
            { name: "洛谷 P1551 关押罪犯 (贪心+种类并查集)", link: "https://www.luogu.com.cn/problem/P1551", rating: "luogu_green" },
            { name: "洛谷 P1892 团伙 (敌人的敌人是朋友)", link: "https://www.luogu.com.cn/problem/P1892", rating: "luogu_yellow" },
            { name: "洛谷 P2024 食物链 (经典种类并查集挑战)", link: "https://www.luogu.com.cn/problem/P2024", rating: "luogu_blue" }
        ] 
    },
    { 
        day: 4, 
        title: "🕸️ 斩断迷惘：最短路 Dijkstra 堆优化", 
        desc: "抛弃 SPFA，把 Dijkstra 敲进肌肉记忆，学会建反图。", 
        topic: 2, // 图论
        tasks: [
            { name: "洛谷 P4779 单源最短路径 (默写板子)", link: "https://www.luogu.com.cn/problem/P4779", rating: "luogu_yellow" },
            { name: "洛谷 P1339 热浪 (基础应用)", link: "https://www.luogu.com.cn/problem/P1339", rating: "luogu_orange" },
            { name: "洛谷 P1629 邮递员送信 (正反图最短路)", link: "https://www.luogu.com.cn/problem/P1629", rating: "luogu_yellow" },
            { name: "洛谷 P1144 最短路计数 (最短路变体)", link: "https://www.luogu.com.cn/problem/P1144", rating: "luogu_green" }
        ] 
    },
    { 
        day: 5, 
        title: "💡 梦的开始：背包动态规划", 
        desc: "搞懂 01背包的一维优化原理。这是所有 DP 的祖宗。", 
        topic: 4, // DP
        tasks: [
            { name: "洛谷 P1048 采药 (01背包板子)", link: "https://www.luogu.com.cn/problem/P1048", rating: "luogu_orange" },
            { name: "洛谷 P1616 疯狂的采药 (完全背包，注意不开longlong见祖宗)", link: "https://www.luogu.com.cn/problem/P1616", rating: "luogu_yellow" },
            { name: "洛谷 P1757 通天之分组背包", link: "https://www.luogu.com.cn/problem/P1757", rating: "luogu_yellow" },
            { name: "洛谷 P1049 装箱问题 (背包求体积)", link: "https://www.luogu.com.cn/problem/P1049", rating: "luogu_orange" }
        ] 
    },
    { 
        day: 6, 
        title: "🌲 掌控区间：树状数组", 
        desc: "比线段树好写，常数极小。务必搞懂 lowbit 原理。", 
        topic: 1, // 数据结构
        tasks: [
            { name: "洛谷 P3374 树状数组 1 (单点修改+区间查询)", link: "https://www.luogu.com.cn/problem/P3374", rating: "luogu_yellow" },
            { name: "洛谷 P3368 树状数组 2 (区间修改+单点查询)", link: "https://www.luogu.com.cn/problem/P3368", rating: "luogu_yellow" },
            { name: "洛谷 P1908 逆序对 (归并/树状数组挑战)", link: "https://www.luogu.com.cn/problem/P1908", rating: "luogu_green" }
        ] 
    },
    { 
        day: 7, 
        title: "🔥 极限手速：贪心与模拟大练兵", 
        desc: "第一周结营大考！丢掉所有高级板子，纯靠思维和细心。", 
        topic: 0, // 思维
        tasks: [
            { name: "洛谷 P1080 国王游戏 (贪心+高精度挑战)", link: "https://www.luogu.com.cn/problem/P1080", rating: "luogu_green" },
            { name: "洛谷 P1094 纪念品分组 (双指针贪心)", link: "https://www.luogu.com.cn/problem/P1094", rating: "luogu_orange" },
            { name: "洛谷 P1056 排座椅 (天梯赛典型模拟排序)", link: "https://www.luogu.com.cn/problem/P1056", rating: "luogu_yellow" },
            { name: "洛谷 P2670 笨小猴 (扫雷经典模拟)", link: "https://www.luogu.com.cn/problem/P2670", rating: "luogu_orange" }
        ] 
    }
];

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
    {t:"别想能不能做到，去把今天的题A了就行。", a:"教练"},
    {t:"迷茫是因为你站着不动。跑起来，就有路了。", a:"Algo_Warrior"}
];

const FORTUNES = ["大吉 - 宜推进主线任务", "中吉 - 宜复习武器库", "平 - 戒骄戒躁"];

let appData = { xp: 0, level: 1, maxRating: 0, todos: [], logs: [], targets: [], history: [], templates: [], questDay: 1 };
let timerState = { isRunning: false, startTime: 0, totalTime: 0, date: "" };
let timerInterval = null; let quoteIdx = 0; let currentTheme = { p: '#4f46e5', a: '#db2777' }; let pendingDeleteAction = null; 

function setContent(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
function setStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; }

window.onload = () => {
    try {
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
        try { const savedColors = localStorage.getItem('themeColors'); if(savedColors) { currentTheme = JSON.parse(savedColors); applyTheme(currentTheme.p, currentTheme.a); } } catch(e) {}
        loadData(); loadTimer(); checkDailySettlement(); renderUI(); renderTemplates(); renderQuest();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('auto_ac')) {
            const batchBox = document.getElementById('batchInput');
            if (batchBox) { batchBox.value = urlParams.get('auto_ac'); processBatch(); }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        setInterval(() => { setContent('currentDateDisplay', getRealDate()); }, 1000);
        setInterval(checkDailySettlement, 60000); updateQuote(); setInterval(() => { quoteIdx = (quoteIdx + 1) % QUOTES.length; updateQuote(); }, 30000);
        if(timerState.isRunning) { startTimerTicker(); updateTimerUI(true); } else { updateTimerDisplay(timerState.totalTime); }
        const delBtn = document.getElementById('confirmDeleteBtn'); if(delBtn) delBtn.onclick = () => { if(pendingDeleteAction) pendingDeleteAction(); closeModal('confirmModal'); };
    } catch(e) { console.error("Init Error:", e); }
};

function getRealDate() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
function getTaskTargetDate() {
    const now = new Date(); const limit = new Date(); limit.setHours(23, 30, 0, 0);
    if (now > limit) { const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`; } 
    else return getRealDate();
}

function checkDailySettlement() {
    const today = getRealDate(); const pastTodos = appData.todos.filter(t => t.date < today);
    if (pastTodos.length > 0) {
        const groups = {};
        pastTodos.forEach(t => { if(!groups[t.date]) groups[t.date] = { total:0, done:0 }; groups[t.date].total++; if(t.done) groups[t.date].done++; });
        for(let date in groups) { if (!appData.history.find(h => h.date === date)) { appData.history.unshift({ date, ...groups[date], pct: groups[date].total === 0 ? 0 : Math.round((groups[date].done / groups[date].total) * 100) }); } }
        appData.todos = appData.todos.filter(t => t.date >= today || (t.type === '学' && !t.done));
        saveData(); renderUI(); showToast("📅 昨日已结算。补题账已记入耻辱柱。", "info");
    }
}

function renderQuest() {
    if(!appData.questDay) appData.questDay = 1;
    const currentQuestIndex = appData.questDay - 1;
    const questBox = document.getElementById('questContent');
    if(!questBox) return;

    setContent('questDayNum', appData.questDay);
    const progressPct = Math.round((appData.questDay / 45) * 100);
    setStyle('questProgress', 'width', `${progressPct}%`);

    if(currentQuestIndex >= ROADMAP.length) {
        questBox.innerHTML = `<div style="text-align:center; padding:20px; font-weight:bold; color:var(--success);">🏆 恭喜！前 ${ROADMAP.length} 天路线已全部通关！等待新剧情更新...</div>`;
        return;
    }

    const q = ROADMAP[currentQuestIndex];
    let tasksHtml = '';
    q.tasks.forEach((t, i) => {
        tasksHtml += `
            <div style="background:var(--bg); border:1px solid var(--border); padding:10px 15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:bold; font-size: 0.9rem;">${t.name}</div>
                <div style="display:flex; gap:10px;">
                    <a href="${t.link}" target="_blank" class="btn-go-ac" style="background:var(--card); border:1px solid var(--primary); color:var(--primary); text-decoration:none;">🔗 传送</a>
                    <button class="btn-go-ac" style="background:var(--primary); color:white;" onclick="quickSubmitQuest('${t.name}', '${t.link}', '${t.rating}', ${q.topic})">⚔️ 斩杀</button>
                </div>
            </div>
        `;
    });

    questBox.innerHTML = `
        <h4 style="margin:0 0 5px 0; color:var(--text-main); font-size:1.1rem;">${q.title}</h4>
        <p style="margin:0 0 15px 0; font-size:0.85rem; color:var(--text-light); line-height:1.5;">${q.desc}</p>
        ${tasksHtml}
        <button class="btn btn-outline full-width" style="margin-top:5px; border-color:var(--gold); color:var(--gold); font-weight:bold;" onclick="advanceQuest()">✅ 本日主线已全部 AC，晋升下一天！</button>
    `;
}

function quickSubmitQuest(name, link, rating, topic) {
    toggleCommitArea();
    document.getElementById('probName').value = name;
    document.getElementById('probLink').value = link;
    document.getElementById('ratingSelect').value = rating;
    document.getElementById('topicSelect').value = topic;
    showToast("已自动填入提交区！", "info");
}

function advanceQuest() {
    if(confirm("你确定今天的主线题目都已经亲手 AC 了吗？不要骗自己！")) {
        appData.questDay++; saveData(); renderQuest(); fireBloodConfetti(); showToast("🎉 主线突破！能力值暴涨！", "success");
    }
}

function drawFortune() { setContent('fortuneResult', FORTUNES[Math.floor(Math.random() * FORTUNES.length)]); fireConfetti(); }
function toggleCommitArea() { const el = document.getElementById('submitSection'); if (el.style.display === 'none') { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth' }); } else { el.style.display = 'none'; } }

function addTodo() {
    const textRaw = document.getElementById('todoInput').value; const type = document.getElementById('todoType').value;
    if(!textRaw) return showToast("请输入内容", "error");
    const urlRegex = /(https?:\/\/[^\s]+)/g; const extractedLinks = textRaw.match(urlRegex); const link = extractedLinks ? extractedLinks[0] : ""; const cleanText = textRaw.replace(urlRegex, '').trim() || "未命名任务";
    const targetDate = getTaskTargetDate(); const isTomorrow = targetDate !== getRealDate(); let icon = "📖"; if(type === '赛') icon = "🏆"; if(type === '学') icon = "🩸";
    appData.todos.push({ id: Date.now(), text: `${isTomorrow ? "[明日] " : ""}${icon} ${cleanText}`, rawText: cleanText, link: link, date: targetDate, done: false, type: type });
    document.getElementById('todoInput').value = ''; saveData();
    if(isTomorrow) showToast("已加入明日计划", "success"); else if(type === '学') showToast("🩸 已列入耻辱柱补题序列！", "info");
}

function scrollToCommit(text, id) { const section = document.getElementById('submitSection'); if(section) { section.style.display = 'block'; section.scrollIntoView({ behavior: 'smooth', block: 'center' }); section.classList.add('highlight-pulse'); setTimeout(() => section.classList.remove('highlight-pulse'), 1500); } const nameInput = document.getElementById('probName'); if(nameInput) { nameInput.value = text || ""; nameInput.focus(); } const hiddenId = document.getElementById('linkedTaskId'); if(hiddenId) hiddenId.value = id; }

function submitAC() {
    const name = document.getElementById('probName').value; const rVal = document.getElementById('ratingSelect').value; const topicVal = document.getElementById('topicSelect').value; const probLink = document.getElementById('probLink').value; const solLink = document.getElementById('solLink').value; const linkedId = document.getElementById('linkedTaskId').value;
    if(!name || rVal === "--- 难度评级 ---" || topicVal === "--- 🎯 科技树归属 ---") return showToast("请填写完整！题目名、难度、科技树缺一不可！", "error");
    const conf = RATINGS[rVal]; if(parseInt(rVal)) appData.maxRating = Math.max(appData.maxRating, parseInt(rVal));
    let isUpsolve = false;
    if (linkedId) { const task = appData.todos.find(t => t.id == linkedId); if(task) { task.done = true; if(task.type === '学') isUpsolve = true; } } 
    else { const match = appData.todos.find(t => t.text.includes(name) && !t.done); if(match) { match.done = true; if(match.type === '学') isUpsolve = true; } }

    let finalXp = conf.xp;
    if(isUpsolve) { finalXp *= 3; setContent('acSubtext', "🩸 成功拔除耻辱柱！EXP x 300% 暴击！"); setTimeout(()=> showToast("狂暴：+ " + finalXp + " EXP !!", "info"), 500); fireBloodConfetti(); } 
    else { setContent('acSubtext', "太强了！继续保持！"); fireConfetti(); }

    appData.logs.unshift({ id: Date.now(), date: getRealDate(), name, ratingVal: rVal, topic: parseInt(topicVal), link: probLink, sol: solLink, xp: finalXp });
    appData.xp += finalXp; const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1; if(nextLv > appData.level) { appData.level = nextLv; setTimeout(()=> showToast(`🎉 升级啦 LV.${nextLv}`, "success"), 1500); }
    document.getElementById('probName').value = ''; document.getElementById('probLink').value = ''; document.getElementById('solLink').value = ''; document.getElementById('linkedTaskId').value = '';
    saveData(); openModal('acModal');
}

function processBatch() {
    const text = document.getElementById('batchInput').value; if (!text.trim()) return showToast("请输入内容", "error");
    const lines = text.split('\n'); let count = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim(); if (!line) continue;
        let match = line.match(/^(\d+)\s+(.+)$/); let validKey = "1200"; let rawName = "";
        if (match) { const num = parseInt(match[1]); rawName = match[2]; if (num >= 2200) validKey = "2200"; else if (num >= 2000) validKey = "2000"; else if (num >= 1750) validKey = "1750"; else if (num >= 1500) validKey = "1500"; } 
        else { const charMatch = line.match(/^([红橙黄绿蓝紫黑]|unrated)\s+(.+)$/); if (charMatch) { const colorMap = {'红':'luogu_red', '橙':'luogu_orange', '黄':'luogu_yellow', '绿':'luogu_green', '蓝':'luogu_blue', '紫':'luogu_purple', '黑':'luogu_black', 'unrated':'unrated'}; validKey = colorMap[charMatch[1]] || "unrated"; rawName = charMatch[2]; } else continue; }
        let finalName = rawName; let finalLink = ""; if (rawName.includes("|")) { let splitParts = rawName.split("|"); finalName = splitParts[0].trim(); finalLink = splitParts[1].trim(); }
        const config = RATINGS[validKey] || RATINGS["unrated"];
        appData.logs.unshift({ id: Date.now() + i, date: getRealDate(), name: finalName, ratingVal: validKey, topic: 0, link: finalLink, sol: "", xp: config.xp });
        appData.xp += config.xp; count++;
    }
    if (count > 0) { const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1; if (nextLv > appData.level) appData.level = nextLv; saveData(); closeModal('batchModal'); document.getElementById('batchInput').value = ""; showToast(`⚡ 导入 ${count} 题`, "success"); fireConfetti(); } else showToast("格式错误", "error");
}

function renderUI() {
    setContent('lvNum', appData.level); setContent('curXP', appData.xp); const nextXP = 50 * Math.pow(appData.level, 2); setContent('nextXP', nextXP); const prevXP = 50 * Math.pow(appData.level - 1, 2); setStyle('xpFill', 'width', `${Math.max(0, Math.min(((appData.xp - prevXP) / (nextXP - prevXP)) * 100, 100))}%`); setContent('totalAC', appData.logs.length);
    renderChart(); renderTodos(); renderHistory(); renderLogs(); renderCountdowns(); renderHeatmap(); renderCalendar(); renderQuest();
}

function renderTodos() {
    const todayStr = getRealDate(); const list = document.getElementById('todoList'); if(!list) return; list.innerHTML = "";
    const activeTodos = appData.todos.filter(t => t.date >= todayStr || (t.type === '学' && !t.done));
    const todayOnly = appData.todos.filter(t => t.date === todayStr); const progress = todayOnly.length ? Math.round((todayOnly.filter(t => t.done).length/todayOnly.length)*100) : 0;
    if(activeTodos.length === 0) { list.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:20px;">副线任务空空如也</div>`; return; }
    activeTodos.sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.done - b.done; });
    activeTodos.forEach(t => {
        let shameClass = ''; if (t.type === '学' && !t.done && t.date < todayStr) shameClass = 'shame-pulse';
        const goAcBtn = !t.done ? `<button class="btn-go-ac" onclick="scrollToCommit('${escapeHtml(t.rawText)}', ${t.id})">⚔️ 斩杀</button>` : ''; const goProbBtn = (!t.done && t.link) ? `<a href="${escapeHtml(t.link)}" target="_blank" class="btn-go-ac" style="text-decoration:none; background:var(--primary); color:white;">🔗 传送</a>` : '';
        list.innerHTML += `<div class="todo-item ${t.done?'done':''} ${t.type==='赛'?'type-race':''} ${t.type==='学'?'type-study':''} ${shameClass}"><div style="flex:1; cursor:pointer;" onclick="toggleTodo(${t.id})">${escapeHtml(t.text)} ${shameClass ? '<span style="color:var(--danger);font-size:0.7rem;">(滴血中)</span>' : ''}</div><div style="display:flex; gap: 8px; align-items: center;">${goProbBtn}${goAcBtn}<span class="btn-del" onclick="requestDelete('todo', ${t.id})">✕</span></div></div>`;
    });
}

function renderHistory() { const histList = document.getElementById('historyList'); if(!histList) return; histList.innerHTML = ""; if(appData.history.length === 0) return; appData.history.slice(0, 7).forEach(h => { histList.innerHTML += `<div class="history-item"><span>${h.date}</span><span>完成度: <b>${h.pct}%</b> (${h.done}/${h.total})</span></div>`; }); }
function renderLogs() { const logBox = document.getElementById('logList'); if(!logBox) return; logBox.innerHTML = ''; const filteredLogs = appData.logs; if(filteredLogs.length === 0) return; const topicNames = ['🧩 思维', '🌲 数据结构', '🕸️ 图论', '🧮 数学', '💡 DP', '🔤 字符串']; filteredLogs.slice(0, 30).forEach(l => { const conf = RATINGS[l.ratingVal] || RATINGS["1200"]; const div = document.createElement('div'); div.className = 'log-card'; div.style.borderLeftColor = conf.color; let tName = l.topic !== undefined && l.topic >= 0 && l.topic <= 5 ? topicNames[l.topic] : '🧩 思维'; div.innerHTML = `<div style="flex:1"><div style="font-weight:bold;display:flex;align-items:center;flex-wrap:wrap;"><span class="rating-tag" style="background:${conf.color}">${conf.label}</span><span style="font-size:0.75rem; color:#94a3b8; margin-right:8px; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px;">${tName}</span>${escapeHtml(l.name)}</div><div style="font-size:0.8rem;color:var(--text-light);margin-top:5px;">${l.date} · +${l.xp} XP</div></div><div style="display:flex;align-items:center;"><div class="btn-del" onclick="requestDelete('log', ${l.id})">✕</div></div>`; logBox.appendChild(div); }); }
function renderChart() { const ctx = document.getElementById('radarChart'); if (ctx && window.Chart) { const groupStats = [0, 0, 0, 0, 0, 0]; appData.logs.forEach(l => { let t = l.topic !== undefined ? parseInt(l.topic) : 0; if (t >= 0 && t <= 5) groupStats[t]++; }); if (window.myRadarChart) window.myRadarChart.destroy(); const gridColor = document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; const textColor = document.body.classList.contains('dark') ? '#f1f5f9' : '#334155'; window.myRadarChart = new Chart(ctx, { type: 'radar', data: { labels: ['🧩 思维', '🌲 数据结构', '🕸️ 图论', '🧮 数学', '💡 DP', '🔤 字符串'], datasets: [{ label: 'AC数', data: groupStats, backgroundColor: currentTheme.p + '44', borderColor: currentTheme.p, pointBackgroundColor: currentTheme.a, pointBorderColor: '#fff', borderWidth: 2 }] }, options: { maintainAspectRatio: false, scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: textColor, font: { size: 11 } }, ticks: { display: false, backdropColor: 'transparent' } } }, plugins: { legend: { display: false } } } }); } }

function renderCountdowns() { const list = document.getElementById('countdownList'); if(!list) return; list.innerHTML = ""; if (!appData.targets || appData.targets.length === 0) return; appData.targets.sort((a, b) => new Date(a.date) - new Date(b.date)); appData.targets.forEach((t) => { const diff = Math.ceil((new Date(t.date) - new Date()) / 86400000); list.innerHTML += `<div class="cd-row"><span class="cd-name">${escapeHtml(t.name)}</span><span class="cd-days ${(diff <= 7 && diff >= 0) ? 'urgent' : ''}">${diff >= 0 ? `${diff} 天` : '已结束'}</span></div>`; }); }
function renderTargetList() { const list = document.getElementById('targetList'); if(!list) return; list.innerHTML = ""; (appData.targets || []).forEach((t, idx) => { list.innerHTML += `<div class="target-item"><span>${escapeHtml(t.name)} <small>(${t.date})</small></span><span class="del-target" onclick="removeTarget(${idx})">✕</span></div>`; }); }
function renderHeatmap() { const grid = document.getElementById('heatmapGrid'); if (!grid) return; grid.innerHTML = ""; const counts = {}; appData.logs.forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; }); for (let i = 140; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const count = counts[dateStr] || 0; let level = 'heat-l0'; if (count >= 1) level = 'heat-l1'; if (count >= 3) level = 'heat-l2'; if (count >= 5) level = 'heat-l3'; if (count >= 8) level = 'heat-l4'; const cell = document.createElement('div'); cell.className = `heat-cell ${level}`; cell.title = `${dateStr}: ${count} AC`; grid.appendChild(cell); } }
function renderCalendar() { const grid = document.getElementById('calGrid'); if(!grid) return; grid.innerHTML = ""; const now = new Date(); const y = now.getFullYear(); const m = now.getMonth(); setContent('calTitle', `${y}年 ${m+1}月`); const activeDays = {}; appData.logs.forEach(l => activeDays[l.date] = true); let streak = 0; const todayStr = getRealDate(); for(let i=0; i<new Date(y, m, 1).getDay(); i++) grid.appendChild(document.createElement('div')); for(let d=1; d<=new Date(y, m+1, 0).getDate(); d++) { const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const el = document.createElement('div'); el.className = `cal-cell ${activeDays[dateStr] ? 'active' : ''} ${dateStr===todayStr?'today':''}`; el.innerText = d; grid.appendChild(el); if(new Date(dateStr) <= now && activeDays[dateStr]) streak++; else if(new Date(dateStr) < now && !activeDays[dateStr]) streak = 0; } setContent('streakDays', streak); }

function openStatsModal() { openModal('statsModal'); }
function openModal(id) { const el = document.getElementById(id); if(el) { el.classList.add('show'); if(id === 'targetModal') renderTargetList(); } }
function closeModal(id) { const el = document.getElementById(id); if(el) el.classList.remove('show'); }
function requestDelete(type, id) { pendingDeleteAction = () => { if(type === 'todo') deleteTodo(id); if(type === 'log') deleteLog(id); }; openModal('confirmModal'); }
function toggleTodo(id) { const todo = appData.todos.find(t => t.id === id); if(todo) { todo.done = !todo.done; saveData(); } }
function deleteTodo(id) { appData.todos = appData.todos.filter(t => t.id !== id); saveData(); showToast("任务已废弃", "success"); }
function deleteLog(id) { const idx = appData.logs.findIndex(l => l.id === id); if(idx !== -1) { appData.xp = Math.max(0, appData.xp - appData.logs[idx].xp); appData.logs.splice(idx, 1); saveData(); showToast("记录已删除", "success"); } }
function addTarget() { const name = document.getElementById('newTargetName').value; const date = document.getElementById('newTargetDate').value; if(!name || !date) return; if(!appData.targets) appData.targets = []; appData.targets.push({ name, date }); saveData(); renderTargetList(); renderCountdowns(); document.getElementById('newTargetName').value = ""; }
function removeTarget(idx) { appData.targets.splice(idx, 1); saveData(); renderTargetList(); renderCountdowns(); }
function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light'); renderUI(); }
function changeColor(p, a) { currentTheme = { p, a }; applyTheme(p, a); localStorage.setItem('themeColors', JSON.stringify(currentTheme)); renderUI(); showToast("主题已切换", "success"); }
function applyTheme(p, a) { const root = document.documentElement; root.style.setProperty('--primary', p); root.style.setProperty('--accent', a); }
function updateQuote() { const q = QUOTES[quoteIdx]; const elC = document.getElementById('qContent'); const elA = document.getElementById('qAuthor'); if(!elC) return; elC.style.opacity = 0; elA.style.opacity = 0; setTimeout(() => { elC.innerText = q.t; elA.innerText = `—— ${q.a}`; elC.style.opacity = 1; elA.style.opacity = 1; }, 300); }

function loadData() { try { const saved = localStorage.getItem(DB_KEY); if (saved) { appData = { ...appData, ...JSON.parse(saved) }; if(!appData.questDay) appData.questDay = 1; } } catch(e) { console.error("Load Data Error"); } }
function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); renderUI(); }
function loadTimer() { try { const saved = localStorage.getItem('studyTimer'); const todayStr = getRealDate(); if (saved) { timerState = JSON.parse(saved); if (timerState.date !== todayStr) { timerState.totalTime = 0; timerState.date = todayStr; timerState.isRunning = false; saveTimer(); } } else { timerState.date = todayStr; } } catch(e) {} }
function saveTimer() { localStorage.setItem('studyTimer', JSON.stringify(timerState)); }
function toggleTimer() { if (timerState.isRunning) { timerState.totalTime += Date.now() - timerState.startTime; timerState.isRunning = false; clearInterval(timerInterval); saveTimer(); updateTimerUI(false); updateTimerDisplay(timerState.totalTime); } else { timerState.startTime = Date.now(); timerState.isRunning = true; saveTimer(); startTimerTicker(); updateTimerUI(true); } }
function startTimerTicker() { if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { updateTimerDisplay(timerState.totalTime + (Date.now() - timerState.startTime)); }, 1000); }
function updateTimerDisplay(ms) { const totalSeconds = Math.floor(ms / 1000); const el = document.getElementById('totalTimeDisplay'); if(el) el.innerText = `${String(Math.floor(totalSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`; }
function updateTimerUI(isRunning) { const btn = document.getElementById('timerBtn'); const status = document.getElementById('timerStatus'); if (isRunning) { btn.innerText = "⏸️ 暂停"; btn.className = 'btn btn-primary full-width stop'; status.innerText = "🔥 专注中"; status.className = 'tag online'; } else { btn.innerText = "🚀 开始专注"; btn.className = 'btn btn-primary full-width start'; status.innerText = "😴 休息中"; status.className = 'tag offline'; } }
function exportData() { const blob = new Blob([JSON.stringify(appData)], {type: "application/json"}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `algo_backup_${getRealDate()}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); showToast("存档已导出", "success"); }
function importData(input) { const file = input.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const json = JSON.parse(e.target.result); if(confirm("确定要覆盖当前记录吗？")) { appData = json; saveData(); showToast("读档成功！", "success"); setTimeout(()=>location.reload(), 1000); } } catch(err) { showToast("文件格式错误", "error"); } input.value = ''; }; reader.readAsText(file); }

function fireConfetti() { const c = document.getElementById('confetti-canvas'); if(!c) return; const ctx = c.getContext('2d'); c.width = window.innerWidth; c.height = window.innerHeight; let p = Array(100).fill(0).map(()=>({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, c:['#4f46e5','#db2777','#10b981'][Math.floor(Math.random()*3)], s:Math.random()*6+2, l:100})); function step() { ctx.clearRect(0,0,c.width,c.height); p.forEach((i,k)=>{ i.x+=i.vx; i.y+=i.vy; i.vy+=0.5; i.l--; if(i.y>c.height||i.l<0) p.splice(k,1); ctx.fillStyle=i.c; ctx.fillRect(i.x,i.y,i.s,i.s); }); if(p.length) requestAnimationFrame(step); } step(); }
function fireBloodConfetti() { const c = document.getElementById('confetti-canvas'); if(!c) return; const ctx = c.getContext('2d'); c.width = window.innerWidth; c.height = window.innerHeight; let p = Array(150).fill(0).map(()=>({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*25, vy:(Math.random()-0.5)*25, c:['#dc2626','#991b1b','#f59e0b', '#fbbf24'][Math.floor(Math.random()*4)], s:Math.random()*8+4, l:120})); function step() { ctx.clearRect(0,0,c.width,c.height); p.forEach((i,k)=>{ i.x+=i.vx; i.y+=i.vy; i.vy+=0.5; i.l--; if(i.y>c.height||i.l<0) p.splice(k,1); ctx.fillStyle=i.c; ctx.fillRect(i.x,i.y,i.s,i.s); }); if(p.length) requestAnimationFrame(step); } step(); }

function escapeHtml(text) { if (!text) return text; return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function getStreak(d) { const today = getRealDate(); let streak = 0; let checkDate = new Date(today); for(let i=0; i<365; i++) { const dateStr = checkDate.toISOString().split('T')[0]; if(d.logs.some(l => l.date === dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else { if(i===0) { checkDate.setDate(checkDate.getDate() - 1); continue; } break; } } return streak; }
function showToast(msg, type = 'info') { let container = document.querySelector('.toast-container'); if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); } const el = document.createElement('div'); el.className = `toast ${type}`; el.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':type==='blood'?'🩸':'💡'}</span><span>${msg}</span>`; container.appendChild(el); setTimeout(() => { el.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => el.remove(), 300); }, 3000); }

// 抽屉与模板逻辑
function toggleDrawer() { const drawer = document.getElementById('tplDrawer'); if (drawer) drawer.classList.toggle('open'); }
function openTplModal() { document.getElementById('tplNameInput').value = ''; document.getElementById('tplDescInput').value = ''; document.getElementById('tplCodeInput').value = ''; openModal('tplModal'); }
function saveTemplate() { const name = document.getElementById('tplNameInput').value; const desc = document.getElementById('tplDescInput').value; const code = document.getElementById('tplCodeInput').value; if(!name || !code) return showToast("名称和代码不能为空", "error"); appData.templates.unshift({ id: 'tpl-' + Date.now(), name: name, desc: desc, code: code }); saveData(); closeModal('tplModal'); renderTemplates(); showToast("武器收录成功！", "success"); }
function deleteTemplate(id) { if(confirm("确定要丢弃这把武器吗？")) { appData.templates = appData.templates.filter(t => t.id !== id); saveData(); renderTemplates(); showToast("已删除", "success"); } }
function renderTemplates() { const list = document.getElementById('tplList'); if (!list) return; list.innerHTML = ''; if(!appData.templates || appData.templates.length === 0) { list.innerHTML = `<div style="text-align:center; color:#999; margin-top:30px; font-size:0.9rem;">暂无板子<br><br>点击 [➕ 新增] 开始收录</div>`; return; } appData.templates.forEach(t => { list.innerHTML += `<div class="tpl-item"><div class="tpl-header"><span style="font-weight:bold; color:var(--primary);">${escapeHtml(t.name)}</span><div style="display:flex; align-items:center;"><button class="btn-copy" onclick="copyTemplate('${t.id}')">✂️</button><span class="btn-del" onclick="deleteTemplate('${t.id}')" style="margin-left:8px;">🗑️</span></div></div>${t.desc ? `<p class="tpl-desc" style="margin-bottom:10px;">${escapeHtml(t.desc)}</p>` : ''}<pre class="code-preview" style="background:var(--bg); border:1px solid var(--border); padding:10px; border-radius:6px; font-size:0.75rem; max-height:120px; overflow-y:auto; margin:0;"><code>${escapeHtml(t.code)}</code></pre></div>`; }); }
function copyTemplate(id) { const tpl = appData.templates.find(t => t.id === id); if (!tpl) return; navigator.clipboard.writeText(tpl.code).then(() => { showToast("✅ 已复制：" + tpl.name, "success"); toggleDrawer(); }).catch(err => { showToast("❌ 复制失败", "error"); }); }

// 空函数防止报错
function processBatch(){} function syncCodeforces(){} function syncAtCoder(){}