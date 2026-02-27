document.getElementById('catchBtn').addEventListener('click', async () => {
  // 获取当前你正在看的那个网页标签
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 向那个网页注入一段探测代码
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeProblemName
  }, (results) => {
     if (results && results[0]) {
         document.getElementById('status').innerText = "🎯 成功抓取：\n" + results[0].result;
     }
  });
});

// 这段代码会在你正在看的网页（比如Codeforces）里静默执行
function scrapeProblemName() {
   // CF和牛客的网页标题通常自带题目名字，我们直接暴力切分！
   return document.title.split('-')[1]?.trim() || document.title;
}