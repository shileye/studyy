document.getElementById('catchBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeProblemData
  }, (results) => {
     if (results && results[0] && results[0].result) {
         let data = results[0].result;
         
         // 拼装你的数据
         let finalString = data.rating + " " + data.title + " | " + data.url;
         
         // 🚀 核心魔法：向你的真实看板网址发起空间跃迁！
         let targetUrl = "https://shileye.github.io/studyy/?auto_ac=" + encodeURIComponent(finalString);
         
         // 瞬间打开新标签页！
         chrome.tabs.create({ url: targetUrl });
         
         document.getElementById('status').innerText = "🚀 跃迁成功！";
     }
  });
});

// 网页内收集特工
function scrapeProblemData() {
   let currentUrl = window.location.href;
   let title = document.title;
   let rating = "1200";

   if (currentUrl.includes("nowcoder.com")) {
       rating = "unrated";
       title = document.title.split('_')[0].trim();
   } else if (currentUrl.includes("codeforces.com")) {
       let cfTitleNode = document.querySelector('.problem-statement .title');
       if (cfTitleNode) {
           title = cfTitleNode.innerText.split('\n')[0].trim().replace('.', ' -');
       } else {
           let match = document.body.innerText.match(/(?:^|\n)\s*([A-Z]\.\s+[^\n]{2,80})/);
           if (match) title = match[1].trim().replace('.', ' -');
       }
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
   return { title: title, url: currentUrl, rating: rating };
}