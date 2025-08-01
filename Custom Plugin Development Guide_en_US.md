# Custom Phone Number Query Plugin Documentation (English)

This documentation aims to help users understand how to create and modify custom phone number query plugins based on existing templates. The plugin works by using an iframe proxy to circumvent cross-origin restrictions and parses the HTML content of a specific website to retrieve phone number information.

**Important Note:** The `predefinedLabels` list is fixed and cannot be changed. These labels represent the predefined phone number categories within the application.

You can adjust the following marked sections as needed:

## 1. Plugin Configuration (`PLUGIN_CONFIG`) - **MODIFIABLE**

```javascript
const PLUGIN_CONFIG = {
    id: 'yourPluginId', // **MODIFY:** Set a unique ID for your plugin (e.g., 'myCustomPlugin')
    name: 'Your Plugin Name', // **MODIFY:** Friendly name for the plugin (e.g., 'My Custom Phone Lookup')
    version: '1.0.0', // **MODIFY:** Plugin version number
    description: 'A brief description of the plugin' // **MODIFY:** Describe the plugin's functionality
};
```
*   `id`: Must be globally unique to distinguish different plugins within the application.
*   `name`: Will be displayed in the application's user interface.
*   `version` and `description`: Used for describing and tracking the plugin.

## 2. Manual Mapping (`manualMapping`) - **MODIFIABLE**

```javascript
const manualMapping = {
    'Label on Website A': 'Fraud Scam Likely', // **MODIFY:** Example: Map the website's "Fraud" to the app's "Fraud Scam Likely"
    'Label on Website B': 'Spam Likely',      // **MODIFY:** Example: Map the website's "Advert" to the app's "Spam Likely"
    // **MODIFY:** Add more mappings...
};
```
*   `manualMapping` is an object that maps specific labels or keywords found on your target website to one of the fixed `predefinedLabels`.
*   The keys (`'Label on Website A'`) are the raw text strings parsed from the target website. Ensure this text **exactly matches** the labels displayed on the website.
*   The values (`'Fraud Scam Likely'`) must be a valid label from the `predefinedLabels` list.
*   **MODIFY:** You need to adjust these mappings based on the actual content of your target website and your desired classification. **Ensure you choose and adjust these mappings according to the language and linguistic habits used on the target website (e.g., Chinese labels for Chinese websites, English labels for English websites).**

## 3. Keyword List (e.g., `slicklyKeywords`) - **MODIFIABLE (if present in your template)**

```javascript
const slicklyKeywords = [
    'Keyword A', // **MODIFY:** Example: 'Scam'
    'Keyword B', // **MODIFY:** Example: 'Telemarketing'
    // **MODIFY:** Add more keywords...
];
```
*   This list (if present in the template you are using) is used by the parsing logic to search for specific keywords within the website content. This can help more precisely identify the type of phone number, for instance, by looking for keywords in comments.
*   **MODIFY:** Adjust these keywords based on the content of your target website and the keywords you wish to recognize. **Ensure you choose and adjust these keywords according to the language and linguistic habits used on the target website.**

## 4. Block and Allow Keywords (`blockKeywords` and `allowKeywords`) - **MODIFIABLE**

```javascript
const blockKeywords = [
    'Block Keyword A', // **MODIFY:** Example: 'Scam', 'Harassment'
    'Block Keyword B',
    // **MODIFY:** Add more block keywords...
];

const allowKeywords = [
    'Allow Keyword A', // **MODIFY:** Example: 'Delivery', 'Customer Service'
    'Allow Keyword B',
    // **MODIFY:** Add more allow keywords...
];
```
*   These lists are used to automatically determine whether a phone number should be blocked (`'block'`) or allowed (`'allow'`) based on the parsed `sourceLabel`.
*   If the `sourceLabel` contains any keyword from the `blockKeywords` list, the plugin will suggest blocking the number.
*   If the `sourceLabel` contains any keyword from the `allowKeywords` list AND the number is not matched by a block keyword, the plugin will suggest allowing the number.
*   **MODIFY:** **Exercise caution when selecting these keywords, as they directly impact the application's blocking or allowing behavior.** **Ensure you choose and adjust these keywords according to the language and linguistic habits used on the target website.**

## 5. Target Search URL (`targetSearchUrl`) and Headers (`headers`) - **MODIFIABLE**

```javascript
function initiateQuery(phoneNumber, requestId, countryCode) { // countryCode parameter may exist or not, depending on the template
    // ... other code ...
    // **MODIFY:** Adjust URL structure based on the target website
    const targetSearchUrl = `https://www.example.com/search?q=${encodeURIComponent(phoneNumber)}`;
    const headers = {
        'User-Agent': 'Your User Agent String', // **MODIFY:** Recommend using a common browser User-Agent
        // **MODIFY:** Add other necessary Headers, like Cookies or Referer
    };
    const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
    // ... other code ...
}
```
*   `targetSearchUrl`: This is the external website URL that the plugin will actually request. You need to construct this URL based on the search functionality of the phone number lookup website you choose. Ensure the phone number parameter is correctly encoded into the URL.
*   `headers`: This is an object containing the HTTP headers that should be included when sending the request. Common headers include `User-Agent`. Some websites may require specific Headers to function correctly or return the right content. You may need to analyze the target website's requests using browser developer tools to determine the required Headers.

## 6. HTML Parsing Logic (`function getParsingScript(...)`) - **CORE MODIFICATION SECTION**

```javascript
function getParsingScript(pluginId, phoneNumberToQuery) {
    return `
        (function() {
            // ... internal variables and functions ...

            function parseContent(doc) {
                // **MODIFY:** This is the core part where you write code to parse the loaded HTML content (doc)
                const result = {
                    phoneNumber: PHONE_NUMBER,
                    sourceLabel: '', // The raw label/keyword extracted from the website
                    count: 0,        // The number of times marked/comments count etc. extracted from the website
                    province: '',
                    city: '',
                    carrier: '',
                    name: '',
                    predefinedLabel: '', // The result after mapping to the app's fixed labels
                    source: PLUGIN_ID,
                    numbers: [],
                    success: false,
                    error: '',
                    action: 'none' // Action determined based on keywords ('block', 'allow', 'none')
                };

                try {
                    // --- Write your parsing code here ---
                    // **MODIFY:** Use doc.querySelector or doc.querySelectorAll to find page elements
                    // **MODIFY:** Extract the sourceLabel and count that you need
                    // **MODIFY:** Extract other information as needed (province, city, carrier, name, numbers)
                    // **MODIFY:** Ensure you can extract at least one of sourceLabel or count for subsequent success determination

                    // Example (pseudo-code):
                    // const labelElement = doc.querySelector('.some-css-selector');
                    // if (labelElement) {
                    //     result.sourceLabel = labelElement.textContent.trim();
                    // }
                    // const countElement = doc.querySelector('.another-css-selector');
                    // if (countElement) {
                    //     result.count = parseInt(countElement.textContent.trim(), 10) || 0;
                    // }

                    // **AI ASSISTANCE TIP:** If you are unsure how to write parsing code, you can provide the HTML source code of the target webpage (especially the part containing the data you need) to an AI, along with the data fields you wish to extract (e.g., result.sourceLabel, result.count, result.predefinedLabel, result.action). Explicitly tell the AI where these fields correspond in the HTML source.
                    // For example, you can tell the AI:
                    // "Please help me extract the content for 'sourceLabel' from the following HTML source. It's usually within a <span class='label-text'> tag.
                    // Also, I need to extract 'count', which is typically in a <div class='call-count'> tag and is a number.
                    // Then assign this information to `result.sourceLabel` and `result.count`.
                    // Note that `predefinedLabel` and `action` values will be automatically determined by `manualMapping` and `blockKeywords`/`allowKeywords`; your main task is to extract `sourceLabel` and `count` from the HTML."
                    // The AI can then generate parsing code for you based on your description and the HTML source.

                    // --- Map sourceLabel to predefinedLabel ---
                    // This logic is usually pre-written in the template and uses manualMapping
                    // You just need to ensure manualMapping is set up correctly.

                    // --- Determine success ---
                    // **MODIFY:** Set result.success based on whether sourceLabel or count was successfully extracted
                    if (result.sourceLabel || result.count > 0) {
                         result.success = true;
                    }

                    // --- Determine Action ---
                    // This logic is usually pre-written in the template and uses blockKeywords and allowKeywords
                    // You just need to ensure these keyword lists are set up correctly.


                    // Return the result object
                    return result;

                } catch (e) {
                    console.error('[Iframe-Parser] Error during parsing:', e);
                    result.error = e.toString();
                    result.success = false; // Parsing errors also count as failure
                    return result;
                }
            }

            // ... other internal functions ...

            // Call the parsing function and send the result
            const finalResult = parseContent(window.document);
            sendResult(finalResult || { phoneNumber: PHONE_NUMBER, success: false, error: 'Parsing logic returned null or failed.', action: 'none' });

        })();
    `;
}
```
*   This is the core logic of the plugin, responsible for extracting the necessary information from the loaded target webpage content.
*   **MODIFY:** You need to write the code here based on the HTML structure of the phone number lookup website you choose. Use `doc.querySelector` or `doc.querySelectorAll` to select elements on the page, and extract text content, attributes, or other information from the selected elements.
*   **MODIFY:** You need to extract at least one of `sourceLabel` (the label/keyword displayed on the website) or `count` (the number of times marked, comments count, etc., displayed on the website).
*   If possible, also try to extract information like `province`, `city`, `carrier`, `name`, `numbers`.
*   **MODIFY:** Ensure the final `result` object you construct includes at least the fields: `phoneNumber`, `sourceLabel`, `count`, `predefinedLabel`, `success`, `error`, `action`, and correctly assign the extracted information to these fields.

## 7. generateOutput Function - **MODIFIABLE (Regarding which number to query)**

```javascript
function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
    log(`generateOutput called for requestId: ${requestId}`);
    // Although the function receives three number formats (phoneNumber, nationalNumber, e164Number),
    // to improve query efficiency and better adapt to specific website query interfaces, it is generally recommended
    // to choose only one number format that is most suitable for the target website. This avoids unnecessary attempts
    // with multiple formats, thereby speeding up the query.
    // **MODIFY:** Based on the phone number format actually supported by the target website, choose one of the following three lines and uncomment it, commenting out the other two.
    // const numberToQuery = phoneNumber || nationalNumber || e164Number; // Original code, attempts to use any valid number (may be slower)
    const numberToQuery = phoneNumber; // **MODIFY:** Example: Use only phoneNumber for the query (often the recommended approach)
    // const numberToQuery = nationalNumber; // Example: Use only nationalNumber for the query
    // const numberToQuery = e164Number; // Example: Use only e164Number for the query

    if (!numberToQuery) {
        sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
        return;
    }

    // ... Subsequent code that calls initiateQuery function remains unchanged ...
}
```
*   `generateOutput` is the entry point of the plugin, receiving phone numbers in different formats.
*   **MODIFY:** Considering that many websites only support specific number formats, and querying with a single format is more efficient than attempting multiple formats, it is recommended that you choose only one among `phoneNumber`, `nationalNumber`, or `e164Number` based on the format actually supported by your chosen target website. Please modify the code to keep only the number variable you wish to use.

## Development Steps Summary:

1.  **Choose Your Target Website:** Find a website that provides phone number lookup functionality.
2.  **Analyze Website Structure:** Use browser developer tools to inspect the website's HTML structure. Identify the elements containing phone number labels, marking counts, etc., and their CSS selectors.
3.  **Copy a Template:** Choose a suitable template (e.g., `bd action.js` or `slickly EN.js`) as a starting point.
4.  **Modify PLUGIN_CONFIG:** Update the plugin's ID, name, version, and description.
5.  **Modify manualMapping:** Create mappings from the website's labels to `predefinedLabels` based on your website analysis. **Ensure you adjust these mappings according to the language and linguistic habits used on the target website.**
6.  **Modify Keyword Lists (if applicable):** Adjust `slicklyKeywords` or similar keyword lists as needed. **Ensure you adjust these keywords according to the language and linguistic habits used on the target website.**
7.  **Modify blockKeywords and allowKeywords:** Carefully choose keywords to define the blocking or allowing logic. **Ensure you adjust these keywords according to the language and linguistic habits used on the target website.**
8.  **Modify targetSearchUrl and Headers:** Construct the correct search URL and add necessary Headers.
9.  **Modify the Parsing Logic within `getParsingScript` function:** This is the most critical step. Based on your analysis of the website's HTML structure, write JavaScript code to accurately extract `sourceLabel` and `count` and any other desired information. **When needed, you can provide the HTML source code and corresponding field information to an AI for assistance.**
10. **Modify generateOutput Function:** Select the phone number format you wish to use for the query, commenting out the other unused number variables.
11. **Test:** Load and test your plugin within the application to ensure it correctly queries, parses, and returns results.

By following these instructions and steps, you can create a custom phone number query plugin that meets your specific needs.