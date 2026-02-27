document.getElementById('catchBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeProblemName
  }, (results) => {
     if (results && results[0] && results[0].result) {
         let finalString = "1200 " + results[0].result;
         
         // 在插件环境执行复制，绝对不会被浏览器拦截！
         navigator.clipboard.writeText(finalString).then(() => {
             document.getElementById('status').innerText = "✅ 复制成功：\n" + finalString;
         }).catch(err => {
             document.getElementById('status').innerText = "❌ 复制失败: " + err;
         });
     }
  });
});

// 在网页内部执行的“王牌特工”
function scrapeProblemName() {
   // 1. 终极杀招：无视标签页，直接去网页深处抓取包含题目的 HTML 元素！
   // Codeforces 的题目大标题，永远藏在 class 为 title 的盒子里
   let cfTitleNode = document.querySelector('.problem-statement .title');
   
   if (cfTitleNode) {
       // 抓出来的内容通常是 "B. Simons and Cakes for Success"
       // 我们贴心地把第一个点号替换成 " - "，变成你喜欢的格式
       return cfTitleNode.innerText.replace('.', ' -');
   }
   
   // 2. 备用方案：如果没找到 DOM（比如你在别的网站），再降级去切分标题
   let parts = document.title.split('-');
   if (parts.length >= 3) {
       return parts[1].trim() + " - " + parts[2].trim();
   }
   return document.title.trim();
}