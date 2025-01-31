// Plugin ID, each plugin must be unique
const pluginId = 'PhoneNumberPlugin';

// Plugin information
const pluginInfo = {
  // Plugin information
  info: {
    id: 'PhoneNumberPlugin', // Plugin ID, must be unique
    name: '360', // Plugin name
    version: '1.2.0', // Plugin version
    description: 'This is a plugin template.', // Plugin description
    author: 'Your Name', // Plugin author
  },
};

// Predefined label list
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
    {'label': 'Collection'},
    {'label': 'Survey'},
    {'label': 'Political'},
    {'label': 'Ecommerce'},
    {'label': 'Risk'},
];

// Manual mapping table, mapping source labels to predefined labels
const manualMapping = {
    '标签1': 'Fraud Scam Likely', // Corresponds to the predefined label "Fraud Scam Likely"
    '标签2': 'Spam Likely', // Corresponds to the predefined label "Spam Likely"
    // ... other manual mappings omitted
    '标签22': 'Risk', // Corresponds to the predefined label "Risk"
};

// Use a Map object to store pending Promises
const pendingPromises = new Map();

// Query phone number information
function queryPhoneInfo(phoneNumber, requestId) {
  console.log('queryPhoneInfo called with phoneNumber:', phoneNumber, 'and requestId:', requestId);
  FlutterChannel.postMessage(JSON.stringify({
    pluginId: pluginId,
    method: 'GET',
    requestId: requestId,
    url: `https://www.xx.com/s?q=${phoneNumber}`,
    headers: {
      "User-Agent": 'Mozilla/5.0 (Linux; arm_64; Android 14; SM-S711B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.199 YaBrowser/24.12.4.199.00 SA/3 Mobile Safari/537.36',
    },
  }));
}

// Use the DOMParser API to extract data (the important ones here are count and label, phone number, others are for testing purposes)
function extractDataFromDOM(doc, phoneNumber) {
  const jsonObject = {
    count: 0,
    sourceLabel: "",
    province: "",
    city: "",
    carrier: "",
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

    // Try to extract the mark count and label for structure one you can use AI for coding elemets
    const countElement = doc.querySelector('.mohe-tips-zp b');
    console.log('countElement:', countElement);
    const sourceLabelElement = doc.querySelector('.mohe-tips-zp');
    console.log('sourceLabelElement:', sourceLabelElement);

    if (countElement && sourceLabelElement) {
        const countText = countElement.textContent.trim();
        console.log('countText:', countText);
        jsonObject.count = parseInt(countText, 10) || 0;
        console.log('jsonObject.count:', jsonObject.count);

        let sourceLabelText = sourceLabelElement.textContent.trim();
        sourceLabelText = sourceLabelText.replace(/此号码近期被|\d+位|360手机卫士|用户标记，疑似为|！/g, '').replace(/，/g, '').trim();
        jsonObject.sourceLabel = sourceLabelText;
        console.log('jsonObject.sourceLabel:', jsonObject.sourceLabel);
    } else {
        // Try to extract the mark count and label for structure two
        const countElement2 = doc.querySelector('.mh-tel-desc b');
        console.log('countElement2:', countElement2);
        const sourceLabelElement2 = doc.querySelector('.mh-tel-mark'); // Try to select based on the new structure
        console.log('sourceLabelElement2:', sourceLabelElement2);

        if (countElement2) {
            const countText = countElement2.textContent.trim();
            console.log('countText:', countText);
            jsonObject.count = parseInt(countText, 10) || 0;
            console.log('jsonObject.count:', jsonObject.count);
        }

        if (sourceLabelElement2) {
            let sourceLabelText = sourceLabelElement2.textContent.trim();
            jsonObject.sourceLabel = sourceLabelText;
            console.log('jsonObject.sourceLabel:', jsonObject.sourceLabel);
        }
    }

    // Try to extract the number, province, city, and carrier for structure one
    const detailElement = doc.querySelector('.mh-detail');
    console.log('detailElement:', detailElement);
    if (detailElement) {
      const spans = detailElement.querySelectorAll('span');
      console.log('spans:', spans);
      if (spans.length >= 2) {
        jsonObject.phoneNumber = spans[0].textContent.trim();
        const locationCarrierText = spans[1].textContent.trim();
        const match = locationCarrierText.match(/([\u4e00-\u9fa5]+)[\s ]*([\u4e00-\u9fa5]+)?[\s ]*([\u4e00-\u9fa5]+)?/);
        if (match) {
          jsonObject.province = match[1] || '';
          jsonObject.city = match[2] || '';
          jsonObject.carrier = match[3] || '';
        }
      }
    } else {
      // Try to extract the number, province, city, and carrier for structure two
      const phoneNumberElement = doc.querySelector('.mh-tel-num span');
      console.log('phoneNumberElement:', phoneNumberElement);
      const locationElement = doc.querySelector('.mh-tel-adr p');
      console.log('locationElement:', locationElement);

      if (phoneNumberElement) {
        jsonObject.phoneNumber = phoneNumberElement.textContent.trim();
        console.log('jsonObject.phoneNumber:', jsonObject.phoneNumber);
      }

      if (locationElement) {
        const locationText = locationElement.textContent.trim();
        console.log('locationText:', locationText);
        const match = locationText.match(/([\u4e00-\u9fa5]+)[\s ]*([\u4e00-\u9fa5]+)?[\s ]*([\u4e00-\u9fa5]+)?/);
        if (match) {
          jsonObject.province = match[1] || '';
          jsonObject.city = match[2] || '';
          jsonObject.carrier = match[3] || '';
        }
        console.log('jsonObject.province:', jsonObject.province);
        console.log('jsonObject.city:', jsonObject.city);
        console.log('jsonObject.carrier:', jsonObject.carrier);
      }
    }
  } catch (error) {
    console.error('Error extracting data:', error);
  }

  console.log('Final jsonObject:', jsonObject);
  console.log('Final jsonObject type:', typeof jsonObject);
  return jsonObject;
}




// ... (pluginId, pluginInfo, predefinedLabels, manualMapping, queryPhoneInfo, extractDataFromDOM, etc. remain unchanged)

// Generate output information
async function generateOutput(phoneNumber, nationalNumber, e164Number, externalRequestId) {
  console.log('generateOutput called with:', phoneNumber, nationalNumber, e164Number, externalRequestId);

  // Function to handle a single number query (returns a Promise)
  function handleNumberQuery(number, requestId) {
    return new Promise((resolve, reject) => {
      queryPhoneInfo(number, requestId);
      pendingPromises.set(requestId, resolve);

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (pendingPromises.has(requestId)) {
          reject(new Error('Timeout waiting for response'));
          pendingPromises.delete(requestId);
          window.removeEventListener('message', messageListener);
        }
      }, 5000); // 5 seconds timeout

      // Listen for message events
      function messageListener(event) {
        console.log('Received message in event listener:', event.data);
        console.log('Received message event.data.type:', event.data.type);

        if (event.data.type === `xhrResponse_${pluginId}`) {
          const detail = event.data.detail;
          const response = detail.response;
          const receivedRequestId = detail.requestId;

          console.log('requestId from detail:', receivedRequestId);
          console.log('event.data.detail.response:', response);

          // Check if requestId matches
          if (receivedRequestId === requestId) {
            if (response.status >= 200 && response.status < 300) {
              console.log('response.responseText length:', response.responseText.length);
              console.log('response.responseText:', response.responseText);

              // Parse HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(response.responseText, 'text/html');

              // Use JavaScript code to extract data
              const jsonObject = extractDataFromDOM(doc);
              console.log('Extracted information:', jsonObject);
              console.log('Extracted information type:', typeof jsonObject);

              // Cleanup
              clearTimeout(timeoutId);
              pendingPromises.delete(requestId);
              window.removeEventListener('message', messageListener);

              // Key change: resolve and return the result immediately
              resolve(jsonObject);
            } else {
              console.error(`HTTP error! status: ${response.status}`);
              reject(new Error(`HTTP error! status: ${response.status}`));

              // Cleanup
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

  // Process each number sequentially, use whichever returns a valid result first
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

    if (nationalNumber) {
      const nationalRequestId = Math.random().toString(36).substring(2);
      try {
        result = await handleNumberQuery(nationalNumber, nationalRequestId);
      } catch (error) {
        console.error('Error querying nationalNumber:', error);
      }
    }

    if (e164Number) {
      const e164RequestId = Math.random().toString(36).substring(2);
      try {
        result = await handleNumberQuery(e164Number, e164RequestId);
      } catch (error) {
        console.error('Error querying e164Number:', error);
      }
    }

    console.log('First successful query completed:', result);
    console.log('First successful query completed type:', typeof result);

    // Ensure result is not null
    if (!result) {
      // Send error message via FlutterChannel
      FlutterChannel.postMessage(JSON.stringify({
        type: 'pluginError',
        pluginId: pluginId,
        error: 'All attempts failed or timed out.',
      }));
      return { error: 'All attempts failed or timed out.' }; // Also return the error information
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

  //  const finalResult = {
     // phoneNumber: "19*3*000000", // Use test number
   //   sourceLabel: "spam", // Harassment call
    //  count: 16,
    //  province: "New York", // take it as state
    //  city: "NEW York", // 
    //  carrier: "T", // 
   //   predefinedLabel: "Unknown",
   //   source: "A0",
   // };
    

    // Send result via FlutterChannel
    FlutterChannel.postMessage(JSON.stringify({
      type: 'pluginResult',
      "requestId": externalRequestId, // Changed to requestId
      pluginId: pluginId,
      data: finalResult,
    }));
    
    // Send result via window.parent.postMessage
  console.log(`Plugin ${pluginId} - Sending result via window.currentPluginChannel`);
  // Send result via a unified channel name
  PluginResultChannel.postMessage(JSON.stringify({
      type: 'pluginResult',
      "requestId": externalRequestId, // Changed to externalRequestId
      pluginId: pluginId,
      data: finalResult,
  }));

    
    return finalResult; // Also return the result
  } catch (error) {
    console.error('Error in generateOutput:', error);
    // Send error message via FlutterChannel
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




// Initialize plugin
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

// Initialize plugin
initializePlugin();
