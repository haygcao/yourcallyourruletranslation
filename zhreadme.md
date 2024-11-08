# Your Call Your Rule: 可定制的来电和短信拦截应用

**YourCallYourRule** 是一款功能强大且灵活的 Android 应用程序，旨在让您完全掌控来电和短信。它允许您根据电话号码、关键词等创建个性化的拦截规则。

* **Test Link：** https://play.google.com/apps/testing/com.yours.yourcallyourrule
* **Telegram Channel：** https://t.me/yourcallyourrule
* **Telegram Group：** https://t.me/+GHoPy6xwQEU1ZThh
* **Plugins & Database:** If anyone can take the advantage the link to develop and plugins and csv database. It will be great, I really appreciate you can share it with others. and You can mark the numbers on your sides and share it to Telegram group and anyehre you like  or github.

## 功能

* **白名单和黑名单：** 创建允许和阻止号码的自定义列表。
* **导入/导出规则：** 轻松共享和备份您的规则集。
* **在线订阅：** 订阅精选的垃圾号码列表（需要订阅链接）。
* **正则表达式支持：** 使用正则表达式定义复杂的拦截规则。
* **STIR/SHAKEN 集成：** 利用 STIR/SHAKEN 技术增强来电显示验证（在部分地区受支持，包括北美）。
* **SIM 卡识别：** 根据使用的 SIM 卡识别来电。
* **来电拦截操作：** 为被拦截的来电选择各种操作，包括挂断、静音和接听后挂断。
* **基于持续时间的过滤：** 允许在特定时间范围内重复呼叫绕过拦截。
* **短信拦截：** 根据发件人号码或关键词拦截 短信。
  * 需要将您的原生短信应用程序的通知静音，以防止重复响铃。
  * 被拦截的短信仍然会送达，但不会触发响铃。
* **数据控制：** 没有内置的在线数据库。所有数据都在您的设备上本地管理，确保您的隐私。
* **备份和恢复：** 支持 WebDAV、Google Drive 和 OneDrive，以实现无缝的数据备份和恢复。 
* **内置通讯录：**  软件内置通讯录， 你可以将任何联系人存储到app 的通讯录，从而和本地的通讯录分离，支持直接通过联系人号码打开Whatsapp 和 Telegram。

## 扩展功能

YourCallYourRule 通过自定义插件进行扩展。您可以利用这些插件来：

* **订阅在线数据库：** 开发插件以从公共或私有在线数据库获取和导入拦截规则。 [中国用户可以使用的订阅链接数据](https://github.com/haygcao/vccard)
* **网页抓取：** 创建插件以从网站抓取电话号码并自动将其添加到您的拦截列表（需要 JavaScript 知识）模板：https://github.com/haygcao/yourcallyourruletranslation/tree/main/plugintest 已经配置了整套的测试工具。

## 云服务集成
我很乐意将任何网盘服务集成到应用中，只要有相应的 Flutter 包和测试账号可用。这将为备份和恢复数据提供更大的灵活性。

## 数据模板
此仓库包含用于各种用途的数据模板([https://github.com/haygcao/yourcallyourruletranslation/tree/main/Templates]) ,标有 “required” 的字段为必填项，其他字段为可选项。

## 贡献

我们鼓励用户通过以下方式为项目做出贡献：

* **提交 Pull 请求：** 分享您的自定义插件或对应用程序的改进。
* **评论问题：** 报告错误、建议新功能或分享 publicly 可用拦截列表的链接。
* **分享黑名单：** 贡献您精选的垃圾号码列表来帮助他人。

## 通知自定义

应用使用 flutter_local_notifications 包来实现本地通知功能，但目前仅进行了基础配置。如果您有任何关于增强通知功能的创意，欢迎通过修改 `notification.dart` 文件来贡献您的想法: [https://github.com/haygcao/yourcallyourruletranslation/blob/main/notification.dart](https://github.com/haygcao/yourcallyourruletranslation/blob/main/notification.dart)


## 示例

以下是一些用于创建自定义订阅插件的示例GitHub Workflow工作流 和部分网站:

* **中国 vCards CN 数据：** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20%E4%B8%AD%E5%9B%BD/%E9%80%9A%E8%AE%AF%E5%BD%95.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20%E4%B8%AD%E5%9B%BD/%E9%80%9A%E8%AE%AF%E5%BD%95.yml)) 所有数据归功于[vCards 中国黄页 - 优化 iOS/Android 来电、信息界面体验](https://github.com/metowolf/vCards)  
  
* **美国 FCC 数据库：** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml)
* **美国 FCC Robocall 数据库：** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml)
* **法国正则表达式：** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml)

* **Workflow 验证：**  基于某些原因app 本身不能提供已经处理的数据，但不影响你自身定制数据，所以请验证上面的workflow后再使用，如果workfow 有 任何不对的地方欢迎修改。
  
* **西班牙：** 您可以使用 [www.listaspam.com](https://www.listaspam.com/) 和 [www.responderono.es](https://www.responderono.es/) 等网站作为创建您自己的插件的来源。
* **中国：** 利用 [www.baidu.com](https://www.baidu.com) 或 [www.so.com](https://www.so.com) 等搜索引擎开发针对中文垃圾号码的自定义插件。
* **香港/台湾/澳门:** https://www.junk-call.com/
* **俄罗斯：** 利用 https://8sot.su/ and https://voprosoff.net/kto-zvonil/



## 关于开源的说明

YourCallYourRule 的核心应用程序不是开源的。但是，特定功能是开源的，以方便开发和反馈。

## 免责声明

* 此应用程序由非专业开发人员开发，更新可能不规律。
* 翻译不完整，可能需要进一步完善。
* 该应用程序不包含内置数据库，并且依赖于用户提供的 URL 或自定义插件作为数据源。
* 虽然该应用程序支持网页抓取，但实际的实现需要 JavaScript 知识。
* 基于 AI 的翻译可能不准确或不完整。请参阅英文版本以获取最准确的信息。


我们希望您发现 YourCallYourRule 是一个宝贵的工具，可以帮助您重新掌控您的电话和短信！
