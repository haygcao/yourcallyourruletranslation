// 插件 ID,每个插件必须唯一
const pluginId = 'baiPhoneNumberPlugin';

// 插件信息
const pluginInfo = {
  // 插件信息
  info: {
    id: 'baiPhoneNumberPlugin', // 插件ID,必须唯一
    name: 'bai', // 插件名称
    version: '1.2.0', // 插件版本
    description: 'This is a plugin template.', // 插件描述
    author: 'Your Name', // 插件作者
  },
};

// 预设标签列表
const predefinedLabels = [
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
    {'label': 'Debt Collection'},
    {'label': 'Survey'},
    {'label': 'Political'},
    {'label': 'Ecommerce'},
    {'label': 'Risk'},
    {'label': 'Agent'},
    {'label': 'Recruiter'},
    {'label': 'Headhunter'},  
    {'label': 'Silent Call(Voice Clone?)'},
];

// 手动映射表，将 source label 映射到预设标签
    const manualMapping = {
    '中介': 'Agent',             // 含义较广，包括房产中介等
    '房产中介': 'Agent',         // 细化为房地产经纪人
    '违规催收': 'Debt Collection',
    '快递物流': 'Delivery',
    '快递': 'Delivery',
    '教育培训': 'Education',
    '金融': 'Financial',
    '股票证券': 'Financial',   // 统一为金融
    '保险理财': 'Financial',   // 统一为金融
    '涉诈电话': 'Fraud Scam Likely',
    '诈骗': 'Fraud Scam Likely',
    '招聘': 'Recruiter',    // 招聘和猎头很多时候可以合并
    '猎头': 'Headhunter',
    '猎头招聘': 'Headhunter',
    '招聘猎头': 'Headhunter',
    '保险': 'Insurance',
    '保险推销': 'Insurance',
    '贷款理财': 'Loan',   
    '医疗卫生': 'Medical',  
    '其他': 'Other',
    '送餐外卖': 'Takeaway',
    '美团': 'Takeaway',
    '饿了么': 'Takeaway',
    '外卖': 'Takeaway',  
    '滴滴/优步': 'Ridesharing',
    '出租车': 'Ridesharing',
    '网约车': 'Ridesharing',
    '违法': 'Risk',
    '淫秽色情': 'Risk',
    '反动谣言': 'Risk', 
    '发票办证': 'Risk',
    '客服热线': 'Customer Service',
    '非应邀商业电话': 'Spam Likely',
    '广告': 'Spam Likely',
    '骚扰': 'Spam Likely', 
    '骚扰电话': 'Spam Likely', // 骚扰电话很多是诈骗    
    '广告营销': 'Telemarketing',
    '广告推销': 'Telemarketing',
    '旅游推广': 'Telemarketing',
    '食药推销': 'Telemarketing',      
    '推销': 'Telemarketing',
};
// 使用 Map 对象来存储 pending 的 Promise
const pendingPromises = new Map();

// 查询电话号码信息
function queryPhoneInfo(phoneNumber, requestId) {
  console.log('queryPhoneInfo called with phoneNumber:', phoneNumber, 'and requestId:', requestId);
  FlutterChannel.postMessage(JSON.stringify({
    pluginId: pluginId,
    method: 'GET',
    requestId: requestId,
    url: `https://www.so.com/s?q=${phoneNumber}`,
    headers: {
      "User-Agent": 'Mozilla/5.0 (Linux; arm_64; Android 14; SM-S711B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.199 YaBrowser/24.12.4.199.00 SA/3 Mobile Safari/537.36',
    },
  }));
}


// 使用 DOMParser API 提取数据 (这里重要的就是count 和label，phone number，其他的都是为了测试使用的)
// 使用 DOMParser API 提取数据
function extractDataFromDOM(doc, phoneNumber) {
  const jsonObject = {
    count: 0,
    sourceLabel: "",
    province: "",
    city: "",
    carrier: "unknown", // 默认为 unknown
    phoneNumber: phoneNumber
  };

  try {
    console.log('Document Object:', doc);

    const bodyElement = doc.body;
    console.log('Body Element:', bodyElement);
    if (!bodyElement) {
      console.error('Error: Could not find body element.');
      return jsonObject;
    }

    // 提取 sourceLabel
    const sourceLabelElement = doc.querySelector('.c-row.c-gap-top-cc.cc-title_31ypU');
    console.log('sourceLabelElement:', sourceLabelElement);

    if (sourceLabelElement) {
      // 提取 sourceLabel 文本
      jsonObject.sourceLabel = sourceLabelElement.textContent.trim();
      console.log('jsonObject.sourceLabel:', jsonObject.sourceLabel);

      // 检查是否存在 "用户标记" 或 "网络收录仅供参考"，如果存在，则 count 设置为 1
      const markerElement = sourceLabelElement.querySelector('.c-text-red-border.c-text.marker-color_3IDoi, .c-text-gray-border.c-text.marker-color_3IDoi');
      console.log('markerElement:', markerElement);
      if (markerElement) {
          jsonObject.count = 1;
          console.log('jsonObject.count:', jsonObject.count);
      }
    }
      // 只有在没有 sourceLabelElement 的情况下，才检查 "用户标记"
     else{
       const countElement = doc.querySelector('.c-text-red-border.c-text.marker-color_3IDoi');
        console.log('countElement:', countElement);
        if (countElement) {
            jsonObject.count = 1;
            console.log('jsonObject.count:', jsonObject.count);
        }
     }
    

    // 提取 province 和 city
    const locationElement = doc.querySelector('.c-row.c-gap-top.c-gap-top-cc.cc-row_dDm_G');
    console.log('locationElement:', locationElement);
    if (locationElement) {
      const locationText = locationElement.textContent.trim();
      console.log('locationText:', locationText);
      const match = locationText.match(/([\u4e00-\u9fa5]+)[\s ]*([\u4e00-\u9fa5]+)?/);
      if (match) {
        jsonObject.province = match[1] || '';
        jsonObject.city = match[2] || '';
      }
      console.log('jsonObject.province:', jsonObject.province);
      console.log('jsonObject.city:', jsonObject.city);
    }

  } catch (error) {
    console.error('Error extracting data:', error);
  }

  console.log('Final jsonObject:', jsonObject);
  console.log('Final jsonObject type:', typeof jsonObject);
  return jsonObject;
}



// ... (pluginId, pluginInfo, predefinedLabels, manualMapping, queryPhoneInfo, extractDataFromDOM 等保持不变)

// 生成输出信息
async function generateOutput(phoneNumber, nationalNumber, e164Number, externalRequestId) {
  console.log('generateOutput called with:', phoneNumber, nationalNumber, e164Number, externalRequestId);

  // 处理单个号码查询的函数 (返回一个 Promise)
  function handleNumberQuery(number, requestId) {
    return new Promise((resolve, reject) => {
      queryPhoneInfo(number, requestId);
      pendingPromises.set(requestId, resolve);

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (pendingPromises.has(requestId)) {
          reject(new Error('Timeout waiting for response'));
          pendingPromises.delete(requestId);
          window.removeEventListener('message', messageListener);
        }
      }, 5000); // 5秒超时

      // 监听 message 事件
      function messageListener(event) {
        console.log('Received message in event listener:', event.data);
        console.log('Received message event.data.type:', event.data.type);

        if (event.data.type === `xhrResponse_${pluginId}`) {
          const detail = event.data.detail;
          const response = detail.response;
          const receivedRequestId = detail.requestId;

          console.log('requestId from detail:', receivedRequestId);
          console.log('event.data.detail.response:', response);

          // 检查 requestId 是否匹配
          if (receivedRequestId === requestId) {
            if (response.status >= 200 && response.status < 300) {
              console.log('response.responseText length:', response.responseText.length);
              console.log('response.responseText:', response.responseText);

              // 解析 HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(response.responseText, 'text/html');

              // 使用 JavaScript 代码提取数据
              const jsonObject = extractDataFromDOM(doc);
              console.log('Extracted information:', jsonObject);
              console.log('Extracted information type:', typeof jsonObject);

              // 清理工作
              clearTimeout(timeoutId);
              pendingPromises.delete(requestId);
              window.removeEventListener('message', messageListener);

              // 关键改动：resolve 后立即返回结果
              resolve(jsonObject);
            } else {
              console.error(`HTTP error! status: ${response.status}`);
              reject(new Error(`HTTP error! status: ${response.status}`));

              // 清理工作
              clearTimeout(timeoutId);
              pendingPromises.delete(requestId);
              window.removeEventListener('message', messageListener);
            }
          } else {
            console.log('Received response for a different requestId:', receivedRequestId);
          }
        } else {
          console.log('Received unknown message type:', event.data.type);
        }
      }

      window.addEventListener('message', messageListener);
    });
  }

  // 依次处理每个号码，哪个先返回有效结果就用哪个
  try {
    let result;

    if (phoneNumber) {
      const phoneRequestId = Math.random().toString(36).substring(2);
      try {
        result = await handleNumberQuery(phoneNumber, phoneRequestId);
      } catch (error) {
        console.error('Error querying phoneNumber:', error);
      }
    }



    console.log('First successful query completed:', result);
    console.log('First successful query completed type:', typeof result);

    // 确保 result 不为空
    if (!result) {
      // 通过 FlutterChannel 发送错误信息
      FlutterChannel.postMessage(JSON.stringify({
        type: 'pluginError',
        pluginId: pluginId,
        error: 'All attempts failed or timed out.',
      }));
      return { error: 'All attempts failed or timed out.' }; // 同时返回错误信息
    }

    let matchedLabel = predefinedLabels.find(label => label.label === result.sourceLabel)?.label;
    if (!matchedLabel) {
      matchedLabel = manualMapping[result.sourceLabel] || 'Unknown';
    }

    const finalResult = {
      phoneNumber: result.phoneNumber,
      sourceLabel: result.sourceLabel,
      count: result.count,
      province: result.province,
      city: result.city,
      carrier: result.carrier,
      predefinedLabel: matchedLabel,
      source: pluginInfo.info.name,
    };


    

    // 通过 FlutterChannel 发送结果
    FlutterChannel.postMessage(JSON.stringify({
      type: 'pluginResult',
      "requestId": externalRequestId, // 修改为 requestId
      pluginId: pluginId,
      data: finalResult,
    }));
    
    // 通过 window.parent.postMessage 发送结果
  console.log(`Plugin ${pluginId} - Sending result via window.currentPluginChannel`);
  // 通过统一通道名发送结果
  PluginResultChannel.postMessage(JSON.stringify({
      type: 'pluginResult',
      "requestId": externalRequestId, // 修改为externalRequestId
      pluginId: pluginId,
      data: finalResult,
  }));

    
    return finalResult; // 同时返回结果
  } catch (error) {
    console.error('Error in generateOutput:', error);
    // 通过 FlutterChannel 发送错误信息
    FlutterChannel.postMessage(JSON.stringify({
      type: 'pluginError',
      pluginId: pluginId,
      error: error.message || 'Unknown error occurred during phone number lookup.',
    }));
    return {
      error: error.message || 'Unknown error occurred during phone number lookup.',
    };
  }
}




// 初始化插件
async function initializePlugin() {
  window.plugin = {};
  const thisPlugin = {
    id: pluginInfo.info.id,
    pluginId: pluginId,
    version: pluginInfo.info.version,
    queryPhoneInfo: queryPhoneInfo,
    generateOutput: generateOutput,
    test: function () {
      console.log('Plugin test function called');
      return 'Plugin is working';
    }
  };

  window.plugin[pluginId] = thisPlugin;

  if (typeof TestPageChannel !== 'undefined') {
    TestPageChannel.postMessage(JSON.stringify({
      type: 'pluginLoaded',
      pluginId: pluginId,
    }));
    console.log('Notified Flutter that plugin is loaded');
    TestPageChannel.postMessage(JSON.stringify({
      type: 'pluginReady',
      pluginId: pluginId,
    }));
    console.log('Notified Flutter that plugin is ready');
  } else {
    console.error('TestPageChannel is not defined');
  }
}

// 初始化插件
initializePlugin();
