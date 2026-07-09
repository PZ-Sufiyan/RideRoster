# iOS push notifications setup

Android and iOS use the **same push server** and **same FCM tokens** in `device_push_tokens`.
No separate iOS backend is required once Apple + Firebase are configured.

## Personal Apple ID vs paid Developer Program

If you see:

```
Personal development teams ... do not support the Push Notifications capability.
Provisioning profile doesn't include the aps-environment entitlement.
```

**Cause:** A free **Personal Team** (your name, e.g. "Abdul Razzaque Khakwani") cannot use push notifications.

**Fix (pick one):**

1. **Use your company/org team** in Xcode (paid Apple Developer Program), e.g. team `LFB2Q7ZJXB` with bundle `com.nst-sch.app`
2. **Enroll your Apple ID** in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)

In Xcode → **Runner** → **Signing & Capabilities** → **Team** must be the **organization** account, not "Personal Team".

---

## Prerequisites

- Apple Developer Program membership ($99/year)
- A **physical iPhone** (simulator does not receive real remote push reliably)
- Mac with Xcode installed
- Firebase project: `rideroster-2030d`

---

## Step 1 — Pick one Bundle ID

All of these must match:

| Place | Current value |
|-------|----------------|
| Xcode Debug/Release | `com.example.rideroster` |
| Xcode Profile | `com.nst-sch.app` |
| Firebase iOS app | `com.example.rideroster` |
| `GoogleService-Info.plist` | `com.example.rideroster` |

**Recommendation:** Use your real App Store ID everywhere, e.g. `com.nst-sch.app`.

1. Open `App/ios/Runner.xcworkspace` in Xcode
2. Select **Runner** target → **Signing & Capabilities**
3. Set **Bundle Identifier** to the same value on Debug, Release, and Profile
4. Re-run FlutterFire:

```bash
cd App
flutterfire configure --project=rideroster-2030d
```

This regenerates `GoogleService-Info.plist` and `firebase_options.dart`.

---

## Step 2 — Apple Developer Portal

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → create or edit your App ID (same Bundle ID as Xcode)
3. Enable capability: **Push Notifications**
4. Save

### Create APNs Auth Key (recommended)

1. **Keys** → **+** → enable **Apple Push Notifications service (APNs)**
2. Download the `.p8` file (only downloadable once — store it safely)
3. Note the **Key ID** and your **Team ID**

---

## Step 3 — Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → project **rideroster-2030d**
2. **Project settings** → **Cloud Messaging** tab
3. Under **Apple app configuration**, upload your APNs **Authentication Key**:
   - `.p8` file
   - Key ID
   - Team ID
4. Confirm the iOS app bundle ID matches Xcode

Firebase uses this key to deliver pushes to Apple devices through FCM.

---

## Step 4 — Xcode capabilities

Open `App/ios/Runner.xcworkspace`:

1. **Runner** target → **Signing & Capabilities**
2. Click **+ Capability** → add **Push Notifications**
3. Confirm **Background Modes** includes **Remote notifications** (already in `Info.plist`)
4. Select your **Team** for signing
5. Build to a real device

Entitlements in the repo:

| Build | File | `aps-environment` |
|-------|------|-------------------|
| Debug / Profile | `Runner.entitlements` / `RunnerProfile.entitlements` | `development` |
| Release (App Store / TestFlight) | `RunnerRelease.entitlements` | `production` |

---

## Step 5 — Build and test on a real iPhone

```bash
cd App
flutter pub get
cd ios && pod install && cd ..
flutter run -d <your-iphone-id>
```

1. Log in as a **driver** on the iPhone
2. Allow notifications when prompted
3. Check Supabase `device_push_tokens` — you should see a row with `platform = ios`
4. Assign a job from the web admin panel
5. Driver should receive the push

### Debug vs production APNs

| How you install | APNs environment |
|-----------------|------------------|
| `flutter run` / Xcode Debug | `development` |
| TestFlight / App Store | `production` |

If pushes work in debug but not TestFlight, confirm Firebase has the APNs key uploaded and Release uses `production` entitlements.

---

## Step 6 — Push server (same as Android)

Ensure the push API is running:

```bash
curl https://supabase.nst-sch.com/push-api/health
# → {"ok":true,...}
```

If you get **502**, restart on the server:

```bash
cd ~/push-notifications && pm2 restart rideroster-push
```

The server already sends APNS payloads in `fcm.js` — no iOS-specific server code is needed.

---

## iOS token saved but no notification arrives

| Check | What to do |
|-------|------------|
| **APNs key in Firebase** | Firebase Console → Project settings → Cloud Messaging → upload Apple **APNs Authentication Key** (`.p8`) with Key ID + Team ID |
| **Re-login after app update** | Log out and log in again so APNs token links to FCM (watch Xcode logs for `APNs token linked`) |
| **Debug vs Release** | Debug builds use `development` APNs; Release/TestFlight use `production`. A `.p8` key works for **both** |
| **Job assignment test** | Push only sends when `driver_approval_status = pending` (new assignment). Already-accepted jobs do not re-notify |
| **Push server logs** | `pm2 logs rideroster-push` — look for `FCM send errors` mentioning `APNS` or `THIRD_PARTY_AUTH_ERROR` |
| **Foreground** | If app is open, notification shows via local notification handler |

### Verify APNs is linked (Xcode console after login)

You should see:

```
iOS notification permission: AuthorizationStatus.authorized
APNs token linked (64 chars)
FCM token registered (cKBSeRvKZUt...)
```

If you see `APNs token still null`, the Firebase APNs key is missing or wrong in Firebase Console.

### Test iOS delivery directly in Firebase (bypasses your server)

1. Copy the FCM token from Xcode logs (`FCM token registered (...)`).
2. Firebase Console → **Engage** → **Messaging** → **Create campaign** → **Firebase Notification messages**.
3. Send a test message to that **single device token**.
4. Put the iPhone app in the **background** (or lock the screen), then send.

| Result | Meaning |
|--------|---------|
| Test message **arrives** | App + APNs are fine — check push server logs / job `pending` status / web assign toast |
| Test message **does not arrive** | Upload **APNs Authentication Key** (`.p8`) in Firebase → Project settings → **Cloud Messaging** → Apple app `com.nst-sch.app` |

### Upload APNs key (required for TestFlight / App Store)

1. [Apple Developer](https://developer.apple.org/account/resources/authkeys/list) → Keys → **+** → enable **Apple Push Notifications service (APNs)** → download `.p8` (once only).
2. Note **Key ID** and your **Team ID** (`LFB2Q7ZJXB`).
3. Firebase Console → ⚙️ Project settings → **Cloud Messaging** → under **Apple app configuration** for `com.nst-sch.app` → **Upload** APNs Authentication Key.
4. Re-login on the device after upload (optional but helps refresh token linkage).

Common FCM error when key is missing: `THIRD_PARTY_AUTH_ERROR` or `InvalidApnsCredential` in `pm2 logs rideroster-push`.

---

## What is already done in the app

- `firebase_messaging` + `FcmService` requests iOS permission
- `AppDelegate.swift` sets notification delegate
- `Info.plist` has `remote-notification` background mode
- `device_push_tokens` stores `platform: ios`
- Push server sends APNS payload via FCM
