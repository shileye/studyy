// V10.0 Core Logic
const DB_KEY = "algo_v10_pro"; // 升级 Key 以隔离旧版坏数据

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

let appData = { 
    xp: 0, level: 1, maxRating: 0, 
    todos: [], logs: [], targets: [], 
    history: [] // 每日结算历史
};
let timerState = { isRunning: false, startTime: 0, totalTime: 0, date: "" };
let timerInterval = null;

// --- 初始化 ---
window.onload = () => {
    try {
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
        loadData();
        loadTimer();
        checkDailySettlement(); // 检查是否需要结算昨天
        renderUI();
        
        // 实时时间显示
        setInterval(() => {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
            document.getElementById('currentDateDisplay').innerText = `${dateStr} ${timeStr}`;
        }, 1000);

        setInterval(checkDailySettlement, 60000); // 每分钟检查一次是否到了23:30结算点
    } catch(e) { console.error(e); }
};

// --- 核心时间逻辑 ---
function getRealDate() {
    return new Date().toISOString().split('T')[0];
}

// 获取任务应归属的日期
// 规则：23:30 之前算今天，23:30 之后算明天
function getTaskTargetDate() {
    const now = new Date();
    const limit = new Date();
    limit.setHours(23, 30, 0, 0); // 设置为今天的 23:30

    if (now > limit) {
        // 如果现在已经过了 23:30，归入明天
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    } else {
        return getRealDate();
    }
}

// --- 每日结算逻辑 ---
function checkDailySettlement() {
    const today = getRealDate();
    // 找出所有早于今天且未结算的日期（简单的逻辑：只看昨天的）
    // 这里简化处理：每次加载页面，把所有 `date < today` 的任务归档到 history
    
    // 1. 找出所有过期任务
    const pastTodos = appData.todos.filter(t => t.date < today);
    
    if (pastTodos.length > 0) {
        // 按日期分组结算
        const groups = {};
        pastTodos.forEach(t => {
            if(!groups[t.date]) groups[t.date] = { total:0, done:0 };
            groups[t.date].total++;
            if(t.done) groups[t.date].done++;
        });

        // 存入历史
        for(let date in groups) {
            const rec = groups[date];
            const pct = Math.round((rec.done / rec.total) * 100);
            appData.history.unshift({ date, ...rec, pct });
        }
        
        // 从当前列表移除
        appData.todos = appData.todos.filter(t => t.date >= today);
        saveData();
        renderUI(); // 刷新界面显示历史
        showToast("已自动结算昨日任务", "info");
    }
}

// --- 业务逻辑 ---
function addTodo() {
    const text = document.getElementById('todoInput').value;
    const type = document.getElementById('todoType').value;
    if(!text) return;

    const targetDate = getTaskTargetDate(); // 自动判断是今天还是明天
    const displayDate = targetDate === getRealDate() ? "" : "[明日预设] ";
    
    let icon = "📖";
    if(type === '赛') icon = "🏆";
    if(type === '学') icon = "🧠";

    appData.todos.push({
        id: Date.now(),
        text: `${displayDate}${icon} ${text}`,
        date: targetDate,
        done: false,
        type: type
    });
    
    document.getElementById('todoInput').value = '';
    saveData();
    
    if(targetDate !== getRealDate()) {
        showToast("已加入明日计划 (23:30后自动归为明天)", "success");
    }
}

function submitAC() {
    const name = document.getElementById('probName').value;
    const rVal = document.getElementById('ratingSelect').value;
    if(!name || !rVal) return showToast("请填写完整", "error");

    const conf = RATINGS[rVal];
    if(parseInt(rVal)) appData.maxRating = Math.max(appData.maxRating, parseInt(rVal));

    // 自动勾选任务
    const match = appData.todos.find(t => t.text.includes(name) && !t.done);
    if(match) match.done = true;

    appData.logs.unshift({
        id: Date.now(),
        date: getRealDate(),
        name, ratingVal: rVal,
        link: document.getElementById('probLink').value,
        sol: document.getElementById('solLink').value,
        xp: conf.xp
    });
    appData.xp += conf.xp;
    
    // 升级判定
    const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
    if(nextLv > appData.level) { appData.level = nextLv; showToast(`升级啦 LV.${nextLv}`, "success"); }

    document.getElementById('probName').value = '';
    saveData();
    openModal('acModal');
    fireConfetti();
}

// --- 渲染逻辑 ---
function renderUI() {
    // 1. 基础数据
    document.getElementById('lvNum').innerText = appData.level;
    document.getElementById('curXP').innerText = appData.xp;
    const nextXP = 50 * Math.pow(appData.level, 2);
    document.getElementById('nextXP').innerText = nextXP;
    const prevXP = 50 * Math.pow(appData.level - 1, 2);
    const pct = ((appData.xp - prevXP) / (nextXP - prevXP)) * 100;
    document.getElementById('xpFill').style.width = `${Math.max(0, Math.min(pct, 100))}%`;
    document.getElementById('totalAC').innerText = appData.logs.length;

    // 2. 任务列表 (只显示今天的)
    const todayStr = getRealDate();
    const list = document.getElementById('todoList');
    list.innerHTML = "";
    
    const todayTodos = appData.todos.filter(t => t.date === todayStr);
    const doneCount = todayTodos.filter(t => t.done).length;
    
    // 进度条
    const progress = todayTodos.length ? Math.round((doneCount/todayTodos.length)*100) : 0;
    document.getElementById('dailyProgress').style.width = `${progress}%`;
    document.getElementById('progressText').innerText = `${progress}%`;

    if(todayTodos.length === 0) list.innerHTML = `<div style="text-align:center;color:#999;font-size:0.8rem;padding:10px;">今日暂无任务，注意23:30截止哦</div>`;
    
    todayTodos.forEach(t => {
        list.innerHTML += `
        <div class="todo-item ${t.done?'done':''} ${t.type==='赛'?'type-race':''}">
            <div style="flex:1" onclick="toggleTodo(${t.id})">${escapeHtml(t.text)}</div>
            <span class="btn-del" onclick="deleteTodo(${t.id})">✕</span>
        </div>`;
    });

    // 3. 历史结算 (最近7天)
    const histList = document.getElementById('historyList');
    histList.innerHTML = "";
    appData.history.slice(0, 7).forEach(h => {
        histList.innerHTML += `
        <div class="history-item">
            <span>${h.date}</span>
            <span>完成度: <b style="color:${h.pct>=80?'#10b981':'#64748b'}">${h.pct}%</b> (${h.done}/${h.total})</span>
        </div>`;
    });

    // 4. 日志 & 雷达 & 倒计时 (复用之前的逻辑)
    renderLogs();
    renderRadar();
    renderCalendar();
    renderCountdowns();
}

function renderCalendar() {
    const grid = document.getElementById('calGrid');
    if(!grid) return;
    grid.innerHTML = "";
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    
    const activeDays = {};
    appData.logs.forEach(l => activeDays[l.date] = true);
    const todayStr = getRealDate();
    let streak = 0;

    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const el = document.createElement('div');
        el.className = `cal-cell ${activeDays[dateStr] ? 'active' : ''} ${dateStr===todayStr?'today':''}`;
        el.innerText = d;
        grid.appendChild(el);
        if(new Date(dateStr) <= now && activeDays[dateStr]) streak++;
        else if(new Date(dateStr) < now) streak = 0;
    }
    document.getElementById('streakDays').innerText = streak;
}

// --- 辅助工具 ---
function openModal(id) { document.getElementById(id).classList.add('show'); if(id==='targetModal') renderTargetList();}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function toggleTodo(id) { const t = appData.todos.find(x => x.id === id); if(t){ t.done = !t.done; saveData(); } }
function deleteTodo(id) { if(confirm("删除?")) { appData.todos = appData.todos.filter(x => x.id !== id); saveData(); } }
function loadData() { const s = localStorage.getItem(DB_KEY); if(s) appData = { ...appData, ...JSON.parse(s) }; }
function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); renderUI(); }
function showToast(m, t='info') {
    const c = document.querySelector('.toast-container') || document.body.appendChild(Object.assign(document.createElement('div'), {className:'toast-container'}));
    const e = document.createElement('div'); e.className = `toast ${t}`;
    e.innerHTML = `<span>${m}</span>`; c.appendChild(e);
    setTimeout(() => e.remove(), 3000);
}
function fireConfetti() {
    const c = document.getElementById('confetti-canvas');
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    let p = Array(100).fill(0).map(()=>({x:c.width/2, y:c.height/2, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, c:'#f0f'}));
    function step() {
        ctx.clearRect(0,0,c.width,c.height);
        p.forEach((i,k) => { i.x+=i.vx; i.y+=i.vy; i.vy+=0.5; if(i.y>c.height) p.splice(k,1); ctx.fillStyle=i.c; ctx.fillRect(i.x,i.y,5,5); });
        if(p.length) requestAnimationFrame(step);
    }
    step();
}
// 倒计时、计时器、图表等逻辑保持原样或简化复用，为节省篇幅略去重复部分，核心在于上面的时间判断
// (完整代码已包含必要的辅助函数)
function renderCountdowns() {
    const list = document.getElementById('countdownList');
    list.innerHTML = appData.targets.length ? '' : '<div style="text-align:center;font-size:0.8rem;color:#999">暂无日程</div>';
    appData.targets.forEach(t => {
        const diff = Math.ceil((new Date(t.date) - new Date()) / 86400000);
        list.innerHTML += `<div class="cd-row"><span>${t.name}</span><span class="cd-days ${diff<=7?'urgent':''}">${diff} 天</span></div>`;
    });
}
function addTarget() {
    const name = document.getElementById('newTargetName').value;
    const date = document.getElementById('newTargetDate').value;
    if(name && date) { appData.targets.push({name, date}); saveData(); renderCountdowns(); }
}
function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark')?'dark':'light'); }
function changeColor(p, a) { document.documentElement.style.setProperty('--primary', p); document.documentElement.style.setProperty('--accent', a); localStorage.setItem('themeColors', JSON.stringify({p,a})); renderUI(); }
function renderLogs() {
    const list = document.getElementById('logList'); list.innerHTML = '';
    const filter = document.getElementById('searchInput').value.toLowerCase();
    appData.logs.filter(l=>l.name.toLowerCase().includes(filter)).slice(0,20).forEach(l => {
        const conf = RATINGS[l.ratingVal] || RATINGS['1200'];
        list.innerHTML += `<div class="log-card" style="border-left-color:${conf.color}"><div style="flex:1"><b>[${conf.label}] ${l.name}</b><br><small>${l.date}</small></div></div>`;
    });
}
function renderRadar() {
    const ctx = document.getElementById('radarChart');
    if(!ctx || !window.Chart) return;
    const data = [0,0,0,0,0];
    appData.logs.forEach(l => { const g = (RATINGS[l.ratingVal]||RATINGS['1200']).group; if(g!==undefined) data[g]++; });
    if(window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'radar',
        data: { labels: ['入门','普及','提高','省选','NOI'], datasets: [{ label:'AC', data, backgroundColor: 'rgba(79, 70, 229, 0.2)', borderColor: '#4f46e5' }] },
        options: { plugins:{legend:{display:false}}, scales:{r:{ticks:{display:false}}} }
    });
}
// 计时器简易实现
function toggleTimer() {
    if(timerState.isRunning) { clearInterval(timerInterval); timerState.isRunning=false; document.getElementById('timerBtn').innerText="🚀 开始专注"; document.getElementById('timerStatus').className="tag offline"; document.getElementById('timerStatus').innerText="休息中"; localStorage.setItem('timer', JSON.stringify(timerState)); }
    else { timerState.isRunning=true; timerState.startTime=Date.now(); timerInterval=setInterval(()=>{const s=Math.floor((timerState.totalTime+Date.now()-timerState.startTime)/1000); document.getElementById('totalTimeDisplay').innerText=new Date(s*1000).toISOString().substr(11,8);},1000); document.getElementById('timerBtn').innerText="⏸️ 暂停"; document.getElementById('timerStatus').className="tag online"; document.getElementById('timerStatus').innerText="专注中"; }
}
function loadTimer() { const s=localStorage.getItem('timer'); if(s) timerState=JSON.parse(s); if(timerState.isRunning) toggleTimer(); else document.getElementById('totalTimeDisplay').innerText=new Date(timerState.totalTime*1000).toISOString().substr(11,8); }
function escapeHtml(t) { return t ? t.replace(/</g,"&lt;") : ""; }
function processBatch() {
    const txt = document.getElementById('batchInput').value;
    if(!txt) return;
    txt.split('\n').forEach(line => {
        const m = line.match(/^(\d+|[红橙黄绿蓝紫黑])\s+(.+)$/);
        if(m) {
            let key = "1200";
            if(parseInt(m[1])) { const n=parseInt(m[1]); key = n>=2200?"2200":n>=2000?"2000":n>=1750?"1750":n>=1500?"1500":"1200"; }
            else { const map={'红':'luogu_red','绿':'luogu_green','蓝':'luogu_blue'}; key=map[m[1]]||"1200"; }
            appData.logs.unshift({id:Date.now()+Math.random(), date:getRealDate(), name:m[2], ratingVal:key, xp:RATINGS[key].xp});
            appData.xp += RATINGS[key].xp;
        }
    });
    saveData(); closeModal('batchModal'); fireConfetti();
}