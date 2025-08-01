# 自定义电话号码查询插件说明 (中文)

本说明旨在帮助用户理解如何根据现有模板创建和修改自定义电话号码查询插件。插件使用 iframe 代理方式工作，以规避跨域问题，并通过解析特定网站的 HTML 内容来获取电话号码信息。

**重要提示:** `predefinedLabels` 列表是固定的，不可更改。这些标签代表了应用中预定义的电话号码类别。

您可以根据需要修改以下标记的部分：

## 1. 插件配置 (`PLUGIN_CONFIG`) - **可修改**

```javascript
const PLUGIN_CONFIG = {
    id: 'yourPluginId', // **修改：** 为您的插件设置一个唯一的 ID (例如: 'myCustomPlugin')
    name: '您的插件名称', // **修改：** 插件的友好名称 (例如: '我的自定义电话查询')
    version: '1.0.0', // **修改：** 插件版本号
    description: '插件的简要描述' // **修改：** 描述插件的功能
};
```
*   `id`: 必须是全局唯一的，用于在应用中区分不同的插件。
*   `name`: 会显示在应用界面中。
*   `version` 和 `description`: 用于描述和跟踪插件。

## 2. 手动映射 (`manualMapping`) - **可修改**

```javascript
const manualMapping = {
    '网站上的标签A': 'Fraud Scam Likely', // **修改：** 示例: 将网站上的 "欺诈" 映射到应用的 "Fraud Scam Likely"
    '网站上的标签B': 'Spam Likely',      // **修改：** 示例: 将网站上的 "广告" 映射到应用的 "Spam Likely"
    // **修改：** 添加更多映射...
};
```
*   `manualMapping` 是一个对象，将您在目标网站上找到的特定标签或关键词映射到固定的 `predefinedLabels` 中的一个。
*   键 (`'网站上的标签A'`) 是从目标网站解析到的原始文本。请确保这里的文本与网站上显示的标签**完全匹配**。
*   值 (`'Fraud Scam Likely'`) 必须是 `predefinedLabels` 列表中的一个有效标签。
*   **修改：** 您需要根据目标网站的实际内容和您希望的分类结果来调整这里的映射。**请务必根据目标网站使用的语言和语言习惯来选择和调整映射关系（例如，中文网站使用中文标签，英文网站使用英文标签）。**

## 3. 关键词列表 (例如 `slicklyKeywords`) - **可修改 (如果模板中有此部分)**

```javascript
const slicklyKeywords = [
    '关键词A', // **修改：** 示例: '诈骗'
    '关键词B', // **修改：** 示例: '推销'
    // **修改：** 添加更多关键词...
];
```
*   这个列表（如果存在于您使用的模板中）用于辅助解析逻辑在网站内容中查找特定的关键词。这有助于更精确地识别电话号码的类型，例如在评论中查找关键词。
*   **修改：** 请根据目标网站的内容和您希望识别的关键词列表进行调整。**请务必根据目标网站使用的语言和语言习惯来选择和调整关键词。**

## 4. 阻止和允许关键词 (`blockKeywords` 和 `allowKeywords`) - **可修改**

```javascript
const blockKeywords = [
    '阻止关键词A', // **修改：** 示例: '诈骗', '骚扰'
    '阻止关键词B',
    // **修改：** 添加更多阻止关键词...
];

const allowKeywords = [
    '允许关键词A', // **修改：** 示例: '快递', '客服'
    '允许关键词B',
    // **修改：** 添加更多允许关键词...
];
```
*   这些列表用于根据解析到的 `sourceLabel` 自动判断是应该阻止 (`'block'`) 还是允许 (`'allow'`) 该电话号码。
*   当 `sourceLabel` 中包含 `blockKeywords` 中的任何一个关键词时，插件会建议阻止该号码。
*   当 `sourceLabel` 中包含 `allowKeywords` 中的任何一个关键词时，并且该号码未被阻止关键词匹配，插件会建议允许该号码。
*   **修改：** **请务必谨慎选择这些关键词，它们直接影响应用的拦截或放行行为。** **请根据目标网站使用的语言和语言习惯来选择和调整关键词。**

## 5. 目标搜索 URL (`targetSearchUrl`) 和 Headers (`headers`) - **可修改**

```javascript
function initiateQuery(phoneNumber, requestId, countryCode) { // countryCode 参数可能存在，也可能不存在，取决于模板
    // ... 其他代码 ...
    // **修改：** 根据目标网站调整 URL 结构
    const targetSearchUrl = `https://www.example.com/search?q=${encodeURIComponent(phoneNumber)}`;
    const headers = {
        'User-Agent': '您的用户代理字符串', // **修改：** 建议使用常见的浏览器 User-Agent
        // **修改：** 添加其他需要的 Headers，例如 Cookies 或 Referer
    };
    const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
    // ... 其他代码 ...
}
```
*   `targetSearchUrl`: 这是插件实际去请求的外部网站 URL。您需要根据您选择的电话号码查询网站的搜索功能来构建这个 URL。确保电话号码参数正确地编码到 URL 中。
*   `headers`: 这是一个对象，包含发送请求时需要包含的 HTTP 头。常见的包括 `User-Agent`。有些网站可能需要特定的 Headers 才能正常访问或返回正确的内容，您可能需要通过浏览器开发者工具分析目标网站的请求来确定所需的 Headers。

## 6. HTML 解析逻辑 (`function getParsingScript(...)`) - **核心修改部分**

```javascript
function getParsingScript(pluginId, phoneNumberToQuery) {
    return `
        (function() {
            // ... 内部变量和函数 ...

            function parseContent(doc) {
                // **修改：** 这是最核心的部分，您需要在这里编写代码来解析加载的 HTML 内容 (doc)
                const result = {
                    phoneNumber: PHONE_NUMBER,
                    sourceLabel: '', // 从网站提取的原始标签/关键词
                    count: 0,        // 从网站提取的标记次数/评论数等
                    province: '',
                    city: '',
                    carrier: '',
                    name: '',
                    predefinedLabel: '', // 映射到应用固定标签后的结果
                    source: PLUGIN_ID,
                    numbers: [],
                    success: false,
                    error: '',
                    action: 'none' // 根据关键词判断出的动作 ('block', 'allow', 'none')
                };

                try {
                    // --- 编写您的解析代码 ---
                    // **修改：** 使用 doc.querySelector 或 doc.querySelectorAll 来查找页面元素
                    // **修改：** 提取您需要的 sourceLabel 和 count
                    // **修改：** 根据需要提取其他信息 (province, city, carrier, name, numbers)
                    // **修改：** 确保至少能提取到 sourceLabel 或 count 中的一个，以便后续判断 success

                    // 示例 (伪代码):
                    // const labelElement = doc.querySelector('.some-css-selector');
                    // if (labelElement) {
                    //     result.sourceLabel = labelElement.textContent.trim();
                    // }
                    // const countElement = doc.querySelector('.another-css-selector');
                    // if (countElement) {
                    //     result.count = parseInt(countElement.textContent.trim(), 10) || 0;
                    // }

                    // **AI 辅助提示：** 如果不确定如何编写解析代码，您可以将目标网页的 HTML 源码（特别是包含您需要的数据的那部分）以及您希望提取的数据字段 (result.sourceLabel, result.count, result.predefinedLabel, result.action 等) 和这些字段在 HTML 源码中的对应位置提供给 AI。
                    // 例如，您可以这样告诉 AI：
                    // “请帮我从以下 HTML 源码中提取 'sourceLabel' 对应的内容，它通常在 <span class='label-text'> 标签里。
                    // 还需要提取 'count'，它通常在 <div class='call-count'> 标签中，并且是一个数字。
                    // 然后将这些信息赋值给 `result.sourceLabel` 和 `result.count`。
                    // 请注意，`predefinedLabel` 和 `action` 的值会根据 `manualMapping` 以及 `blockKeywords` 和 `allowKeywords` 自动判断，您主要负责提取 `sourceLabel` 和 `count`。”
                    // AI 会根据您的描述和 HTML 源码为您生成解析代码。

                    // --- 映射 sourceLabel 到 predefinedLabel ---
                    // 这部分逻辑通常在模板中已经写好，它会使用 manualMapping
                    // 您只需要确保 manualMapping 设置正确即可。

                    // --- 判断 success ---
                    // **修改：** 根据是否成功提取到 sourceLabel 或 count 来设置 result.success
                    if (result.sourceLabel || result.count > 0) {
                         result.success = true;
                    }

                    // --- 判断 Action ---
                    // 这部分逻辑通常在模板中已经写好，它会使用 blockKeywords 和 allowKeywords
                    // 您只需要确保这些关键词列表设置正确即可。


                    // 返回结果对象
                    return result;

                } catch (e) {
                    console.error('[Iframe-Parser] Error during parsing:', e);
                    result.error = e.toString();
                    result.success = false; // 解析出错也算失败
                    return result;
                }
            }

            // ... 其他内部函数 ...

            // 调用解析函数并发送结果
            const finalResult = parseContent(window.document);
            sendResult(finalResult || { phoneNumber: PHONE_NUMBER, success: false, error: 'Parsing logic returned null or failed.', action: 'none' });

        })();
    `;
}
```
*   这是插件的核心逻辑，负责在加载完目标网页内容后，从中提取需要的信息。
*   **修改：** 您需要根据您选择的电话号码查询网站的 HTML 结构来编写这里的代码。使用 `doc.querySelector` 或 `doc.querySelectorAll` 来选择页面上的元素，并从中提取文本内容、属性或其他信息。
*   **修改：** 您需要至少提取到 `sourceLabel` (网站上显示的标签/关键词) 或 `count` (网站上显示的标记次数、评论数等) 中的一个。
*   如果可能，也请尝试提取 `province`, `city`, `carrier`, `name`, `numbers` 等信息。
*   **修改：** 确保最终构建的 `result` 对象至少包含 `phoneNumber`, `sourceLabel`, `count`, `predefinedLabel`, `success`, `error`, `action` 这些字段，并将提取到的信息正确赋值给这些字段。

## 7. generateOutput 函数 - **可修改 (关于使用哪个号码查询)**

```javascript
function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
    log(`generateOutput called for requestId: ${requestId}`);
    // 虽然函数接收三种号码格式 (phoneNumber, nationalNumber, e164Number)，
    // 但为了提高查询效率和更好地适配特定网站的查询接口，通常建议只选择其中一种最适合目标网站的号码格式进行查询。
    // 这可以避免不必要的多种格式尝试，从而加快查询速度。
    // **修改：** 根据目标网站实际支持的号码格式，选择以下三行中的一行并取消注释，注释掉其他两行。
    // const numberToQuery = phoneNumber || nationalNumber || e164Number; // 原始代码，尝试使用任一有效号码 (可能较慢)
    const numberToQuery = phoneNumber; // **修改：** 示例：只使用 phoneNumber 进行查询 (通常是推荐的做法)
    // const numberToQuery = nationalNumber; // 示例：只使用 nationalNumber 进行查询
    // const numberToQuery = e164Number; // 示例：只使用 e164Number 进行查询

    if (!numberToQuery) {
        sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
        return;
    }

    // ... 后续调用 initiateQuery 函数的代码保持不变 ...
}
```
*   `generateOutput` 函数是插件的入口点，接收不同格式的电话号码。
*   **修改：** 考虑到许多网站只支持特定格式的号码查询，并且只查询一个号码会比尝试查询多个号码更高效，因此建议您根据您选择的目标网站实际支持的格式，只选择 `phoneNumber`、`nationalNumber` 或 `e164Number` 中的一个进行查询。请修改代码，只保留您希望使用的那个号码变量。

## 开发步骤总结:

1.  **选择目标网站:** 找到一个提供电话号码查询功能的网站。
2.  **分析网站结构:** 使用浏览器开发者工具检查该网站的 HTML 结构，找到包含电话号码标签、标记次数等信息的元素及其 CSS 选择器。
3.  **复制模板:** 选择一个合适的模板 (例如 `bd action.js` 或 `slickly EN.js`) 作为起点。
4.  **修改 PLUGIN_CONFIG:** 更新插件的 ID、名称、版本和描述。
5.  **修改 manualMapping:** 根据您分析的网站标签，创建从网站标签到 `predefinedLabels` 的映射。**请根据目标网站使用的语言和语言习惯调整映射关系。**
6.  **修改关键词列表 (如果适用):** 根据需要调整 `slicklyKeywords` 或类似的关键词列表。**请根据目标网站使用的语言和语言习惯调整关键词。**
7.  **修改 blockKeywords 和 allowKeywords:** 谨慎选择关键词，以确定阻止或允许的逻辑。**请根据目标网站使用的语言和语言习惯调整关键词。**
8.  **修改 targetSearchUrl 和 Headers:** 构建正确的搜索 URL，并添加必要的 Headers。
9.  **修改 getParsingScript 函数内部的解析逻辑:** 这是最关键的步骤。根据您对网站 HTML 结构的分析，编写 JavaScript 代码来准确地提取 `sourceLabel` 和 `count` 以及其他所需信息。**在需要时，可以将 HTML 源码和对应的字段信息提供给 AI 寻求帮助。**
10. **修改 generateOutput 函数:** 选择您希望用于查询的电话号码格式，注释掉其他不使用的号码变量。
11. **测试:** 在应用中加载和测试您的插件，确保它能正确地查询、解析并返回结果。

通过遵循上述说明和步骤，您可以创建符合您特定需求的自定义电话号码查询插件。