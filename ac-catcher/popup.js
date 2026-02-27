document.getElementById('catchBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeProblemData
  }, (results) => {
     if (results && results[0] && results[0].result) {
         let data = results[0].result;
         
         // 拼装成看板认得的新格式： 分数 题目标题 | 网址
         let finalString = data.rating + " " + data.title + " | " + data.url;
         
         navigator.clipboard.writeText(finalString).then(() => {
             document.getElementById('status').innerText = "✅ 捕获成功：\n" + data.title;
         }).catch(err => {
             document.getElementById('status').innerText = "❌ 复制失败: " + err;
         });
     }
  });
});

// 在网页内执行的全能特工
function scrapeProblemData() {
   let currentUrl = window.location.href;
   let title = document.title;
   let rating = "1200"; // 默认分

   // 🔴 剧本 A：如果发现是在【牛客网】
   if (currentUrl.includes("nowcoder.com")) {
       rating = "unrated"; // 牛客比赛一律打上 unrated 标签
       // 牛客的网页标题通常是 "小红的数组_牛客网"，我们把后面的切掉
       title = document.title.split('_')[0].trim();
   } 
   // 🔵 剧本 B：如果是在【Codeforces】
   else if (currentUrl.includes("codeforces.com")) {
       let cfTitleNode = document.querySelector('.problem-statement .title');
       if (cfTitleNode) {
           title = cfTitleNode.innerText.split('\n')[0].trim().replace('.', ' -');
       } else {
           let match = document.body.innerText.match(/(?:^|\n)\s*([A-Z]\.\s+[^\n]{2,80})/);
           if (match) title = match[1].trim().replace('.', ' -');
       }
       
       // 智能估分
       let letterMatch = title.match(/^([A-Z])/);
       if (letterMatch) {
           let l = letterMatch[1];
           if(l==='A'||l==='B') rating = "1200";
           else if(l==='C') rating = "1500";
           else if(l==='D') rating = "1750";
           else if(l==='E') rating = "2000";
           else if(l==='F'||l==='G') rating = "2200";
       }
   }

   // 连锅端：返回标题、网址和算好的分数
   return { title: title, url: currentUrl, rating: rating };
}