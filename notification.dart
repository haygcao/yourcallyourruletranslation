  Future<void> _showLocalNotification(
      String phoneNumber, String messageContent) async {
    print("Showing SMS for ${messageContent}"); // Debug print
    const androidNotificationDetails = AndroidNotificationDetails(
      'SMS_Filter_channel', 'SMS Filter Notifications',
      //channelDescription: 'SMS Filter Notifications',
      importance: Importance.max,
      priority: Priority.high,
      //ticker: 'ticker'
    );
    const notificationDetails =
        NotificationDetails(android: androidNotificationDetails);

    // 显示通知
    await _flutterLocalNotificationsPlugin
        .show(0, '新短信', messageContent, notificationDetails, payload: 'item x');
  }

  Future<void> _showBlockedCallNotification(String phoneNumber) async {
    print("Showing CallerID overlay for ${phoneNumber}"); // Debug print
    const androidDetails = AndroidNotificationDetails(
      'call_blocker_channel',
      'Call Blocker Notifications',
      playSound: false, // 设置为 false 以禁用声音
      importance: Importance.max,
      priority: Priority.high,
    );
    const notificationDetails = NotificationDetails(android: androidDetails);
    await notificationsPlugin.show(0, 'Call Blocked',
        'Blocked call from $phoneNumber', notificationDetails,
        payload: 'goToCallHistory');
  }

  Future<void> _showStirCallNotification(String phoneNumber, bool isVerified,
      bool isNotVerified, bool isFailed) async {
    String stirResultMessage = "";

    if (isVerified) {
      stirResultMessage = "STIR Verified";
    } else if (isNotVerified) {
      stirResultMessage = "STIR Not Verified";
    } else if (isFailed) {
      stirResultMessage = "STIR Failed";
    } else {
      stirResultMessage = "STIR Unknown";
    }

    print(
        "Showing STIR notification for ${phoneNumber}: ${stirResultMessage}"); // Debug print

    const androidDetails = AndroidNotificationDetails(
      'call_blocker_channel',
      'Call Blocker Notifications',
      importance: Importance.max,
      priority: Priority.high,
    );
    const notificationDetails = NotificationDetails(android: androidDetails);
    await notificationsPlugin.show(0, 'Stir Verification',
        '${stirResultMessage} from $phoneNumber', notificationDetails,
        payload: 'goToCallHistory');
  }
