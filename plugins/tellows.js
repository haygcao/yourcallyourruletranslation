// Plugin ID, each plugin must be unique
const pluginId = 'tellowsPlugin';

// Plugin information
const pluginInfo = {
  // Plugin information
  info: {
    id: 'tellowsPlugin', // Plugin ID, must be unique
    name: 'Tellows', // Plugin name
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
    url: `https://www.tellows.com/num/${phoneNumber}`, // Updated URL
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
    count: 0, //Added count
    sourceLabel: "",  // Keep sourceLabel if needed for other purposes
    province: "", //keep province
    carrier: "", // keep carrier
  };

  try {
    console.log('Document Object:', doc);

    const bodyElement = doc.body;
    if (!bodyElement) {
      console.error('Error: Could not find body element.');
      return jsonObject;
    }

    // 1. Extract Label (Priority 1: Types of call)
    const typesOfCallElement = doc.querySelector('b:contains("Types of call:")');
    if (typesOfCallElement) {
      const nextSibling = typesOfCallElement.nextSibling;
       if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
          let labelText = nextSibling.textContent.trim();
          if (labelText) {
            jsonObject.label = labelText;
          }
          
      }
    }


      // 2. Extract Label (Priority 2: Score Image)
      if (!jsonObject.label) { // Only check if label is not already set
        const scoreImage = doc.querySelector('a[href*="tellows_score"] img.scoreimage');
        if (scoreImage) {
          const altText = scoreImage.alt;
          const scoreMatch = altText.match(/Score\s([789])/);
          if (scoreMatch) {
            jsonObject.label = "Spam Call";
          }
        }
      }

    // 3. Extract Name (Caller ID)
    const callerIdElement = doc.querySelector('b:contains("Caller Name:")');
    if (callerIdElement) {
      const callerIdSpan = callerIdElement.nextElementSibling; // Assuming it's the next sibling <span>
      if (callerIdSpan && callerIdSpan.classList.contains('callerId')) {
        jsonObject.name = callerIdSpan.textContent.trim();
      }
    }

    // 4. Extract Rate
    const ratingsElement = doc.querySelector('a[href="#complaint_list"] strong span');
    if (ratingsElement) {
      jsonObject.rate = parseInt(ratingsElement.textContent.trim(), 10) || 0; // Default to 0 if parsing fails
    }


      // 5. Extract count (using Ratings as count source)
      if (ratingsElement) { // Re-use the ratings element
        jsonObject.count = parseInt(ratingsElement.textContent.trim(), 10) || 0;
      }
    // 6. Extract City
    const cityElement = doc.querySelector('strong:contains("City:")');
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


  } catch (error) {
    console.error('Error extracting data:', error);
  }

  console.log('Final jsonObject:', jsonObject);
  console.log('Final jsonObject type:', typeof jsonObject);
  return jsonObject;
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
