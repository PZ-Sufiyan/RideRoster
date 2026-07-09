import Flutter
import UIKit
import UserNotifications
import FirebaseCore
import FirebaseMessaging

@main
@objc class AppDelegate: FlutterAppDelegate {
  private static let pushChannelName = "com.nstsch.rideroster/push"
  private var pendingDeviceToken: Data?
  private var pushChannel: FlutterMethodChannel?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
    }
    GeneratedPluginRegistrant.register(with: self)

    if let controller = window?.rootViewController as? FlutterViewController {
      setupPushChannel(controller: controller)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func setupPushChannel(controller: FlutterViewController) {
    let channel = FlutterMethodChannel(
      name: AppDelegate.pushChannelName,
      binaryMessenger: controller.binaryMessenger
    )
    channel.setMethodCallHandler { [weak self] call, result in
      guard let self = self else {
        result(FlutterError(code: "unavailable", message: "AppDelegate released", details: nil))
        return
      }
      switch call.method {
      case "applyPendingApnsToken":
        self.applyPendingApnsToken()
        result(self.apnsTokenHex())
      case "getApnsTokenHex":
        result(self.apnsTokenHex())
      default:
        result(FlutterMethodNotImplemented)
      }
    }
    pushChannel = channel
  }

  private func applyPendingApnsToken() {
    guard FirebaseApp.app() != nil, let token = pendingDeviceToken else { return }
    Messaging.messaging().apnsToken = token
  }

  private func apnsTokenHex() -> String? {
    guard let token = pendingDeviceToken else { return nil }
    return token.map { String(format: "%02.2hhx", $0) }.joined()
  }

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    pendingDeviceToken = deviceToken
    applyPendingApnsToken()
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    NSLog("APNs registration failed: \(error.localizedDescription)")
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }
}
