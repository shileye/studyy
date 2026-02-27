document.getElementById('catchBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeProblemName
  }, (results) => {
     if (results && results[0] && results[0].result) {
         let finalString = "1200 " + results[0].result;
         navigator.clipboard.writeText(finalString).then(() => {
             document.getElementById('status').innerText = "✅ 复制成功：\n" + finalString;
         }).catch(err => {
             document.getElementById('status').innerText = "❌ 复制失败: " + err;
         });
     }
  });
});

// 无视任何防御的终极雷达扫描
function scrapeProblemName() {
   // 1. 常规探路：如果没装其他插件，走这条路最快
   let cfTitleNode = document.querySelector('.problem-statement .title');
   if (cfTitleNode && cfTitleNode.innerText.trim()) {
       let text = cfTitleNode.innerText.trim().split('\n')[0]; // 取第一行，避开翻译
       if (text.length > 2) return text.replace('.', ' -');
   }
   
   // 2. 终极雷达：针对 Codeforces Better 等插件的强杀逻辑！
   // 第一步：从浏览器网址里抠出当前的题号，比如 "B" 或者 "D2"
   let matchUrl = window.location.href.match(/problem\/([A-Z]\d*)/i);
   let letter = matchUrl ? matchUrl[1].toUpperCase() : "[A-Z]\\d*";
   
   // 第二步：在全屏所有的可见文字里，死死锁定 "B. 任何英文" 这样的格式
   let regex = new RegExp(`(?:^|\\n)\\s*(${letter}\\.\\s+[^\\n]{2,80})`);
   let match = document.body.innerText.match(regex);
   
   if (match && match[1]) {
       // 抓到后，把那个点替换成横杠，完美输出！
       return match[1].trim().replace('.', ' -');
   }
   
   // 3. 最后的兜底
   let parts = document.title.split('-');
   if (parts.length >= 3 && parts[2].trim() !== "Codeforces") {
       return parts[1].trim() + " - " + parts[2].trim();
   }
   return document.title.trim();
}