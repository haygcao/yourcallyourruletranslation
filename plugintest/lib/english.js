// Plugin ID, must be unique for each plugin
// 插件 ID,每个插件必须唯一
const pluginId = 'baiduPhoneNumberPlugin';

// Plugin information
// 插件信息
const pluginInfo = {
  // Plugin info
  // 插件信息
  info: {
    id: 'yourpluginid', // Plugin ID, must be unique
    // 插件ID,必须唯一
    name: 'baidu', // Plugin name
    // 插件名称
    version: '1.0.0', // Plugin version
    // 插件版本
    description: 'This is a plugin template.', // Plugin description
    // 插件描述
    author: 'Your Name', // Plugin author
    // 插件作者
  },
};  

// Predefined label list
// 预设标签列表  
const predefinedLabels = [ // Modified: Added initial values
  // 修改：添加初始值
  {'label': 'Fraud Scam Likely'},
  {'label': 'Spam Likely'},
  {'label': 'Telemarketing'},
  {'label': 'Robocall'},
  {'label': 'Delivery'},
  {'label': 'Takeaway'},
  {'label': 'Ridesharing'},
  {'label': 'Insurance'},
  {'label': 'Loan'},
  {'label': 'Customer Service'},
  {'label': 'Unknown'},
  {'label': 'Financial'},
  {'label': 'Bank'},
  {'label': 'Education'},
  {'label': 'Medical'},
  {'label': 'Charity'},
  {'label': 'Other'},
  {'label': 'Collection'},
  {'label': 'Survey'},
  {'label': 'Political'},
  {'label': 'Ecommerce'},
  {'label': 'Risk'},
];

// Manual mapping table, maps source labels to predefined labels
// 手动映射表，将 source label 映射到预设标签  
const manualMapping = { // Modified: Added initial values
  // 修改：添加初始值
  '标签1': 'Fraud Scam Likely', // Corresponds to predefined label "Fraud Scam Likely"
  // 对应预设标签 "Fraud Scam Likely"
  '标签2': 'Spam Likely', // Corresponds to predefined label "Spam Likely"
  // 对应预设标签 "Spam Likely"
  // ... Omit other manual mappings
  // ... 省略其他手动映射
  '标签22': 'Risk', // Corresponds to predefined label "Risk"
  // 对应预设标签 "Risk"
};


// Uses Promise to load scripts
// 使用 Promise 来加载脚本
// Because the app doesn't have built-in npm packages, it can only introduce URLs or be packaged
// 因为app 没有内置npm包，所以只能引入url 或者打包
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Loads axios
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

// Uses the DOMParser API to extract data (the important things here are count and label, phone number, the rest are for testing purposes)
// 使用 DOMParser API 提取数据 (这里重要的就是count 和label，phone number，其他的都是为了测试使用的)
function extractDataFromDOM(doc, phoneNumber) {
  const jsonObject = {
    count: 0,
    sourceLabel: "",
    province: "",
    city: "",
    carrier: "",
    phoneNumber: phoneNumber
  };

  // Modify from here to your actual HTML element
  //从这里到你根据实际的html 的element 进行修改，
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
    jsonObject.carrier = locationParts[2] || ''; // Extract carrier information
    // 提取运营商信息
  }

  console.log('Extracted information:', jsonObject);
  return jsonObject;
}
// Modify to your actual HTML element
//到这里需要你根据实际的html 的element 进行修改，



// Queries phone number information (version A of the queryPhoneNumber function)
// 查询电话号码信息 (版本 A 的 queryPhoneNumber 函数)
function queryPhoneInfo(phoneNumber) {
  console.log('Querying phone number:', phoneNumber);
// Stores phoneNumber on the window object
// 将 phoneNumber 存储在 window 对象上
  window.currentPhoneNumber = phoneNumber; // Stores phone number
  // 存储电话号码

///  You need to modify the URL and headers here
///  这里url 和headers 是你需要你修改的
  // Adds pluginId to the message
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
//// You need to modify the URL and headers here
//// 这里url 和headers 是你需要你修改的


/// The rest is fixed, you don't need to change it, if you like,you can edit.
///剩下的部分都是固定的你不需要改动, 你也可以调整


// Uses a Map object to store pending Promises
// 使用 Map 对象来存储 pending 的 Promise
const pendingPromises = new Map();

// Generates output information (version B of the generateOutput function, uses the structure and logic of version A)
// 生成输出信息 (版本 B 的 generateOutput 函数,使用版本 A 的结构和逻辑)
async function generateOutput(phoneNumber, nationalNumber, e164Number) { // These three numbers must be kept complete
  // 这里的三个号码必须完整保留
  // Stores query results
  // 存储查询结果
  const queryResults = [];
// But here you can delete any of phoneNumber, nationalNumber, e164Number, but keep at least one, choose the number format that best suits your region
// 但是这里 phoneNumber,nationalNumber,e164Number你可以删除任何一个,但是至少保留一个,选择最符合你的地区的号码格式即可
  if (phoneNumber) {
    this.queryPhoneInfo(phoneNumber); // Calls queryPhoneInfo to initiate a query
    // 调用 queryPhoneInfo 发起查询
    queryResults.push(new Promise((resolve) => {
      pendingPromises.set(phoneNumber, resolve); // Stores the resolve function in pendingPromises
      // 将 resolve 函数存储到 pendingPromises 中
    }));
  }


// But here you can delete any of phoneNumber, nationalNumber, e164Number, but keep at least one, choose the number format that best suits your region
// 但是这里 phoneNumber,nationalNumber,e164Number你可以删除任何一个,但是至少保留一个,选择最符合你的地区的号码格式即可

    if (nationalNumber) {
    this.queryPhoneInfo(nationalNumber); // Calls queryPhoneInfo to initiate a query
    // 调用 queryPhoneInfo 发起查询
    queryResults.push(new Promise((resolve) => {
      pendingPromises.set(nationalNumber, resolve); // Stores the resolve function in pendingPromises
      // 将 resolve 函数存储到 pendingPromises 中
    }));
  }


// But here you can delete any, but keep at least one
// 但是这里 你可以删除任何一个,但是至少保留一个
  if (e164Number) {
    this.queryPhoneInfo(e164Number); // Calls queryPhoneInfo to initiate a query
    // 调用 queryPhoneInfo 发起查询
    queryResults.push(new Promise((resolve) => {
      pendingPromises.set(e164Number, resolve); // Stores the resolve function in pendingPromises
      // 将 resolve 函数存储到 pendingPromises 中
    }));
  }

  // Waits for all queries to complete
  // 等待所有查询完成
  const results = await Promise.all(queryResults); 

  const [phoneInfo, nationalInfo, e164Info] = results;

  // Merges query results, prioritizing non-null values
  // 合并查询结果,优先使用非空值
  const info = {
    count: phoneInfo?.count || nationalInfo?.count || e164Info?.count || 0,
    sourceLabel: phoneInfo?.sourceLabel || nationalInfo?.sourceLabel || e164Info?.sourceLabel || "",
    sourceName: phoneInfo?.sourceName || nationalInfo?.sourceName || e164Info?.sourceName || "",
  };

  // Uses the original logic to match predefined labels
  // 使用原有的逻辑匹配预定义标签
  let matchedLabel = null;
  for (const label of predefinedLabels) {
    if (label.label === info.sourceLabel) {
      matchedLabel = label.label;
      break;
    }
  }
  // If no predefined label is matched, try using manual mapping
  // 如果没有匹配到预定义标签,尝试使用手动映射
  if (!matchedLabel) {
    matchedLabel = manualMapping[info.sourceLabel] || null;
  }

  // Returns the required data object
  // 返回所需的数据对象
  return {
    phoneNumber: phoneNumber, 
    sourceLabel: info.sourceLabel,
    count: info.count,
    predefinedLabel: matchedLabel,
    source: pluginInfo.info.name,
  };
}



// Registers an event listener in the global scope
// 在全局作用域中注册事件监听器
window.addEventListener('message', (event) => {
  console.log('Received message:', event.data); 
  if (event.data.type === `xhrResponse_${pluginId}`) {
    const response = event.data.response;
    if (response.status >= 200 && response.status < 300) {
      console.log('HTML content:', response.responseText); // Be sure to comment out later, print HTML content to Flutter log, open flutter inspector in Android studio, open chrome://inspect/#devices, Remote Target, Inspect
      // 后期一定注释掉,打印 HTML 内容到 Flutter 日志,Android studio 打开flutter inspector,打开chrome://inspect/#devices,Remote Target,Inspect
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.responseText, 'text/html');

      // Uses JavaScript code to extract data
      // 使用 JavaScript 代码提取数据
      const jsonObject = extractDataFromDOM(doc, window.currentPhoneNumber); 
      console.log('Extracted information:', jsonObject);

          // Passes the data back to Flutter, purely for testing, can be omitted after testing
          // 将数据传递回 Flutter,纯粹为了测试,后期测试后可以省略的
      FlutterChannel.postMessage(JSON.stringify({
        type: 'pluginResult',
        pluginId: pluginId,
        phoneNumber: window.currentPhoneNumber,
        data: jsonObject,
      }));

      // Resolves the corresponding Promise
      // resolve 对应的 Promise
      const resolveFn = pendingPromises.get(window.currentPhoneNumber);
      if (resolveFn) {
        resolveFn(jsonObject);
        pendingPromises.delete(window.currentPhoneNumber); // Removes the processed Promise
        // 移除已处理的 Promise
      }

    } else {
      console.error(`HTTP error! status: ${response.status}`);

         // Passes the data back to Flutter, purely for testing, can be omitted after testing
         // 将数据传递回 Flutter,纯粹为了测试,后期测试后可以省略的
      FlutterChannel.postMessage(JSON.stringify({
        type: 'pluginError',
        pluginId: pluginId,
        error: `HTTP error! status: ${response.status}`,
      }));
    }
  }
});

// Initializes the plugin
// 初始化插件
async function initializePlugin() {
  const librariesLoaded = await loadLibraries();
  if (librariesLoaded) {

 // Ensures that window.plugin is initialized to an empty object
 // 确保 window.plugin 被初始化为空对象
    window.plugin = {}; 
    // Creates a new plugin object
    // 创建一个新的插件对象
    const thisPlugin = { 
      id: pluginInfo.info.id,
      pluginId: pluginId,
      version: pluginInfo.info.version,
      queryPhoneInfo: queryPhoneInfo, 
      generateOutput: generateOutput,
      manualMapping: manualMapping,
      extractDataFromDOM: extractDataFromDOM,
      test: function () {
        console.log('Plugin test function called');
        return 'Plugin is working';
      }
    }; 

    // Assigns the plugin object to window.plugin, using the plugin ID as the property name
    // 将插件对象赋值给 window.plugin，以插件 ID 作为属性名
    window.plugin[pluginId] = thisPlugin;
    
    console.log('Plugin object set to window.plugin');
    console.log('window.plugin:', window.plugin);
console.log('pluginId:', pluginId); // Outputs the value of pluginId
// 输出 pluginId 的值
    
    if (typeof TestPageChannel !== 'undefined') {
      TestPageChannel.postMessage(JSON.stringify({  // Modified: Sends messages using JSON format
        // 修改：使用 JSON 格式发送消息
        type: 'pluginLoaded', // Modified: Adds message type
        // 修改：添加消息类型
        pluginId: pluginId, // Modified: Adds plugin ID
        // 修改：添加插件 ID
      }));
      console.log('Notified Flutter that plugin is loaded');
      TestPageChannel.postMessage(JSON.stringify({ // Modified: Sends messages using JSON format
        // 修改：使用 JSON 格式发送消息
        type: 'pluginReady', // Modified: Adds message type
        // 修改：添加消息类型
        pluginId: pluginId, // Modified: Adds plugin ID
        // 修改：添加插件 ID
      })); 
    } else {
      console.error('FlutterChannel is not defined');
    }
  } else { // **Removed duplicate code block**
    //  **删除了重复的代码块** 
    console.error('Failed to load libraries. Plugin not initialized.');
  }
}

// Adds global error handling for debugging
// 为了调试,添加全局错误处理
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global error:', message, 'at', source, lineno, colno, error);
  if (typeof FlutterChannel !== 'undefined') {
    FlutterChannel.postMessage('JS Error: ' + message);
  }
};

// Adds a global function to check the plugin status
// 添加全局函数来检查插件状态
window.checkPluginStatus = function (pluginId) { 
  console.log('Checking plugin status for plugin:', pluginId);
  console.log('window.plugin:', window.plugin);
  // Checks if the corresponding plugin object exists
  // 检查对应的插件对象是否存在
  if (window.plugin[pluginId] && typeof window.plugin[pluginId].queryPhoneInfo === 'function') {
    console.log('Plugin', pluginId, 'is properly loaded and queryPhoneInfo is available');
    return true;
  } else {
    console.log('Plugin', pluginId, 'is not properly loaded or queryPhoneInfo is not available');
    return false;
  }
};


// Initializes the plugin
// 初始化插件
initializePlugin();
