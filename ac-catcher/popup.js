document.getElementById('catchBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeAndCopy
  }, (results) => {
     if (results && results[0] && results[0].result) {
         document.getElementById('status').innerText = "✅ 已复制到剪贴板：\n" + results[0].result;
     }
  });
});

// 注入到页面的执行函数
function scrapeAndCopy() {
   // 获取题目标题
   let rawTitle = document.title.split('-')[1]?.trim() || document.title;
   
   // 拼装成你看板【极速入库】需要的格式！默认给个 1200 分（你可以粘贴后手动改）
   let finalString = "1200 " + rawTitle;
   
   // 核心魔法：直接帮你静默复制到电脑的剪贴板！
   navigator.clipboard.writeText(finalString);
   
   return finalString;
}