
// 插件 ID,每个插件必须唯一
const pluginId = 'baiduPhoneNumberPlugin';

// 插件信息
const pluginInfo = {
  // 插件信息
  info: {
    id: 'yourpluginid', // 插件ID,必须唯一
    name: 'baidu', // 插件名称
    version: '1.0.0', // 插件版本
    description: 'This is a plugin template.', // 插件描述
    author: 'Your Name', // 插件作者
  },
};  

// 预设标签列表  
const predefinedLabels = [ // 修改：添加初始值
  {'label': 'Fraud Scam Likely'},
  {'label': 'Spam Likely'},
  {'label': 'Telemarketing'},
  // ... 省略其他预设标签
  {'label': 'Risk'},
];

// 手动映射表，将 source label 映射到预设标签  
const manualMapping = { // 修改：添加初始值
  '标签1': 'Fraud Scam Likely', // 对应预设标签 "Fraud Scam Likely"
  '标签2': 'Spam Likely', // 对应预设标签 "Spam Likely"
  // ... 省略其他手动映射
  '标签22': 'Risk', // 对应预设标签 "Risk"
};




// 使用 Promise 来加载脚本
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 加载 axios
async function loadLibraries() {
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js');
    console.log('Libraries loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading libraries:', error);
    return false;
  }
}

// 使用 DOMParser API 提取数据 (版本 A 的 extractDataFromDOM 函数)
function extractDataFromDOM(doc, phoneNumber) {
  const jsonObject = {
    count: 0,
    sourceLabel: "",
    province: "",
    city: "",
    carrier: "",
    phoneNumber: phoneNumber
  };

  const descElement = doc.querySelector('.mark-tip_3WkLJ span');
  if (descElement) {
    const descText = descElement.textContent.trim();
    if (descText.includes("存在风险")) {
      jsonObject.count = 1;
    }
  }

  const titleElement = doc.querySelector('.c-span22.c-span-last .cc-title_31ypU');
  if (titleElement) {
    jsonObject.sourceLabel = titleElement.textContent.trim().replace('用户标记', '');
  }

  const locationElement = doc.querySelector('.c-span20.c-span-last .cr-title1_1_Ro-'); 
  if (locationElement) {
    const locationParts = locationElement.textContent.trim().split(' ');
    jsonObject.province = locationParts[0] || '';
    jsonObject.city = locationParts[1] || '';
    jsonObject.carrier = locationParts[2] || ''; // 提取运营商信息
  }

  console.log('Extracted information:', jsonObject);
  return jsonObject;
}

// 查询电话号码信息 (版本 A 的 queryPhoneNumber 函数)
function queryPhoneInfo(phoneNumber) {
  console.log('Querying phone number:', phoneNumber);
// 将 phoneNumber 存储在 window 对象上
  window.currentPhoneNumber = phoneNumber; // 存储电话号码

  // 添加 pluginId 到消息中
  FlutterChannel.postMessage(JSON.stringify({
    pluginId: pluginId, 
    method: 'GET',
    url: `https://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&rsv_idx=1&tn=baidu&wd=${phoneNumber}&fenlei=256&rsv_pq=0xcffe73dc01b50174&rsv_t=3753dJdqYZ7dxvodeu3GbEkJUNR9kmodY8IZsS8tA3xIr5znCF4XJHbMw2qs&rqlang=en&rsv_dl=tb&rsv_enter=1&rsv_sug3=11&rsv_sug1=9&rsv_sug7=100&rsv_sug2=0&rsv_btype=i&inputT=2230&rsv_sug4=2230&rsv_sug=1`,
    headers: {
      "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    },
  }));
}

// 使用 Map 对象来存储 pending 的 Promise
const pendingPromises = new Map();

// 生成输出信息 (版本 B 的 generateOutput 函数,使用版本 A 的结构和逻辑)
async function generateOutput(phoneNumber, nationalNumber, e164Number) { // 这里的三个号码必须完整保留
  // 存储查询结果
  const queryResults = [];
// 但是这里 phoneNumber,nationalNumber,e164Number你可以删除任何一个,但是至少保留一个,选择最符合你的地区的号码格式即可
  if (phoneNumber) {
    this.queryPhoneInfo(phoneNumber); // 调用 queryPhoneInfo 发起查询
    queryResults.push(new Promise((resolve) => {
      pendingPromises.set(phoneNumber, resolve); // 将 resolve 函数存储到 pendingPromises 中
    }));
  }


// 但是这里 phoneNumber,nationalNumber,e164Number你可以删除任何一个,但是至少保留一个,选择最符合你的地区的号码格式即可

    if (nationalNumber) {
    this.queryPhoneInfo(nationalNumber); // 调用 queryPhoneInfo 发起查询
    queryResults.push(new Promise((resolve) => {
      pendingPromises.set(nationalNumber, resolve); // 将 resolve 函数存储到 pendingPromises 中
    }));
  }


// 但是这里 你可以删除任何一个,但是至少保留一个
  if (e164Number) {
    this.queryPhoneInfo(e164Number); // 调用 queryPhoneInfo 发起查询
    queryResults.push(new Promise((resolve) => {
      pendingPromises.set(e164Number, resolve); // 将 resolve 函数存储到 pendingPromises 中
    }));
  }

  // 等待所有查询完成
  const results = await Promise.all(queryResults); 

  const [phoneInfo, nationalInfo, e164Info] = results;

  // 合并查询结果,优先使用非空值
  const info = {
    count: phoneInfo?.count || nationalInfo?.count || e164Info?.count || 0,
    sourceLabel: phoneInfo?.sourceLabel || nationalInfo?.sourceLabel || e164Info?.sourceLabel || "",
    sourceName: phoneInfo?.sourceName || nationalInfo?.sourceName || e164Info?.sourceName || "",
  };

  // 使用原有的逻辑匹配预定义标签
  let matchedLabel = null;
  for (const label of predefinedLabels) {
    if (label.label === info.sourceLabel) {
      matchedLabel = label.label;
      break;
    }
  }
  // 如果没有匹配到预定义标签,尝试使用手动映射
  if (!matchedLabel) {
    matchedLabel = manualMapping[info.sourceLabel] || null;
  }

  // 返回所需的数据对象
  return {
    phoneNumber: phoneNumber, 
    sourceLabel: info.sourceLabel,
    count: info.count,
    predefinedLabel: matchedLabel,
    source: pluginInfo.info.name,
  };
}



// 在全局作用域中注册事件监听器
window.addEventListener('message', (event) => {
  console.log('Received message:', event.data); 
  if (event.data.type === `xhrResponse_${pluginId}`) {
    const response = event.data.response;
    if (response.status >= 200 && response.status < 300) {
      console.log('HTML content:', response.responseText); // 后期一定注释掉,打印 HTML 内容到 Flutter 日志,Android studio 打开flutter inspector,打开chrome://inspect/#devices,Remote Target,Inspect
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.responseText, 'text/html');

      // 使用 JavaScript 代码提取数据
      const jsonObject = extractDataFromDOM(doc, window.currentPhoneNumber); 
      console.log('Extracted information:', jsonObject);

          // 将数据传递回 Flutter,纯粹为了测试,后期测试后可以省略的
      FlutterChannel.postMessage(JSON.stringify({
        type: 'pluginResult',
        pluginId: pluginId,
        phoneNumber: window.currentPhoneNumber,
        data: jsonObject,
      }));

      // resolve 对应的 Promise
      const resolveFn = pendingPromises.get(window.currentPhoneNumber);
      if (resolveFn) {
        resolveFn(jsonObject);
        pendingPromises.delete(window.currentPhoneNumber); // 移除已处理的 Promise
      }

    } else {
      console.error(`HTTP error! status: ${response.status}`);

         // 将数据传递回 Flutter,纯粹为了测试,后期测试后可以省略的
      FlutterChannel.postMessage(JSON.stringify({
        type: 'pluginError',
        pluginId: pluginId,
        error: `HTTP error! status: ${response.status}`,
      }));
    }
  }
});


// 初始化插件
async function initializePlugin() {
  const librariesLoaded = await loadLibraries();
  if (librariesLoaded) {
    window.plugin = { // 修改：使用 存储插件信息
      id: pluginInfo.info.id,
      pluginId: pluginId,
      version: pluginInfo.info.version,
      queryPhoneInfo: queryPhoneInfo, // 使用版本 A 的函数
      generateOutput: generateOutput, // 修改：添加 generateOutput 函数
      manualMapping: manualMapping, // 修改：添加 manualMapping
      extractDataFromDOM: extractDataFromDOM, // 修改：添加 extractDataFromDOM
      test: function () {
        console.log('Plugin test function called');
        return 'Plugin is working';
      }
    }; 
    console.log('Plugin object set to window.plugin');
    console.log('window.plugin:', window.plugin);

    if (typeof FlutterChannel !== 'undefined') {
      FlutterChannel.postMessage(JSON.stringify({  // 修改：使用 JSON 格式发送消息
        type: 'pluginLoaded', // 修改：添加消息类型
        pluginId: pluginId, // 修改：添加插件 ID
      }));
      console.log('Notified Flutter that plugin is loaded');
      FlutterChannel.postMessage(JSON.stringify({ // 修改：使用 JSON 格式发送消息
        type: 'pluginReady', // 修改：添加消息类型
        pluginId: pluginId, // 修改：添加插件 ID
      })); 
    } else {
      console.error('FlutterChannel is not defined');
    }
  } else { //  **删除了重复的代码块** 
    console.error('Failed to load libraries. Plugin not initialized.');
  }
}

// 为了调试,添加全局错误处理
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global error:', message, 'at', source, lineno, colno, error);
  if (typeof FlutterChannel !== 'undefined') {
    FlutterChannel.postMessage('JS Error: ' + message);
  }
};

// 添加全局函数来检查插件状态
window.checkPluginStatus = function (pluginId) { // 修改：添加 pluginId 参数
  console.log('Checking plugin status for plugin:', pluginId);
  console.log('window.plugin:', window.plugin);
  if (window.plugin && typeof window.plugin.queryPhoneInfo === 'function') { 
    console.log('Plugin', pluginId, 'is properly loaded and queryPhoneInfo is available');
    return true;
  } else {
    console.log(
        'Plugin', pluginId, 'is not properly loaded or queryPhoneInfo is not available');
    return false;
  }
};

// 初始化插件
initializePlugin();
