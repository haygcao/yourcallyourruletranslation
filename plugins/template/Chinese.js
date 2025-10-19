// [插件名称] - Iframe 代理解决方案通用模板 V5.5 (最终、绝对完整版)
// =======================================================================================
// 模板说明:
// 这是一个用于创建电话号码查询插件的标准化模板。它基于一个通用的架构，通过在Flutter WebView中
// 创建一个隐藏的iframe，并利用Flutter端的原生网络代理能力，来绕过目标网站的安全限制（如CORS策略）。
//
// 开发者只需要根据目标网站的特性，修改少数几个标记清晰的区域即可。
//
// 工作流程:
// 1. Flutter 调用 `generateOutput` 函数。
// 2. `initiateQuery` 函数构建目标网站的URL，并通过一个特殊的内部代理URL将其设置为隐藏iframe的 `src`。
// 3. Flutter端的代理服务器拦截这个请求，抓取目标网站的真实HTML内容，然后将其返回给iframe。
// 4. iframe 加载完毕后 (`onload`)，主页面会通过 `postMessage` 注入一个解析脚本 (`getParsingScript`)。
// 5. iframe 内部的解析脚本执行，抓取页面上的所需信息 (`parseContent` 函数)。
// 6. 解析脚本通过 `window.parent.postMessage` 将结果发送回主页面。
// 7. 主页面的 `message` 事件监听器接收到结果，并通过 `sendToFlutter` 将最终数据返回给Flutter应用。
// =======================================================================================

(function () {
    // 使用 IIFE (立即调用函数表达式) 来封装插件逻辑，避免污染全局作用域。

    // --- 区域 1: 插件核心配置 (必须修改) ---
    // ---------------------------------------------------------------------------------------
    // 这是每个插件的唯一标识。请务必为你的插件提供独特的信息。
    // ---------------------------------------------------------------------------------------
    const PLUGIN_CONFIG = {
        id: 'yourUniquePluginId', // 插件的唯一ID，使用驼峰命名法 (例如: 'someWebsitePlugin')
        name: 'Your Plugin Name (iframe Proxy)', // 插件的可读名称 (例如: 'SomeWebsite Lookup (iframe Proxy)')
        version: '5.5.0', // 插件版本号，建议遵循语义化版本控制
        description: 'A brief description of what this plugin does.' // 插件功能描述
    };

    // --- 区域 2: 业务相关的数据映射与关键字 (按需修改) ---
    // ---------------------------------------------------------------------------------------
    // 这个区域定义了如何将从网站上抓取到的原始文本（sourceLabel）映射到我们应用内部
    // 的标准标签（predefinedLabel），以及如何根据这些标签决定推荐操作（action）。
    // ---------------------------------------------------------------------------------------

    /**
     * @constant {Array<Object>} predefinedLabels - 应用内部固定的、预定义的标签列表。
     * @description 这个列表是标准的，通常不需要修改。它定义了所有插件输出的标签的最终集合。
     */
    const predefinedLabels = [
        { 'label': 'Fraud Scam Likely' }, { 'label': 'Spam Likely' }, { 'label': 'Telemarketing' },
        { 'label': 'Robocall' }, { 'label': 'Delivery' }, { 'label': 'Takeaway' },
        { 'label': 'Ridesharing' }, { 'label': 'Insurance' }, { 'label': 'Loan' },
        { 'label': 'Customer Service' }, { 'label': 'Unknown' }, { 'label': 'Financial' },
        { 'label': 'Bank' }, { 'label': 'Education' }, { 'label': 'Medical' },
        { 'label': 'Charity' }, { 'label': 'Other' }, { 'label': 'Debt Collection' },
        { 'label': 'Survey' }, { 'label': 'Political' }, { 'label': 'Ecommerce' },
        { 'label': 'Risk' }, { 'label': 'Agent' }, { 'label': 'Recruiter' },
        { 'label': 'Headhunter' }, { 'label': 'Silent Call Voice Clone' }, { 'label': 'Internet' },
        { 'label': 'Travel Ticketing' }, { 'label': 'Application Software' }, { 'label': 'Entertainment' },
        { 'label': 'Government' }, { 'label': 'Local Services' }, { 'label': 'Automotive Industry' },
        { 'label': 'Car Rental' }, { 'label': 'Telecommunication' },
    ];

    /**
     * @constant {Object} manualMapping - 手动映射表。
     * @description Key是从目标网站上抓取到的原始文本，Value是`predefinedLabels`中定义的标准标签。
     *              这是插件本地化的核心。你需要根据目标网站的语言和常用标记来填充这个对象。
     * @example
     * const manualMapping = {
     *     '骚扰电话': 'Spam Likely',
     *     '快递': 'Delivery',
     *     'Dudoso': 'Spam Likely', // 西班牙语
     *     'Werbung': 'Telemarketing' // 德语
     * };
     */
    const manualMapping = {
        // 示例: '从网站抓取到的标签': '对应的标准标签'
        '房产中介': 'Agent',
        '快递物流': 'Delivery',
        '涉诈电话': 'Fraud Scam Likely',
        '广告推销': 'Telemarketing',
    };

    /**
     * @constant {Array<string>} blockKeywords - 用于决定推荐操作为 "block" 的关键字列表。
     * @description 如果解析出的 `sourceLabel` 或 `predefinedLabel` 包含此列表中的任何关键字，
     *              结果中的 `action` 字段将被设置为 'block'。
     */
    const blockKeywords = [
        '骚扰', '诈骗', '广告', '推销', '营销', '违规', '涉诈', 'Fraud', 'Spam', 'Telemarketing'
    ];

    /**
     * @constant {Array<string>} allowKeywords - 用于决定推荐操作为 "allow" 的关键字列表。
     * @description 如果解析出的 `sourceLabel` 或 `predefinedLabel` 包含此列表中的任何关键字，
     *              并且它不符合 block 的条件，`action` 字段将被设置为 'allow'。
     */
    const allowKeywords = [
        '快递', '外卖', '送餐', '客服', '银行', '验证码', 'Delivery', 'Support', 'Bank'
    ];


    // --- 区域 3: 通用框架部分 (无需修改) ---
    // ---------------------------------------------------------------------------------------
    // 这部分代码是插件框架的核心，负责与Flutter的通信、iframe的创建与销毁、日志记录等
    // 通用功能。除非你非常清楚你在做什么，否则不要修改这部分代码。
    // ---------------------------------------------------------------------------------------
    const PROXY_SCHEME = "https";
    const PROXY_HOST = "flutter-webview-proxy.internal";
    const PROXY_PATH_FETCH = "/fetch";
    const activeIFrames = new Map();

    function log(message) { console.log(`[${PLUGIN_CONFIG.id} v${PLUGIN_CONFIG.version}] ${message}`); }
    function logError(message, error) { console.error(`[${PLUGIN_CONFIG.id} v${PLUGIN_CONFIG.version}] ${message}`, error); }

    function sendToFlutter(channel, data) {
        if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
            window.flutter_inappwebview.callHandler(channel, JSON.stringify(data));
        } else {
            logError(`Cannot send to Flutter on channel '${channel}', handler not available.`);
        }
    }

    function sendPluginResult(result) {
        log(`Sending final result to Flutter: ${JSON.stringify(result)}`);
        sendToFlutter('PluginResultChannel', result);
    }

    function sendPluginLoaded() {
        log('Plugin loaded, notifying Flutter.');
        sendToFlutter('TestPageChannel', { type: 'pluginLoaded', pluginId: PLUGIN_CONFIG.id, version: PLUGIN_CONFIG.version });
    }

    function cleanupIframe(requestId) {
        const iframe = activeIFrames.get(requestId);
        if (iframe) {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
            activeIFrames.delete(requestId);
            log(`Cleaned up iframe for requestId: ${requestId}`);
        }
    }

    // --- 区域 4: 页面解析逻辑 (核心变化区域) ---
    /**
     * @function getParsingScript
     * @description 生成将被注入到iframe中执行的脚本字符串。
     *              这个脚本负责解析iframe加载的HTML内容，并将结果通过postMessage发送回来。
     * @param {string} pluginId - 当前插件的ID。
     * @param {string} phoneNumberToQuery - 正在查询的电话号码。
     * @returns {string} - 可执行的JavaScript脚本字符串。
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        // 使用模板字符串动态构建脚本，并将外部的配置（如manualMapping）序列化后传入。
        return `
            (function() {
                // --- iframe内部脚本的常量 ---
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)};
                const blockKeywords = ${JSON.stringify(blockKeywords)};
                const allowKeywords = ${JSON.stringify(allowKeywords)};
                let parsingCompleted = false;

                // --- iframe内部的通信函数 ---
                function sendResult(result) {
                    if (parsingCompleted) return;
                    parsingCompleted = true;
                    console.log('[Iframe-Parser] Sending result back to parent:', result);
                    // 使用 postMessage 将解析结果发送给父窗口（即插件的执行环境）
                    window.parent.postMessage({ type: 'phoneQueryResult', data: { pluginId: PLUGIN_ID, ...result } }, '*');
                }

                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                // ★  核心解析函数 - 这是开发者唯一需要专注修改的地方  ★
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                /**
                 * @function parseContent
                 * @description 解析文档对象模型（DOM），从中提取电话号码的相关信息。
                 * @param {Document} doc - iframe的document对象。
                 * @returns {Object|null} - 包含解析结果的对象，如果解析失败则返回null。
                 */
                function parseContent(doc) {
                    console.log('[Iframe-Parser] Attempting to parse content in document.');
                    // 初始化一个标准的结果对象
                    const result = {
                        phoneNumber: PHONE_NUMBER, sourceLabel: '', count: 0, province: '', city: '', carrier: '',
                        name: '', predefinedLabel: '', source: PLUGIN_ID, numbers: [], success: false, error: '', action: 'none'
                    };

                    try {
                        // 【解析策略示例 1: 查找特定的标记卡片】
                        // 尝试找到包含电话号码信息的最外层容器。
                        const mainContainer = doc.querySelector('.result-op.c-container, #content_left, .main-content');
                        if (mainContainer) {
                            // 在容器内查找包含标签的元素。
                            const labelEl = mainContainer.querySelector('.op_mobilephone_label, .tel-tag, .phone-label');
                            if (labelEl) {
                                // 清理并提取标签文本。
                                const labelText = labelEl.textContent.replace(/标记：|Tag:/, '').trim();
                                if (labelText) {
                                    result.sourceLabel = labelText;
                                    result.success = true;

                                    // 尝试查找并解析其他信息，如归属地、标记次数等。
                                    const locationEl = mainContainer.querySelector('.op_mobilephone_location');
                                    if (locationEl) {
                                        const locText = locationEl.textContent.replace(/归属地：/, '').trim();
                                        const [province, city, carrier] = locText.split(/\\s+/);
                                        result.province = province || '';
                                        result.city = city || '';
                                        result.carrier = carrier || '';
                                    }
                                    console.log('[Iframe-Parser] Strategy 1 (Tag Card) successful. Found label:', labelText);
                                }
                            }
                        }

                        // 【解析策略示例 2: 从评论区提取最新标签】
                        if (!result.success) {
                            const commentLabelCell = doc.querySelector('#comments .container-recent-comments td.callertype');
                            if (commentLabelCell) {
                                const labelText = commentLabelCell.textContent.trim();
                                if (labelText) {
                                    result.sourceLabel = labelText;
                                    result.success = true;
                                    console.log('[Iframe-Parser] Strategy 2 (Comments) successful. Found label:', labelText);
                                }
                            }
                        }

                        // 如果需要，可以在这里添加更多的解析策略...


                        // 【最终处理步骤】
                        if (result.success && result.sourceLabel) {
                            // 1. 将 sourceLabel 映射到 predefinedLabel
                            // 这里使用 find 是为了处理 sourceLabel 包含关键字的情况
                            const mappedKey = Object.keys(manualMapping).find(key => result.sourceLabel.includes(key));
                            result.predefinedLabel = mappedKey ? manualMapping[mappedKey] : 'Unknown';

                            // 2. 决定推荐操作 (action)
                            const labelToCheck = result.sourceLabel.toLowerCase();
                            let determinedAction = 'none';
                            for (const keyword of blockKeywords) {
                                if (labelToCheck.includes(keyword.toLowerCase())) {
                                    determinedAction = 'block';
                                    break;
                                }
                            }
                            if (determinedAction === 'none') {
                                for (const keyword of allowKeywords) {
                                    if (labelToCheck.includes(keyword.toLowerCase())) {
                                        determinedAction = 'allow';
                                        break;
                                    }
                                }
                            }
                            result.action = determinedAction;
                            console.log('[Iframe-Parser] Action determined as:', result.action);
                        }

                        if (result.success) {
                            return result;
                        }

                        console.log('[Iframe-Parser] All parsing strategies failed.');
                        return null; // 表示没有从页面上找到任何有效信息

                    } catch (e) {
                        console.error('[Iframe-Parser] An error occurred during parsing:', e);
                        result.error = e.toString();
                        return result; // 返回带有错误信息的结果对象
                    }
                }
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

                // --- iframe内部脚本的启动逻辑 ---
                function findAndParse() {
                    if (parsingCompleted) return;
                    console.log('[Iframe-Parser] Starting parse attempt...');
                    const finalResult = parseContent(window.document);
                    if (finalResult) {
                        sendResult(finalResult);
                    } else {
                        // 如果 parseContent 返回 null，说明解析失败
                        sendResult({ success: false, error: 'Could not parse any recognizable content from the page.' });
                    }
                }
                console.log('[Iframe-Parser] Parsing script has started execution for phone: ' + PHONE_NUMBER);
                // 延迟执行，以确保页面上的动态内容（如有）已加载完毕。
                setTimeout(findAndParse, 500);
            })();
        `;
    }

    // --- 区域 5: 查询启动与iframe创建 (按需微调) ---
    // ---------------------------------------------------------------------------------------
    // 这部分负责根据电话号码构建目标URL并发起查询。
    // 你通常只需要修改 `targetSearchUrl` 和可选的 `domPurgeRules`。
    // ---------------------------------------------------------------------------------------
    function initiateQuery(phoneNumber, requestId) {
        log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
        try {
            // ★★★ 1. 构建目标网站的URL (必须修改) ★★★
            // 这是你要查询的网站的URL。使用 encodeURIComponent 来确保电话号码被正确编码。
            const targetSearchUrl = `https://www.example.com/search?q=${encodeURIComponent(phoneNumber)}`;

            // --- 以下为通用代码，通常无需修改 ---
            const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' };
            const originalOrigin = new URL(targetSearchUrl).origin;

            // ★★★ 2. (可选) 定义净化规则 (按需修改) ★★★
            // 如果目标网站有干扰性的JS或元素（如反调试脚本、广告弹窗），可以在这里定义规则来移除它们。
            // 这个操作在Flutter端的代理服务器中执行。
            const domPurgeRules = [
                // { type: 'remove', selector: 'script[src*="anti-debug"]' }
            ];

            // --- 后续为模板代码，无需修改 ---
            const purgeRulesParam = domPurgeRules.length > 0 ? `&purgeRules=${encodeURIComponent(JSON.stringify(domPurgeRules))}` : '';
            const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?requestId=${encodeURIComponent(requestId)}&originalOrigin=${encodeURIComponent(originalOrigin)}&targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}${purgeRulesParam}`;

            log(`Iframe proxy URL: ${proxyUrl}`);

            const iframe = document.createElement('iframe');
            iframe.id = `query-iframe-${requestId}`;
            iframe.style.display = 'none'; // 隐藏iframe
            iframe.sandbox = 'allow-scripts allow-same-origin';
            activeIFrames.set(requestId, iframe);

            iframe.onload = function () {
                log(`Iframe loaded for requestId ${requestId}. Posting parsing script directly.`);
                try {
                    const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                    iframe.contentWindow.postMessage({ type: 'executeScript', script: parsingScript }, '*');
                    log(`Parsing script posted to iframe for requestId: ${requestId}`);
                } catch (e) {
                    logError(`Error posting script to iframe for requestId ${requestId}:`, e);
                    sendPluginResult({ requestId, success: false, error: `postMessage failed: ${e.message}` });
                    cleanupIframe(requestId);
                }
            };
            iframe.onerror = function () {
                logError(`Iframe error for requestId ${requestId}`);
                sendPluginResult({ requestId, success: false, error: 'Iframe loading failed.' });
                cleanupIframe(requestId);
            };

            document.body.appendChild(iframe);
            iframe.src = proxyUrl;

            // 设置查询超时，以防iframe加载失败或解析脚本卡死
            setTimeout(() => {
                if (activeIFrames.has(requestId)) {
                    logError(`Query timeout for requestId: ${requestId}`);
                    sendPluginResult({ requestId, success: false, error: 'Query timed out after 30 seconds' });
                    cleanupIframe(requestId);
                }
            }, 30000);

        } catch (error) {
            logError(`Error in initiateQuery for requestId ${requestId}:`, error);
            sendPluginResult({ requestId, success: false, error: `Query initiation failed: ${error.message}` });
        }
    }


    // --- 区域 6: 插件的公共接口 (无需修改) ---
    // ---------------------------------------------------------------------------------------
    // 这是Flutter调用此插件的入口点。
    // const numberToQuery = phoneNumber || nationalNumber || e164Number;// 里面依据情况保留任何一个参数，有些网站只支持某种格式，如果不是必要不用同时保留3个。
    // ---------------------------------------------------------------------------------------
    function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
        log(`generateOutput called for requestId: ${requestId}`);
        const numberToQuery = phoneNumber || nationalNumber || e164Number;
        if (numberToQuery) {
            initiateQuery(numberToQuery, requestId);
        } else {
            sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
        }
    }

    // --- 区域 7: 事件监听与初始化 (无需修改) ---
    // ---------------------------------------------------------------------------------------
    // 这部分代码负责监听从iframe返回的消息，并将插件注册到全局，以便Flutter调用。
    // ---------------------------------------------------------------------------------------
    window.addEventListener('message', function (event) {
        if (!event.data || event.data.type !== 'phoneQueryResult' || !event.data.data) {
            return;
        }
        if (event.data.data.pluginId !== PLUGIN_CONFIG.id) {
            return;
        }
        let requestId = null;
        for (const [id, iframe] of activeIFrames.entries()) {
            if (iframe.contentWindow === event.source) {
                requestId = id;
                break;
            }
        }
        if (requestId) {
            log(`Received result via postMessage for requestId: ${requestId}`);
            const result = { requestId, ...event.data.data };
            delete result.pluginId;
            sendPluginResult(result);
            cleanupIframe(requestId);
        } else {
            logError('Received postMessage from an untracked iframe.', event.data);
        }
    });

    function initialize() {
        if (window.plugin && window.plugin[PLUGIN_CONFIG.id]) {
            log('Plugin already initialized.');
            return;
        }
        if (!window.plugin) {
            window.plugin = {};
        }
        window.plugin[PLUGIN_CONFIG.id] = {
            info: PLUGIN_CONFIG,
            generateOutput: generateOutput
        };
        log(`Plugin registered: window.plugin.${PLUGIN_CONFIG.id}`);
        sendPluginLoaded();
    }

    initialize();

})();