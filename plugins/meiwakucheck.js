// Plugin ID, each plugin must be unique
const pluginId = 'meiwakucheckPlugin';

// Plugin information
const pluginInfo = {
  // Plugin information
  info: {
    id: 'meiwakucheckPlugin', // Plugin ID, must be unique
    name: 'Meiwaku Check', // Plugin name
    version: '1.2.0', // Plugin version
    description: 'This plugin retrieves information about phone numbers from meiwakucheck.com.', // Plugin description
    author: 'Your Name', // Plugin author
  },
};

// Predefined label list (DO NOT MODIFY)
const predefinedLabels = [
  { label: 'Fraud Scam Likely' },
  { label: 'Spam Likely' },
  { label: 'Telemarketing' },
  { label: 'Robocall' },
  { label: 'Delivery' },
  { label: 'Takeaway' },
  { label: 'Ridesharing' },
  { label: 'Insurance' },
  { label: 'Loan' },
  { label: 'Customer Service' },
  { label: 'Unknown' },
  { label: 'Financial' },
  { label: 'Bank' },
  { label: 'Education' },
  { label: 'Medical' },
  { label: 'Charity' },
  { label: 'Other' },
  { label: 'Debt Collection' },
  { label: 'Survey' },
  { label: 'Political' },
  { label: 'Ecommerce' },
  { label: 'Risk' },
  {'label': 'Agent'},
  {'label': 'Recruiter'},
  {'label': 'Headhunter'},
  {'label': 'Silent Call(Voice Clone?)'},  
];

// Manual mapping table to map source labels to predefined labels (UPDATED)
const manualMapping = {
  '勧誘/営業/案内': 'Telemarketing',    //  '・勧誘 / 営業 / 案内' maps to 'Telemarketing'
  '詐欺 / 犯罪の匂い': 'Fraud Scam Likely', // '・詐欺 / 犯罪の匂い' maps to 'Fraud Scam Likely'
  'その他の迷惑': 'Spam Likely',       // '・その他の迷惑' maps to 'Spam Likely'
  '不明': 'Unknown',                  // '・不明' maps to 'Unknown'
  '安全 / (迷惑ではない)': 'Other',      // '・安全 / (迷惑ではない)' maps to 'Other' (because it's not a nuisance call)
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
    url: `https://meiwakucheck.com/search?tel_no=${phoneNumber}`,
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
        phoneNumber: phoneNumber,
        name: "unknown"
    };

    try {
        console.log('Document Object:', doc);

        const bodyElement = doc.body;
        console.log('Body Element:', bodyElement);
        if (!bodyElement) {
            console.error('Error: Could not find body element.');
            return jsonObject;
        }

        // --- Extract Phone Number --- (Corrected)
        const phoneNumberElement = doc.querySelector('.span9 h3');
        if (phoneNumberElement) {
            const phoneNumberText = phoneNumberElement.textContent.trim().replace('検索結果：', '');
            jsonObject.phoneNumber = phoneNumberText;
        }


        // --- Extract Name --- (Corrected, using the correct table)
        const nameElement = doc.querySelector('table.table-bordered.table-condensed tr:first-child td'); // Select the first td in the first tr

        if (nameElement) {
            let nameText = nameElement.textContent.trim();

             // Remove "[▼詳細を見る]" and anything after it (Corrected)
            const detailIndex = nameText.indexOf('[▼詳細を見る]');
            if (detailIndex !== -1) {
              nameText = nameText.substring(0, detailIndex).trim();
            }

            const thElement = nameElement.parentElement.querySelector('th');
            if (thElement && thElement.textContent.trim() === '利用事業者') {
                jsonObject.name = nameText === '？' ? 'Unknown' : (nameText === '---' ? 'unknown' : nameText);
            }

        }


        // --- Extract Count --- (Corrected, using the correct table and structure)
        const countElement = doc.querySelector('table.table-bordered.table-condensed tr:nth-child(2) td strong'); // Target the <strong> tag
        if (countElement) {
            const countText = countElement.textContent.trim();
            jsonObject.count = parseInt(countText, 10) || 0; // Directly parse the number.  Use 0 as default.
        }


        // --- Extract Province and City --- (Corrected)
       const locationElement = doc.querySelector('table.table-bordered.table-condensed tr:nth-child(5) td:nth-child(2)');
       if (locationElement)
       {
          const locationText = locationElement.textContent.trim();
          if (locationText === '---')
            {
                 jsonObject.province = "unknown";
                 jsonObject.city = "unknown";
            }
          else{
                jsonObject.province = locationText;
                jsonObject.city = locationText; // if parts[1] not exist，city=provice
              }
       }
        // --- Extract Label --- (Corrected, using the correct table structure)
       // --- Extract Label --- (Corrected, finds *all* labels)
        const labelElements = doc.querySelectorAll('table.table-bordered.table-condensed i.icon-comment + u > b');
        if (labelElements.length > 0) {
            // Get the *first* label.  If you need all labels, you'd use a different approach.
            jsonObject.sourceLabel = labelElements[0].textContent.trim();

            // If you want to get *all* labels as a comma-separated string:
            // const labels = Array.from(labelElements).map(el => el.textContent.trim());
            // jsonObject.sourceLabel = labels.join(', ');

             // If you want *all* labels, each in its own property (sourceLabel1, sourceLabel2, etc.):
            // for (let i = 0; i < labelElements.length; i++) {
            //     jsonObject[`sourceLabel${i + 1}`] = labelElements[i].textContent.trim();
            // }
        }

    } catch (error) {
        console.error('Error extracting data:', error);
    }

    console.log('Final jsonObject:', jsonObject);
    // console.log('Final jsonObject type:', typeof jsonObject); // You can uncomment this if needed
    return jsonObject;
}

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
