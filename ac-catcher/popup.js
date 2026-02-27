document.getElementById('catchBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeProblemName
  }, (results) => {
     if (results && results[0] && results[0].result) {
         // 拼装格式
         let finalString = "1200 " + results[0].result;
         
         // 核心修复：我们在 popup（插件弹窗）的环境里执行复制！
         // 因为弹窗目前是你鼠标点击聚焦的地方，浏览器绝不会拦截它！
         navigator.clipboard.writeText(finalString).then(() => {
             document.getElementById('status').innerText = "✅ 复制成功：\n" + finalString;
         }).catch(err => {
             document.getElementById('status').innerText = "❌ 复制失败: " + err;
         });
     }
  });
});

// 这个函数只负责在页面里当“间谍”找名字，不负责复制
function scrapeProblemName() {
   // 按横杠分割标题：["Problem ", " B ", " Simons... ", " Codeforces"]
   let parts = document.title.split('-');
   
   // 如果是 CF 典型的 4 段式标题，我们就把题号和题目名拼起来
   if (parts.length >= 3) {
       return parts[1].trim() + " - " + parts[2].trim();
   }
   
   // 如果格式不对，就直接返回整个标题
   return document.title.trim();
}