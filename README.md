[中文版本](https://github.com/haygcao/yourcallyourruletranslation/blob/main/zhreadme.md)
 [Closed Test](https://groups.google.com/g/yourcallyourrule)
# YourCallYourRule: A Customizable Call & SMS Blocking App

**YourCallYourRule** is a powerful and flexible Android application designed to give you complete control over incoming calls and SMS messages. It empowers you to create personalized blocking rules based on phone numbers, keywords, and more.

* **Link：** https://play.google.com/apps/testing/com.yours.yourcallyourrule
* **Telegram Channel：** https://t.me/yourcallyourrule
* **Telegram Group：** https://t.me/+GHoPy6xwQEU1ZThh
* **Plugins & Database:** If anyone can take the advantage the link to develop and plugins and csv database. It will be great, I really appreciate you can share it with others.  

## Plugins

| URL                                                      | Country       |
| :------------------------------------------------------- | :------------ |
| [[shouldianswer](https://github.com/haygcao/yourcallyourruletranslation/raw/refs/heads/main/plugins/shouldianswer.js)] | United States |
| [odebractelefon.js](https://raw.githubusercontent.com/haygcao/yourcallyourruletranslation/refs/heads/main/plugins/odebractelefon.js) | Poland|
| [CN](https://github.com/haygcao/yourcallyourruletranslation/raw/refs/heads/main/plugins/soo.js) [CN2](https://raw.githubusercontent.com/haygcao/yourcallyourruletranslation/refs/heads/main/plugins/bd.js) 注意这两个label的获得可能不全需要自行补充| China       |
| [meiwakucheck](https://raw.githubusercontent.com/haygcao/yourcallyourruletranslation/refs/heads/main/plugins/meiwakucheck.js) | Japan        |
| [https://www.example.com.au/plugin5](https://www.example.com.au/plugin5)| Australia     |

 ## Plugin Ports
## Creating Website Plugins
To create a plugin from any website, use the [Plugin Test framework](https://github.com/haygcao/yourcallyourruletranslation/tree/main/plugintest). Open the target website in Chrome, With Chrome's Developer Tools (`Ctrl`+`Shift`+`I`), select the relevant website elements. Provide these elements and the [JavaScript template](https://github.com/haygcao/yourcallyourruletranslation/blob/main/plugintest/lib/english.js) to an AI. Instruct the AI to modify `manualMapping` and the `extractDataFromDOM(doc, phoneNumber)` function within the template to extract the desired data.

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
  * Requires muting your native SMS app's notifications to prevent unwanted ringtone alerts.
  * Blocked SMS messages will still be delivered but will not trigger ringtone notifications.
* **Data Control:** No built-in online database. All data is managed locally on your device, ensuring your privacy.
* **Backup & Restore:** Support for WebDAV, Google Drive, and OneDrive for seamless data backup and restoration.  （By watching ads, unlock random VIP privileges）
* **Built-in Contacts:** The app features a built-in contact list, allowing you to store contacts separately from your device's native contacts. You can directly open WhatsApp and Telegram conversations with contacts from the app's contact list.
* 
## Extending Functionality

YourCallYourRule is designed to be extensible through custom plugins. You can leverage these plugins to:

* **Subscribe to Online Databases:** Develop plugins to fetch and import blocking rules from public or private online databases. [US User](https://github.com/haygcao/vccard/tree/us)
* **Web Scraping:** Create plugins to scrape phone numbers from websites and automatically add them to your blocking lists (requires JavaScript knowledge). Template: https://github.com/haygcao/yourcallyourruletranslation/tree/main/plugintest  A  suite of testing tools has been configured.

## Cloud Service Integration
I am open to integrating any cloud service into the app, provided that a Flutter package and a test account are available. This allows for broader flexibility in backing up and restoring your data.

## Data Templates
This repository contains data templates for various purposes ([https://github.com/haygcao/yourcallyourruletranslation/tree/main/Templates]). Fields marked as "required" are mandatory, while others are optional.


## Contributing

We encourage users to contribute to the project by:

* **Submitting Pull Requests:** Share your custom plugins or improvements to the app.
* **Commenting on Issues:** Report bugs, suggest new features, or share links to publicly available blocking lists.
* **Sharing Blacklists:** Contribute your curated lists of spam numbers to help others.


## Notification Customization

The app utilizes the `flutter_local_notifications` package for local notifications, but only with basic configuration. If you have any creative ideas for enhancing notification functionality, feel free to contribute by modifying the `notification.dart` file: [https://github.com/haygcao/yourcallyourruletranslation/blob/main/notification.dart](https://github.com/haygcao/yourcallyourruletranslation/blob/main/notification.dart)

## Examples

For inspiration, check out these example workflows for creating custom subscription plugins:

* **US FCC Database:** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20database.yml)
* **US FCC Robocall Database:** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml] (https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20us/fcc%20robocall.yml) database https://github.com/haygcao/vccard/tree/us
* **France Regex:** [https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml](https://github.com/haygcao/yourcallyourruletranslation/blob/main/workflow%20for%20france/regex.yml)
* **Turkish Database:** [https://github.com/haygcao/vccard/blob/Turkish/processed_turkish_spam_numbers.csv](https://github.com/haygcao/vccard/blob/Turkish/processed_turkish_spam_numbers.csv))


* **Workflow Verification:** Due to certain limitations, the app itself cannot provide pre-processed phone number data. However, this does not affect your ability to customize your own data. Please verify the functionality of the provided workflows before using them. If you encounter any issues or inaccuracies with the workflows, we encourage you to modify them and submit your improvements. 

* **Spain:** You can use websites like [www.listaspam.com](https://www.listaspam.com/) and [www.responderono.es](https://www.responderono.es/) as sources for creating your own plugins.
* **China:** Utilize search engines like [www.baidu.com](https://www.baidu.com) or [www.so.com](https://www.so.com) to develop custom plugins for Chinese spam numbers.
*  **German:** https://www.wemgehoert.at/
* **Russia:** You can use websites like   [https://8sot.su/](https://8sot.su/) and [https://voprosoff.net/kto-zvonil/](https://voprosoff.net/kto-zvonil/)
*  **Public Universal:**  This https://www.shouldianswer.com/ should work for losts of countries according to the website but you have to develope the plugin to take the advantage. Otherwise you can refer to [call-spam-blocklist](https://github.com/Swyter/call-spam-blocklist/tree/master) all the  honour and etracted list belongs to the author [Swyter](https://github.com/Swyter/call-spam-blocklist/tree/master). But I do advise you making a plugin and share it to others.
*   **Options** * https://callfilter.app/
  
## Note on Open Source

The core application of YourCallYourRule is not open source. However, specific functionalities are open-sourced to facilitate community development and feedback.

## Disclaimer

* This app is developed by a non-professional developer and updates may be irregular.
* The translations are not comprehensive and may require further refinement.
* The app does not include a built-in database and relies on user-provided URLs or custom plugins for data sources.
* While the app supports web scraping, practical implementation requires JavaScript knowledge.
* AI-based translations may be inaccurate or incomplete. Please refer to the English version for the most accurate information.


We hope you find YourCallYourRule to be a valuable tool for reclaiming control over your phone and messages!
