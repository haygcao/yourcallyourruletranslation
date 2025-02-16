// Plugin ID, each plugin must be unique, changed to shouldianswer
const pluginId = 'doisjerepondrePlugin';

// Plugin information
const pluginInfo = {
  // Plugin information
  info: {
    id: 'doisjerepondre', // Plugin ID, must be unique, changed to shouldianswer
    name: 'Doisjerepondre', // Plugin name, changed to Should I Answer (based on the website name)
    version: '1.2.0', // Plugin version
    description: 'This plugin retrieves information about phone numbers from shouldianswer.com.', // Plugin description, updated description
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
    {'label': 'Silent call(Voice Clone?)'}, 
];

// Manual mapping table to map source labels to predefined labels (updated based on shouldianswer.com labels)
const manualMapping = {
    'Télévendeur': 'Telemarketing',
    'Centre d\'appel': 'Customer Service', // Or 'Telemarketing' - context dependent
    'Services financiers': 'Financial',
    'Agent de recouvrement': 'Debt Collection',
    'Entreprise': 'Other',  // Could be 'Customer Service' if referring to a legitimate company
    'Service': 'Customer Service', // Or 'Other'
    'Organisation à but non lucratif': 'Charity',
    'Sondage': 'Survey',
    'Appel malveillant': 'Fraud Scam Likely', // More severe than just spam
    'Appel non sollicité': 'Spam Likely',
    'Appel politique': 'Political',
    'Appel d\'arnaque': 'Fraud Scam Likely',
    'Canular téléphonique': 'Spam Likely', // Or 'Other'
    'Autre': 'Other',
    'Inconnu': 'Unknown', // Added, in case you extract "Inconnu" from somewhere else
    'Unknown': 'Unknown',  // Always map 'Unknown' to itself
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
    url: `https://www.doisjerepondre.fr/numero-de-telephone/${phoneNumber}`, // Updated URL
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
    name: "",       // Not available on this site
    rate: 0,       // No direct rate, could be inferred from count/label
    city: "",
    count: 0,
    sourceLabel: "",
    province: "",  // Not directly available, might be part of city
    carrier: "",   // Not directly available
  };

  try {
    console.log('Document Object:', doc);

    const bodyElement = doc.body;
    if (!bodyElement) {
      console.error('Error: Could not find body element.');
      return jsonObject;
    }

    // --- Extract phone number, label, and city ---
    const numberElement = doc.querySelector('.number');
    console.log('numberElement:', numberElement);
    if (numberElement) {
      // Extract phone number
      jsonObject.phoneNumber = numberElement.firstChild.nodeValue.trim();


      // Extract label - targeting the correct span and removing prefixes
      const labelSpan = numberElement.querySelector('span[style="color:#000"]');
      if (labelSpan) {
        const rawLabel = labelSpan.textContent.trim();
        const cleanedLabel = rawLabel.replace(/^(Négative|Neutre|Positive)\s*/i, '').trim();
        jsonObject.sourceLabel = cleanedLabel;      // Store raw (but cleaned) label
        jsonObject.label = manualMapping[cleanedLabel] || 'Unknown';  // Map to predefined label
      }

      // Extract city - targeting the *last* span, handling multiple parts correctly
        const locationSpan = numberElement.querySelector('span:last-of-type');
        if (locationSpan) {
            const locationText = locationSpan.textContent.trim();
            //  Split by comma and take the *last* part.  Handles cases like "City, Region"
            const locationParts = locationText.split(',');
            jsonObject.city = locationParts[locationParts.length - 1].trim();
        }

      console.log('jsonObject.sourceLabel:', jsonObject.sourceLabel);
      console.log('jsonObject.phoneNumber:', jsonObject.phoneNumber);
      console.log('jsonObject.city:', jsonObject.city);
    }


    // --- Extract count ---
    const advancedDiv = doc.querySelector('.advanced');
        console.log('advancedDiv:', advancedDiv);
        if (advancedDiv) {
            const countStrong = advancedDiv.querySelector('strong:nth-child(2)');
            console.log('countStrong:', countStrong);

            if (countStrong) {
                // Try to parse the count directly from the strong element
                jsonObject.count = parseInt(countStrong.textContent, 10) || 0;

            } else {
                 //If strong element not found, check for "Nous avons une" (meaning 1)
                 const textContent = advancedDiv.textContent;
                if (textContent.includes('Nous avons une')) {
                    jsonObject.count = 1;
                }

            }
        }
    console.log('jsonObject.count:', jsonObject.count);

  } catch (error) {
    console.error('Error extracting data:', error);
  }

  console.log('Final jsonObject:', jsonObject);
  console.log('Final jsonObject type:', typeof jsonObject);
  return jsonObject;
}


// Function to generate output information (remains largely unchanged, just adapting to new structure)
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
