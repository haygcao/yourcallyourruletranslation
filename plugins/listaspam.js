// Plugin ID, each plugin must be unique, changed to shouldianswer
const pluginId = 'listaspamPlugin';

// Plugin information
const pluginInfo = {
  // Plugin information
  info: {
    id: 'listaspamPlugin', // Plugin ID, must be unique, changed to shouldianswer
    name: 'ListaspamES', // Plugin name, changed to Should I Answer (based on the website name)
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
    'Suplantación de identidad': 'Fraud Scam Likely', // Identity theft
    'Presunta estafa': 'Fraud Scam Likely', // Potential scam
    'Presuntas amenazas': 'Fraud Scam Likely',  // Potential threats - High risk
    'Cobro de deudas': 'Debt Collection',
    'Telemarketing': 'Telemarketing',
    'Llamada de broma': 'Spam Likely', // Prank call
    'Mensaje SMS': 'Spam Likely', // SMS message
    'Encuesta': 'Survey',
    'Recordatorio automático': 'Robocall', // Automated reminder
    'Llamada perdida': 'Spam Likely',    // Missed call - Often used for scams
    'Sin especificar': 'Unknown',
    'Unknown' : 'Unknown',
    'Spam Call' : 'Spam Likely', // Add mapping from 'Spam Call'
    'Beratung': 'Other',           // Counsel - Could be Financial, Legal, etc.
    'Crypto Betrug': 'Fraud Scam Likely', // Crypto Fraud
    'Daueranrufe': 'Spam Likely',      // Continuous calls
    'Dienstleistung': 'Customer Service', // Service provision
    'Gastronomie': 'Other',          // Hospitality industry
    'Geschäft': 'Other',             // Business - Could be many things
    'Gesundheit': 'Medical',
    'Gewinnspiel': 'Other',      // Sweepstake - Often spam/scam related
    'Inkassounternehmen': 'Debt Collection',
    'Kostenfalle': 'Fraud Scam Likely',  // Cost trap
    'Kundendienst': 'Customer Service',
    'Mailbox': 'Other',              // Voicemail
    'Phishing': 'Fraud Scam Likely',
    'Ping Anruf': 'Spam Likely',       // Ping Call
    'Spam': 'Spam Likely',
    'Spenden': 'Charity',
    'Support': 'Customer Service',    // Support
    'Umfrage': 'Survey',
    'Unseriös': 'Spam Likely',        // Dubious
    'Verkauf': 'Telemarketing',         // Sales
    'Werbung': 'Telemarketing',         // Commercial = advertising
    'Unknown': 'Unknown',            // Always map Unknown to Unknown
    'Business': 'Other', //  Could be 'Customer Service', 'Sales', etc.
    'Charity': 'Charity',
    'Commercial': 'Telemarketing', // Advertising
    'Continuous calls': 'Spam Likely',
    'Cost trap': 'Fraud Scam Likely',
    'Counsel': 'Other', // Could be Financial, Legal, etc.
    'Crypto fraud': 'Fraud Scam Likely',
    'Customer Service': 'Customer Service',
    'Debt collection agency': 'Debt Collection',
    'Dubious': 'Spam Likely',
    'Health': 'Medical',
    'Hospitality industry': 'Other', //  Could be 'Takeaway', 'Delivery'
    'Mailbox': 'Other', // Voicemail
    'Phishing': 'Fraud Scam Likely',
    'Ping call': 'Spam Likely',
    'Sales': 'Telemarketing',
    'Service': 'Customer Service',
    'Spam': 'Spam Likely',
    'Support': 'Customer Service', // Support
    'Survey': 'Survey',
    'Sweepstake': 'Other', //  Often spam/scam, could be 'Risk'
    'Unknown': 'Unknown',  // Always map Unknown  
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
    url: `https://www.listaspam.com/busca.php?Telefono=${phoneNumber}`,
    headers: {
      "User-Agent": 'Mozilla/5.0 (Linux; arm_64; Android 14; SM-S711B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.199 YaBrowser/24.12.4.199.00 SA/3 Mobile Safari/537.36',
    },
  }));
}

// Function to extract data using DOMParser API
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
    if (!bodyElement) {
      console.error('Error: Could not find body element.');
      return jsonObject;
    }

    // --- Priority 1: Label and Count from within the <section> ---
    const numberDataSection = doc.querySelector('section.number_data_box');
    if (numberDataSection) { // Check if the section exists
        const labelParagraph = numberDataSection.querySelector('p[style*="margin-bottom:0"]');

        if(labelParagraph) {
            const paragraphText = labelParagraph.textContent;

             const labelOrder = [
                'Suplantación de identidad',
                'Presunta estafa',
                'Presuntas amenazas',
                'Cobro de deudas',
                'Telemarketing',
                'Llamada de broma',
                'Mensaje SMS',
                'Encuesta',
                'Recordatorio automático',
                'Llamada perdida',
                'Sin especificar',
              ];

              for (const labelText of labelOrder) {
                const regex = new RegExp(`<strong>${labelText}</strong>\\s*\\((\\d+)\\s*veces\\)`);
                const match = paragraphText.match(regex);
                if (match) {
                  jsonObject.sourceLabel = labelText;
                  jsonObject.label = manualMapping[labelText] || 'Unknown';
                  jsonObject.count = parseInt(match[1], 10) || 0;
                  break; // Important: Stop after the first match
                }
              }
        }
    }


    // --- Priority 2: Label and Count from other elements (if Priority 1 fails) ---
    if (!jsonObject.label) {
      const ratingDiv = doc.querySelector('.rate-and-owner > div[class^="phone_rating"]');
      if (ratingDiv) {
        if (ratingDiv.classList.contains('result-2') || ratingDiv.classList.contains('result-1')) {
            jsonObject.sourceLabel = "Spam Call";
            jsonObject.label = 'Spam Likely';
        } else if (ratingDiv.classList.contains('result-3')) {
            jsonObject.sourceLabel = "Unknown";
            jsonObject.label = 'Unknown';
        } else if (ratingDiv.classList.contains('result-4') || ratingDiv.classList.contains('result-5')) {
            jsonObject.sourceLabel = "Other";
            jsonObject.label = 'Other';
        }

        const countSpan = doc.querySelector('.n_reports .result a');
        if (countSpan) {
          jsonObject.count = parseInt(countSpan.textContent, 10) || 0;
        }
      }
    }


    // --- Extract City ---
    const citySpan = doc.querySelector('.data_location span');
    if (citySpan) {
      jsonObject.city = citySpan.textContent.split('-')[0].trim();
    }

    console.log('Final jsonObject:', jsonObject);
    return jsonObject;

  } catch (error) {
    console.error('Error extracting data:', error);
    return jsonObject;
  }
}



//update
// Function to generate output information
async function generateOutput(phoneNumber, nationalNumber, e164Number, externalRequestId) {
  console.log('generateOutput called with:', phoneNumber, nationalNumber, e164Number, externalRequestId);

  // Rest of the generateOutput function remains the same...
  // ... (No changes needed here because manualMapping is now correctly defined)
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
            name: result.name,
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
