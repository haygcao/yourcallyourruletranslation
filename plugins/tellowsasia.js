// Plugin ID, each plugin must be unique
const pluginId = 'tellowsasiaPlugin';

// Plugin information
const pluginInfo = {
  // Plugin information
  info: {
    id: 'tellowsasiaPlugin', // Plugin ID, must be unique
    name: 'TellowsAsia', // Plugin name
    version: '1.2.0', // Plugin version
    description: 'This plugin retrieves information about phone numbers from shouldianswer.com.', // Plugin description
    author: 'Your Name', // Plugin author
  },
};

// Predefined label list (you can adjust this list based on your needs)
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

// Manual mapping table to map source labels to predefined labels (updated based on shouldianswer.com labels)
const manualMapping = {
    'Unknown': 'Unknown',
    'Trustworthy number': 'Other', //  Could be mapped to something more specific if you have a "safe" category.
    'Sweepstakes, lottery': 'Spam Likely', //  Or 'Fraud Scam Likely', depending on context
    'Debt collection company': 'Debt Collection',
    'Aggressive advertising': 'Telemarketing', // Or 'Spam Likely'
    'Survey': 'Survey',
    'Harassment calls': 'Spam Likely',  // Or 'Fraud Scam Likely', if threats are involved
    'Cost trap': 'Fraud Scam Likely',
    'Telemarketer': 'Telemarketing',
    'Ping Call': 'Spam Likely', // Often associated with scams
    'SMS spam': 'Spam Likely',
    'Spam Call': 'Spam Likely', // Added, map label extracted "spam call" to predefined "Spam Likely"
    '未知來電': 'Unknown',
    '可信賴來電': 'Other', // Could map to a "Safe" category if you have one
    '贈獎活動': 'Spam Likely', // Sweepstakes - often scam/spam
    '討債公司': 'Debt Collection',
    '煩人廣告': 'Telemarketing', // Annoying advertising
    '市場調查': 'Survey',
    '電話恐嚇': 'Fraud Scam Likely', // Phone threats - high risk
    '付費電話': 'Other', // Cost trap / premium rate number - could be 'Risk'
    '銷售專線': 'Telemarketing', // Sales line
    'Ping通话': 'Spam Likely',    // Ping Call
    '詐騙短信': 'Spam Likely',   // Scam SMS
    'Spam Call': 'Spam Likely', //From score
    'Unknown': 'Unknown',  
};


// Using a Map object to store pending Promises
const pendingPromises = new Map();

// Function to query phone number information
function queryPhoneInfo(phoneNumber, requestId) {
    console.log('queryPhoneInfo called with phoneNumber:', phoneNumber, 'and requestId:', requestId);
    FlutterChannel.postMessage(JSON.stringify({
        pluginId: pluginId,
        method: 'GET',
        requestId: requestId,
        url: `https://www.tellows.com/num/${phoneNumber}`, // Use tellows.com as base, language detection below
        headers: {
            "User-Agent": 'Mozilla/5.0 (Linux; arm_64; Android 14; SM-S711B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.199 YaBrowser/24.12.4.199.00 SA/3 Mobile Safari/537.36',
        },
    }));
}

// Function to extract data using DOMParser API
function extractDataFromDOM(doc, phoneNumber) {
    const jsonObject = {
        phoneNumber: phoneNumber,
        label: "",
        name: "",
        rate: 0,
        city: "",
        count: 0,
        sourceLabel: "",
        province: "",
        carrier: "",
    };

    try {
        console.log('Document Object:', doc);

        const bodyElement = doc.body;
        if (!bodyElement) {
            console.error('Error: Could not find body element.');
            return jsonObject;
        }
      // --- Language Detection (use URL if possible, fallback to doc.documentElement.lang) ---
        let baseUrl = "https://www.tellows.com";  //Default
        let currentManualMapping = manualMapping; // Default to tellows.tw (Traditional Chinese)

        // Check the URL for language/country codes (MOST RELIABLE)
        const currentURL = doc.location.href; // Get the *actual* URL of the loaded page
        if (currentURL.includes("tellows.tw")) {
          baseUrl = "https://www.tellows.tw";
          currentManualMapping = manualMapping;
        } else if (currentURL.includes("tellows.com.hk")) { //example
          baseUrl = "https://www.tellows.com.hk";
            //currentManualMapping = manualMappingHongKong;  // You'd need a separate mapping for Hong Kong
        } else if (currentURL.includes("tellows.com")) {
          baseUrl = "https://www.tellows.com";
           // currentManualMapping = manualMappingEnglish;  // Use English as default for .com
        } // ... add other tellows domains as needed ...

        // Fallback to doc.documentElement.lang (LESS RELIABLE)
        else if (doc.documentElement.lang.startsWith('zh-TW')) {
            baseUrl = "https://www.tellows.tw";
            currentManualMapping = manualMapping;
        } else if (doc.documentElement.lang.startsWith('zh-HK')) { //example
             baseUrl = "https://www.tellows.com.hk";
           // currentManualMapping = manualMappingHongKong;
        }


        // --- Priority 1: Label from "來電種類" ---
        const callTypeElement = doc.querySelector('b:contains("來電種類:")'); // Find the <b> tag
        if (callTypeElement) {
            const nextSibling = callTypeElement.nextSibling;
            if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                let labelText = nextSibling.textContent.trim();
                 if (labelText) {
                     jsonObject.sourceLabel = labelText;
                    jsonObject.label = currentManualMapping[labelText] || 'Unknown'; // Use the correct mapping
                }
            }
        }

        // --- Priority 2: Label from Score Image (if Priority 1 fails) ---
        if (!jsonObject.label) {
            const scoreImage = doc.querySelector('.scorepic a img.scoreimage');
            if (scoreImage) {
                const altText = scoreImage.alt;
                const scoreMatch = altText.match(/Score\s([789])/);
                if (scoreMatch) {
                   jsonObject.sourceLabel = "Spam Call";
                    jsonObject.label = 'Spam Likely'; // Map scores 7, 8, or 9 to "Spam Call"
                }
            }
        }

        // --- Extract Name (Caller ID) ---
        const callerIdSpan = doc.querySelector('.callerId');
        if (callerIdSpan) {
            jsonObject.name = callerIdSpan.textContent.trim();
        }

        // --- Extract Count ---
        const countElement = doc.querySelector('a[href="#complaint_list"] strong span');
        if (countElement) {
            jsonObject.count = parseInt(countElement.textContent.trim(), 10) || 0;
        }

        // --- Extract City ---
       const cityElement = doc.querySelector('strong:contains("城市:")');
        if (cityElement) {
          const cityText = cityElement.nextSibling;

          if (cityText && cityText.nodeType === Node.TEXT_NODE)
          {
             const cityValue = cityText.textContent.trim().split('-')[0].trim();
             const cityParts = cityValue.split(','); // Split by comma
                if (cityParts.length > 1) {
                  jsonObject.city = cityParts[0].trim();   // Use the first part (city name)
                } else {
                   jsonObject.city = cityParts[0].trim();
                }
          }
        }
       //try get city from 區域號碼
        if(!jsonObject.city){
            const areaCodeElement = doc.querySelector('strong:contains("區域號碼:")');
             if (areaCodeElement) {
                  const cityText = areaCodeElement.nextSibling;

                  if (cityText && cityText.nodeType === Node.TEXT_NODE)
                  {
                     const cityValue = cityText.textContent.trim().split('-')[0].trim();
                     const cityParts = cityValue.split(','); // Split by comma
                        if (cityParts.length > 1) {
                          jsonObject.city = cityParts[0].trim();   // Use the first part (city name)
                        } else {
                           jsonObject.city = cityParts[0].trim();
                        }
                  }
              }
        }

    } catch (error) {
        console.error('Error extracting data:', error);
        return jsonObject; // Return object even on error
    }

    console.log('Final jsonObject:', jsonObject);
    return jsonObject;
}


// Function to generate output information
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
              const jsonObject = extractDataFromDOM(doc, number); // Pass the number to extractDataFromDOM
              console.log('Extracted information:', jsonObject);
              console.log('Extracted information type:', typeof jsonObject);

              // Cleanup
              clearTimeout(timeoutId);
              pendingPromises.delete(requestId);
              window.removeEventListener('message', messageListener);

              // Resolve the promise with the extracted data
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
        console.log('Query result for phoneNumber:', result);
      } catch (error) {
        console.error('Error querying phoneNumber:', error);
      }
    }

    if (nationalNumber) {
      const nationalRequestId = Math.random().toString(36).substring(2);
      try {
        result = await handleNumberQuery(nationalNumber, nationalRequestId);
        console.log('Query result for nationalNumber:', result);
      } catch (error) {
        console.error('Error querying nationalNumber:', error);
      }
    }

    if (e164Number) {
      const e164RequestId = Math.random().toString(36).substring(2);
      try {
        result = await handleNumberQuery(e164Number, e164RequestId);
        console.log('Query result for e164Number:', result);
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

    // Find a matching predefined label using the found sourceLabel
    let matchedLabel = predefinedLabels.find(label => label.label === result.sourceLabel)?.label;

    // If no direct match is found, try to find one in manualMapping
    if (!matchedLabel) {
      matchedLabel = manualMapping[result.sourceLabel];
    }

    // If no match is found in manualMapping, use 'Unknown'
    if (!matchedLabel) {
      matchedLabel = 'Unknown';
    }

    const finalResult = {
      phoneNumber: result.phoneNumber,
      sourceLabel: result.sourceLabel,
      count: result.count,
      province: result.province,
      city: result.city,
      carrier: result.carrier,
      predefinedLabel: matchedLabel, // Use the matched label
      source: pluginInfo.info.name,
    };

    // Send the result via FlutterChannel
    FlutterChannel.postMessage(JSON.stringify({
      type: 'pluginResult',
      requestId: externalRequestId,
      pluginId: pluginId,
      data: finalResult,
    }));

    // Send the result via window.parent.postMessage (this part might need adjustment based on your environment)
    console.log(`Plugin ${pluginId} - Sending result via window.currentPluginChannel`);
    if (typeof PluginResultChannel !== 'undefined') {
        PluginResultChannel.postMessage(JSON.stringify({
            type: 'pluginResult',
            requestId: externalRequestId,
            pluginId: pluginId,
            data: finalResult,
        }));
    } else {
        console.error('PluginResultChannel is not defined');
    }

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
