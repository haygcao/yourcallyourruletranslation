# YourCallYourRule: 可定制的来电和短信拦截应用

**YourCallYourRule** 是一款功能强大且灵活的 Android 应用程序，旨在让您完全掌控来电和短信。它允许您根据电话号码、关键词等创建个性化的拦截规则。

## 功能

* **白名单和黑名单：** 创建允许和阻止号码的自定义列表。
* **导入/导出规则：** 轻松共享和备份您的规则集。
* **在线订阅：** 订阅精选的垃圾号码列表（需要订阅链接）。
* **正则表达式支持：** 使用正则表达式定义复杂的拦截规则。
* **STIR/SHAKEN 集成：** 利用 STIR/SHAKEN 技术增强来电显示验证（在部分地区受支持，包括北美）。
* **SIM 卡识别：** 根据使用的 SIM 卡识别来电。
* **来电拦截操作：** 为被拦截的来电选择各种操作，包括挂断、静音和接听后挂断。
* **基于持续时间的过滤：** 允许在特定时间范围内重复呼叫绕过拦截。
* **短信拦截：** 根据发件人号码或关键词拦截 unwanted 短信。
  * 需要将您的原生短信应用程序的通知静音，以防止 unwanted 警报。
  * 被拦截的短信仍然会送达，但不会触发通知。
* **数据控制：** 没有内置的在线数据库。所有数据都在您的设备上本地管理，确保您的隐私。
* **备份和恢复：** 支持 WebDAV、Google Drive 和 OneDrive，以实现无缝的数据备份和恢复。

## 扩展功能

YourCallYourRule 通过自定义插件进行扩展。您可以利用这些插件来：

* **订阅在线数据库：** 开发插件以从公共或私有在线数据库获取和导入拦截规则。
* **网页抓取：** 创建插件以从网站抓取电话号码并自动将其添加到您的拦截列表（需要 JavaScript 知识）模板：https://github.com/haygcao/yourcallyourruletranslation/tree/main/plugintest。

## 贡献

我们鼓励用户通过以下方式为项目做出贡献：

* **提交 Pull 请求：** 分享您的自定义插件或对应用程序的改进。
* **评论问题：** 报告错误、建议新功能或分享 publicly 可用拦截列表的链接。
* **分享黑名单：** 贡献您精选的垃圾号码列表来帮助他人。

## 示例

以下是一些用于创建自定义订阅插件的示例工作流程：

* **美国 FCC 数据库：** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml)
* **美国 FCC Robocall 数据库：** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml)
* **法国正则表达式：** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml)
* **西班牙：** 您可以使用 [www.listaspam.com](https://www.listaspam.com/) 和 [www.responderono.es](https://www.responderono.es/) 等网站作为创建您自己的插件的来源。
* **中国：** 利用 [www.baidu.com](https://www.baidu.com) 或 [www.so.com](https://www.so.com) 等搜索引擎开发针对中文垃圾号码的自定义插件。

## 关于开源的说明

YourCallYourRule 的核心应用程序不是开源的。但是，特定功能是开源的，以方便社区贡献和反馈。

## 免责声明

* 此应用程序由非专业开发人员开发，更新可能不规律。
* 翻译不完整，可能需要进一步完善。
* 该应用程序不包含内置数据库，并且依赖于用户提供的 URL 或自定义插件作为数据源。
* 虽然该应用程序支持网页抓取，但实际的实现需要 JavaScript 知识。
* 基于 AI 的翻译可能不准确或不完整。请参阅英文版本以获取最准确的信息。


我们希望您发现 YourCallYourRule 是一个宝贵的工具，可以帮助您重新掌控您的电话和短信！


# YourCallYourRule: A Customizable Call & SMS Blocking App

**YourCallYourRule** is a powerful and flexible Android application designed to give you complete control over incoming calls and SMS messages. It empowers you to create personalized blocking rules based on phone numbers, keywords, and more.

## Features

* **Whitelisting & Blacklisting:** Create custom lists of allowed and blocked numbers.
* **Import/Export Rules:** Easily share and backup your rule sets.
* **Online Subscription:** Subscribe to curated lists of spam numbers (requires subscription url).
* **Regular Expression Support:** Define complex blocking rules using regular expressions.
* **STIR/SHAKEN Integration:** Leverage STIR/SHAKEN technology for enhanced caller ID verification (supported in select regions, including North America).
* **SIM Card Recognition:** Identify incoming calls based on the SIM card used.
* **Call Blocking Actions:** Choose from various actions for blocked calls, including hang up, mute, and hang up after answer.
* **Duration-Based Filtering:** Allow repeated calls within a specific time frame to bypass blocking.
* **SMS Blocking:** Block unwanted SMS messages based on sender number or keywords.
  * Requires muting your native SMS app's notifications to prevent unwanted alerts.
  * Blocked SMS messages will still be delivered but will not trigger notifications.
* **Data Control:** No built-in online database. All data is managed locally on your device, ensuring your privacy.
* **Backup & Restore:** Support for WebDAV, Google Drive, and OneDrive for seamless data backup and restoration.

## Extending Functionality

YourCallYourRule is designed to be extensible through custom plugins. You can leverage these plugins to:

* **Subscribe to Online Databases:** Develop plugins to fetch and import blocking rules from public or private online databases.
* **Web Scraping:** Create plugins to scrape phone numbers from websites and automatically add them to your blocking lists (requires JavaScript knowledge). Template: https://github.com/haygcao/yourcallyourruletranslation/tree/main/plugintest

## Contributing

We encourage users to contribute to the project by:

* **Submitting Pull Requests:** Share your custom plugins or improvements to the app.
* **Commenting on Issues:** Report bugs, suggest new features, or share links to publicly available blocking lists.
* **Sharing Blacklists:** Contribute your curated lists of spam numbers to help others.

## Examples

For inspiration, check out these example workflows for creating custom subscription plugins:

* **US FCC Database:** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml)
* **US FCC Robocall Database:** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml)
* **France Regex:** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml)
* **Spain:** You can use websites like [www.listaspam.com](https://www.listaspam.com/) and [www.responderono.es](https://www.responderono.es/) as sources for creating your own plugins.
* **China:** Utilize search engines like [www.baidu.com](https://www.baidu.com) or [www.so.com](https://www.so.com) to develop custom plugins for Chinese spam numbers.

## Note on Open Source

The core application of YourCallYourRule is not open source. However, specific functionalities are open-sourced to facilitate community contributions and feedback.

## Disclaimer

* This app is developed by a non-professional developer and updates may be irregular.
* The translations are not comprehensive and may require further refinement.
* The app does not include a built-in database and relies on user-provided URLs or custom plugins for data sources.
* While the app supports web scraping, practical implementation requires JavaScript knowledge.
* AI-based translations may be inaccurate or incomplete. Please refer to the English version for the most accurate information.


We hope you find YourCallYourRule to be a valuable tool for reclaiming control over your phone and messages!
