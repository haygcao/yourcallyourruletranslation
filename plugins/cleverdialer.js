// Plugin ID, each plugin must be unique, changed to shouldianswer
const pluginId = 'cleverdialerPlugin';

// Plugin information
const pluginInfo = {
  // Plugin information
  info: {
    id: 'cleverdialerPlugin', // Plugin ID, must be unique, changed to shouldianswer
    name: 'cleverdialer', // Plugin name, changed to Should I Answer (based on the website name)
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
    {'label': 'Risk'},
    {'label': 'Agent'},
    {'label': 'Recruiter'},
    {'label': 'Headhunter'},
    {'label': 'Silent Call(Voice Clone?)'},
];

// Manual mapping table to map source labels to predefined labels (updated based on shouldianswer.com labels)
const manualMapping = {
    'Agencia de cobranza': 'Debt Collection',
    'Apuestas': 'Other', // Or 'Risk', depending on context
    'Asesoría': 'Other',  // Could be 'Financial', 'Legal', etc. - context-dependent
    'Buzón': 'Other',       // Voicemail
    'Donación': 'Charity',
    'Dudoso': 'Spam Likely', // Dubious
    'Encuesta': 'Survey',
    'Fraude criptográfico': 'Fraud Scam Likely', // Crypto fraud
    'Gastronomia': 'Other', // Hospitality/Food
    'Llamada Ping': 'Spam Likely',  // Ping Call
    'Llamadas recurrentes': 'Spam Likely', // Recurring calls
    'Negocio': 'Other',   // Business - could be 'Customer Service', 'Sales', etc.
    'Phishing': 'Fraud Scam Likely',
    'Prestación de Servicio': 'Customer Service', // Service provision
    'Publicidad': 'Telemarketing', // Advertising = Commercial
    'Salud': 'Medical',
    'Servicio al cliente': 'Customer Service',
    'Soporte': 'Customer Service', // Support
    'Spam': 'Spam Likely',
    'Trampa de costos': 'Fraud Scam Likely', // Cost trap
    'Ventas': 'Telemarketing', // Sales
    'Unknown': 'Unknown',
    'Spam': 'Spam Likely',          // Map 'Spam'
    'Enervante': 'Spam Likely',     // Map 'Enervante'
    'Neutral': 'Unknown',         // Map 'Neutral'
    'Positivo': 'Other',         // Map 'Positivo'
    'Excelente': 'Other'        // Map 'Excelente'
};

// Using a Map object to store pending Promises
const pendingPromises = new Map();

// Function to query phone number information (remains unchanged)
function queryPhoneInfo(phoneNumber, requestId) {
  console.log('queryPhoneInfo called with phoneNumber:', phoneNumber, 'and requestId:', requestId);
  FlutterChannel.postMessage(JSON.stringify({
    pluginId: pluginId,
    method: 'GET',
    requestId: requestId,
    url: `https://www.cleverdialer.es/numero/${phoneNumber}`,
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

    // --- Priority 1: Label from *FIRST* Recent Comment ---
    const callTypeCell = doc.querySelector('#comments .container-recent-comments td.callertype'); // Directly get the FIRST td.callertype
    if (callTypeCell) {
        const labelText = callTypeCell.textContent.trim();
        jsonObject.sourceLabel = labelText;
        jsonObject.label = manualMapping[labelText] || 'Unknown';
    }

    // --- Priority 2: Label and Count from Rating ---
    if (!jsonObject.label) { // Only if Priority 1 didn't find a label
      const ratingDiv = doc.querySelector('.stars.star-rating .front-stars');
        if (ratingDiv) {
            const classValue = ratingDiv.className; // Get the full class name (e.g., "front-stars stars-3")
            const starMatch = classValue.match(/stars-(\d)/); // Extract the number

            if (starMatch) {
                 const starRating = parseInt(starMatch[1], 10);

                // Extract star rating from text for comparison (more robust)
                const ratingTextSpan = doc.querySelector('.rating-text span:first-child');
                if (ratingTextSpan) {
                    const textRatingMatch = ratingTextSpan.textContent.match(/(\d)\s+de\s+5/);
                    if (textRatingMatch) {
                        const textRating = parseInt(textRatingMatch[1], 10);

                         //Compare ratings
                        if(starRating === textRating){
                            // Map star rating to label
                            if (starRating === 1) {
                                 jsonObject.sourceLabel = `stars-${starRating}`;
                                jsonObject.label = 'Spam Likely';
                            } else if (starRating === 2) {
                                jsonObject.sourceLabel = `stars-${starRating}`;
                                jsonObject.label = 'Spam Likely'; //"Enervante"
                            } else if (starRating === 3) {
                                jsonObject.sourceLabel = `stars-${starRating}`;
                                jsonObject.label = 'Unknown'; // "Neutral"
                            } else if (starRating === 4) {
                                 jsonObject.sourceLabel = `stars-${starRating}`;
                                jsonObject.label = 'Other'; //  "Positivo"
                            } else if (starRating === 5) {
                                jsonObject.sourceLabel = `stars-${starRating}`;
                                jsonObject.label = 'Other';  //"Excelente"
                            }
                        }
                    }
                }
            }
        }

      // Extract Count (only if we're in Priority 2)
      const countSpan = doc.querySelector('.rating-text .nowrap');
      if (countSpan) {
        const countMatch = countSpan.textContent.match(/(\d+)\s+valoración/); // Match digits before "valoración"
        if (countMatch) {
          jsonObject.count = parseInt(countMatch[1], 10) || 0;
        }
      }
    }


    // --- Extract City ---
    const cityH4 = doc.querySelector('.list-text h4');
    if (cityH4) {
      jsonObject.city = cityH4.textContent.trim();
    }

    console.log('Final jsonObject:', jsonObject);
    return jsonObject;

  } catch (error) {
    console.error('Error extracting data:', error);
    return jsonObject; // Important: Return the object even on error
  }
}

// Function to generate output information (remains largely unchanged)
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
              const jsonObject = extractDataFromDOM(doc, number); // Pass the number
              console.log('Extracted information:', jsonObject);

              // Cleanup
              clearTimeout(timeoutId);
              pendingPromises.delete(requestId);
              window.removeEventListener('message', messageListener);

              // Resolve with the extracted data
              resolve(jsonObject);
            } else {
              console.error(`HTTP error! status: ${response.status}`);
              reject(new Error(`HTTP error! status: ${response.status}`));
                // Cleanup
                clearTimeout(timeoutId);
                pendingPromises.delete(requestId);
                window.removeEventListener('message', messageListener);
            }
          }
        }
      }

      window.addEventListener('message', messageListener);
    });
  }
}



// Function to generate output information (remains largely unchanged)
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
              const jsonObject = extractDataFromDOM(doc, number); // Pass the number
              console.log('Extracted information:', jsonObject);

              // Cleanup
              clearTimeout(timeoutId);
              pendingPromises.delete(requestId);
              window.removeEventListener('message', messageListener);

              // Resolve with the extracted data
              resolve(jsonObject);
            } else {
              console.error(`HTTP error! status: ${response.status}`);
              reject(new Error(`HTTP error! status: ${response.status}`));
                // Cleanup
                clearTimeout(timeoutId);
                pendingPromises.delete(requestId);
                window.removeEventListener('message', messageListener);
            }
          }
        }
      }

      window.addEventListener('message', messageListener);
    });
  }
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
