const DB_KEY = "algo_v7_cow";

// 配置库
const QUOTES = [
    {t:"十年生死两茫茫，不思量，自难忘。", a:"苏轼"}, {t:"欲买桂花同载酒，终不似，少年游。", a:"刘过"},
    {t:"人生若只如初见，何事秋风悲画扇。", a:"纳兰性德"}, {t:"代码写得再好，也 catch 不到你抛出的异常。", a:"Anon"},
    {t:"我们都在阴沟里，但仍有人仰望星空。", a:"王尔德"}, {t:"简单的事情重复做，你就是专家。", a:"刻意练习"},
    {t:"你想要的生活，都在你现在的努力里。", a:"加油"}, {t:"菜是原罪，练是救赎。", a:"小羊肖恩"},
    {t:"Talk is cheap. Show me the code.", a:"Linus"}, {t:"人生如逆旅，我亦是行人。", a:"苏轼"},
    {t:"未雨绸缪，是程序员的顶级浪漫。", a:"架构"}, {t:"为了看一眼山顶的风景，我愿意流干汗水。", a:"攀登者"}
];

const RATINGS = {
    "1200": { color: "#9ca3af", label: "< 1400", xp: 10 },
    "1500": { color: "#2dd4bf", label: "1400-1600", xp: 25 },
    "1750": { color: "#3b82f6", label: "1600-1900", xp: 45 },
    "2000": { color: "#a855f7", label: "1900-2100", xp: 70 },
    "2200": { color: "#ef4444", label: "2100+", xp: 100 }
};

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

let appData = { xp: 0, level: 1, maxRating: 0, todos: [], logs: [] };
let quoteIdx = 0;
// 默认主题色
let currentTheme = { p: '#4f46e5', a: '#db2777' };

window.onload = () => {
    // 恢复夜间模式
    if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
    // 恢复自定义颜色
    const savedColors = localStorage.getItem('themeColors');
    if(savedColors) {
        currentTheme = JSON.parse(savedColors);
        applyTheme(currentTheme.p, currentTheme.a);
    }

    loadData();
    renderUI();
    updateQuote();
    setInterval(() => { quoteIdx = (quoteIdx + 1) % QUOTES.length; updateQuote(); }, 30000);
};

// --- 主题切换逻辑 ---
function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    renderUI(); 
}

function changeColor(primary, accent) {
    currentTheme = { p: primary, a: accent };
    applyTheme(primary, accent);
    localStorage.setItem('themeColors', JSON.stringify(currentTheme));
    renderUI(); // 重绘图表以适配新颜色
    showToast("主题色已切换！", "success");
}

function applyTheme(p, a) {
    const root = document.documentElement;
    root.style.setProperty('--primary', p);
    root.style.setProperty('--accent', a);
}

// --- 数据逻辑 ---
function updateQuote() {
    const q = QUOTES[quoteIdx];
    const elC = document.getElementById('qContent'), elA = document.getElementById('qAuthor');
    if(!elC) return;
    elC.style.opacity = 0; elA.style.opacity = 0;
    setTimeout(() => { elC.innerText = q.t; elA.innerText = `—— ${q.a}`; elC.style.opacity = 1; elA.style.opacity = 1; }, 300);
}

function loadData() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) appData = JSON.parse(saved);
}
function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); renderUI(); }

// --- 备份与恢复 (新增) ---
function exportData() {
    const dataStr = JSON.stringify(appData);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `algo_warrior_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("存档已导出！请妥善保存", "success");
}

function importData(input) {
    const file = input.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            if(json.logs && json.xp !== undefined) {
                if(confirm("确定要覆盖当前记录吗？这将无法撤销！")) {
                    appData = json;
                    saveData();
                    showToast("读档成功！欢迎回来，勇士", "success");
                }
            } else {
                showToast("存档文件格式错误", "error");
            }
        } catch(err) {
            showToast("文件解析失败", "error");
        }
        input.value = ''; // 清空以允许重复上传同一文件
    };
    reader.readAsText(file);
}

function getStreak(d) { return parseInt(document.getElementById('streakDays')?.innerText || 0); }
function getTodayCount(d) {
    const today = new Date().toISOString().split('T')[0];
    return d.logs.filter(l => l.date.startsWith(today)).length;
}

function addTodo() {
    const val = document.getElementById('todoInput').value;
    if (!val) return;
    appData.todos.push({ id: Date.now(), text: val, date: new Date().toISOString().split('T')[0], done: false });
    document.getElementById('todoInput').value = '';
    saveData();
}

function deleteLog(id) {
    if(!confirm("确定要删除这条记录吗？XP也会被扣除哦！")) return;
    const idx = appData.logs.findIndex(l => l.id === id);
    if(idx !== -1) {
        const log = appData.logs[idx];
        appData.xp = Math.max(0, appData.xp - log.xp);
        const lv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
        appData.level = lv;
        appData.logs.splice(idx, 1);
        saveData();
    }
}

function deleteTodo(id) {
    if(!confirm("删除这个任务？")) return;
    appData.todos = appData.todos.filter(t => t.id !== id);
    saveData();
}

function setPendingTodo(text) {
    document.getElementById('probName').value = text;
    document.getElementById('submitZone').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('probName').focus();
}

function submitAC() {
    const name = document.getElementById('probName').value;
    if (!name) return showToast("题目名称必填", "error");
    
    const rVal = document.getElementById('ratingSelect').value;
    const config = RATINGS[rVal];
    
    if(rVal==="2200") appData.maxRating=Math.max(appData.maxRating,2200);
    else if(rVal==="2000") appData.maxRating=Math.max(appData.maxRating,2000);
    else if(rVal==="1750") appData.maxRating=Math.max(appData.maxRating,1750);
    else if(rVal==="1500") appData.maxRating=Math.max(appData.maxRating,1500);

    const match = appData.todos.find(t => t.text === name && !t.done);
    if (match) match.done = true;

    appData.logs.unshift({
        id: Date.now(), date: new Date().toISOString(),
        name, ratingVal: rVal,
        link: document.getElementById('probLink').value,
        sol: document.getElementById('solLink').value,
        xp: config.xp
    });
    appData.xp += config.xp;
    
    const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
    if (nextLv > appData.level) { appData.level = nextLv; showToast(`升级啦！Lv.${nextLv}`, "success"); }

    document.getElementById('probName').value = '';
    document.getElementById('probLink').value = '';
    document.getElementById('solLink').value = '';
    
    saveData();
    showACModal();
    fireConfetti();
}

function showACModal() {
    const modal = document.getElementById('acModal');
    modal.classList.add('show');
}
function closeAC() {
    const modal = document.getElementById('acModal');
    modal.classList.remove('show');
}

function generateAIPrompt() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = appData.logs.filter(l => l.date.startsWith(today));
    if (todayLogs.length === 0) return showToast("今天还没做题呢！", "info");
    
    const problemList = todayLogs.map(l => `- ${l.name} (${RATINGS[l.ratingVal].label})`).join('\n');
    const prompt = `我今天练习了算法，做了以下 ${todayLogs.length} 道题目：\n${problemList}\n\n我的目前等级是 LV.${appData.level}。请帮我复盘今天的学习情况：\n1. 用幽默鼓励的语气评价。\n2. 给出接下来的学习建议。\n3. 如果我虐菜或受虐，请点醒我。\n4. 结尾给一句扎心的激励语。`;
    
    navigator.clipboard.writeText(prompt).then(() => showToast("🤖 AI 提示词已复制！", "success"));
}

function copyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = appData.logs.filter(l => l.date.startsWith(today));
    if(todayLogs.length === 0) return showToast("今天无记录", "error");
    
    let stats = {};
    todayLogs.forEach(l => { const label = RATINGS[l.ratingVal].label; stats[label] = (stats[label] || 0) + 1; });
    const statStr = Object.entries(stats).map(([k,v]) => `${k} x${v}`).join(' | ');
    const listText = todayLogs.map(l => {
        const label = RATINGS[l.ratingVal].label; const linkText = l.sol ? l.sol : '暂无链接';
        return `✅ [${label}] ${l.name}\n🔗 ${linkText}`;
    }).join('\n\n');
    
    const quoteText = document.getElementById('qContent') ? document.getElementById('qContent').innerText : "Code & Sorrow";
    const text = `📅 ${today} 算法打卡\n🔥 总计: ${todayLogs.length}题\n📊 分布: ${statStr}\n--------------------\n${listText}\n--------------------\n"${quoteText}"`;
    
    navigator.clipboard.writeText(text).then(() => showToast("📊 PRO 战报已复制！", "success"));
}

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

    const stats = { "1200":0, "1500":0, "1750":0, "2000":0, "2200":0 };
    appData.logs.forEach(l => { if(stats[l.ratingVal]!==undefined) stats[l.ratingVal]++; });
    
    const ctx = document.getElementById('radarChart');
    if (ctx && window.Chart) {
        const levelData = [ stats["1200"], stats["1500"], stats["1750"], stats["2000"], stats["2200"] ];
        if (window.myRadarChart) window.myRadarChart.destroy();
        const isDark = document.body.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        // 动态使用当前主题色
        const themeColor = currentTheme.p;
        
        window.myRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['新手', '普及', '提高', '大师', '传奇'],
                datasets: [{
                    label: 'AC数量',
                    data: levelData,
                    backgroundColor: themeColor + '33', // 加透明度
                    borderColor: themeColor,
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
                        pointLabels: { color: textColor, font: { size: 10, family: 'JetBrains Mono' } },
                        ticks: { display: false, backdropColor: 'transparent' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    const statHTML = Object.keys(RATINGS).map(k => {
        if(stats[k]===0) return '';
        return `<div class="rs-row"><span style="display:flex;align-items:center"><div class="dot" style="background:${RATINGS[k].color}"></div>${RATINGS[k].label}</span><b>${stats[k]}</b></div>`;
    }).join('');
    document.getElementById('ratingStatsBox').innerHTML = statHTML;

    // --- 搜索过滤逻辑 ---
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const logBox = document.getElementById('logList');
    logBox.innerHTML = '';
    
    // 过滤 + 限制显示数量
    const filteredLogs = appData.logs.filter(l => l.name.toLowerCase().includes(searchText));
    
    if(filteredLogs.length === 0) {
        logBox.innerHTML = '<div style="text-align:center; color:#999; margin-top:20px;">空空如也 🍂</div>';
    }

    filteredLogs.slice(0, 30).forEach(l => {
        const conf = RATINGS[l.ratingVal];
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
    
    const todoBox = document.getElementById('todoList');
    todoBox.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    const showTodos = appData.todos.filter(t => !t.done || t.date === today);
    if(showTodos.length===0) todoBox.innerHTML='<div style="color:#999;font-size:0.8rem">今日任务已清空</div>';
    showTodos.forEach(t => {
        todoBox.innerHTML += `
        <div class="todo-item ${t.done?'done':''}">
            <div style="display:flex;align-items:center;flex:1;">
                <span class="btn-del" style="margin-left:0;margin-right:8px;font-size:1rem;" onclick="deleteTodo(${t.id})">✕</span>
                <span style="font-size:0.9rem">${escapeHtml(t.text)}</span>
            </div>
            ${!t.done?`<button class="btn btn-ai" style="padding:4px 8px;font-size:0.75rem" onclick="setPendingTodo('${escapeHtml(t.text)}')">提交</button>`:'<span>✔️</span>'}
        </div>`;
    });

    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';
    const now = new Date();
    const y = now.getFullYear(); const m = now.getMonth();
    document.getElementById('calTitle').innerText = `${y}年 ${m+1}月`;
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    
    const calStats = {};
    appData.logs.forEach(l => { calStats[l.date.split('T')[0]] = 'active'; });
    appData.logs.forEach(l => { if (parseInt(l.ratingVal) >= 2000) calStats[l.date.split('T')[0]] = 'gold'; });

    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
    let streak = 0; const todayStr = now.toISOString().split('T')[0];
    for(let d=1; d<=daysInMonth; d++) {
        const dayStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cell = document.createElement('div');
        cell.className = `cal-cell ${calStats[dayStr] || ''}`;
        if (dayStr === todayStr) cell.classList.add('today');
        cell.innerText = d; grid.appendChild(cell);
        if (new Date(dayStr) <= now && calStats[dayStr]) streak++;
        else if (new Date(dayStr) < now && !calStats[dayStr]) streak = 0;
    }
    document.getElementById('streakDays').innerText = streak;
}

function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let particles = [];
    const colors = ['#4f46e5', '#db2777', '#f59e0b', '#10b981', '#3b82f6'];
    for(let i=0; i<150; i++) {
        particles.push({
            x: window.innerWidth / 2, y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15 - 5,
            color: colors[Math.floor(Math.random()*colors.length)],
            size: Math.random() * 6 + 2, life: 120
        });
    }
    function animate() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach((p, index) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
            ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
            if(p.life <= 0) particles.splice(index, 1);
        });
        if(particles.length > 0) requestAnimationFrame(animate);
    }
    animate();
}

function escapeHtml(text) {
    if (!text) return text;
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : '💡');
    el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    
    container.appendChild(el);
    
    setTimeout(() => {
        el.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// --- 批量处理逻辑 ---
function openBatchModal() {
    const modal = document.getElementById('batchModal');
    modal.classList.add('show');
    modal.onclick = (e) => {
        if(e.target === modal) closeBatchModal();
    }
}

function closeBatchModal() {
    document.getElementById('batchModal').classList.remove('show');
}

function processBatch() {
    const text = document.getElementById('batchInput').value;
    if (!text.trim()) return showToast("请输入内容", "error");

    const lines = text.split('\n');
    let count = 0;
    let totalXP = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(/^(\d+)\s+(.+)$/);
        
        if (match) {
            let ratingStr = match[1];
            const name = match[2];
            let validKey = "1200"; 
            const num = parseInt(ratingStr);
            if (num >= 2200) validKey = "2200";
            else if (num >= 2000) validKey = "2000";
            else if (num >= 1750) validKey = "1750";
            else if (num >= 1500) validKey = "1500";
            else validKey = "1200";

            const config = RATINGS[validKey];
            appData.maxRating = Math.max(appData.maxRating, num);
            appData.logs.unshift({
                id: Date.now() + i, 
                date: new Date().toISOString(),
                name: name,
                ratingVal: validKey,
                link: "",
                sol: "",
                xp: config.xp
            });
            appData.xp += config.xp;
            totalXP += config.xp;
            count++;
        }
    }

    if (count > 0) {
        const nextLv = Math.floor(Math.sqrt(appData.xp / 50)) + 1;
        if (nextLv > appData.level) { appData.level = nextLv; }
        saveData();
        closeBatchModal();
        document.getElementById('batchInput').value = "";
        showToast(`成功导入 ${count} 题！获得 ${totalXP} XP`, "success");
        fireConfetti();
    } else {
        showToast("格式无法识别，请使用：分数 题目名", "error");
    }
}