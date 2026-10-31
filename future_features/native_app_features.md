# ネイティブアプリ固有機能

## 1. OSレベルのFace ID直接制御

**現在実装しない理由**: WebアプリではWeb Authentication API (WebAuthn) 経由のみ対応可能。OSレベルの直接制御はネイティブSDK必須。

**Webアプリでの制約**: Safari/ChromeはWebAuthnによる生体認証はサポートするが、Face IDを直接操作するAPIは公開されていない。

**ネイティブアプリでの実現方法**:
- iOS: `LocalAuthentication.framework` の `LAContext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, ...)`
- Android: `BiometricPrompt` API

**実装再検討条件**: React Native / Expo への移行時

---

## 2. OSレベルの高度な生体認証連携

**現在実装しない理由**: Webアプリでは細かい生体認証フォールバック制御が不可。

**ネイティブアプリでの実現方法**:
- iOS: Touch ID / Face ID の詳細制御
- Android: 指紋・顔認証の詳細制御

---

## 3. バックグラウンドでの常時処理

**現在実装しない理由**: Service Workerは限定的なバックグラウンド処理のみ対応。

**ネイティブアプリでの実現方法**:
- iOS: `BackgroundTasks` フレームワーク
- Android: `WorkManager`

---

## 4. 端末の電話帳への直接的な自由アクセス

**現在実装しない理由**: Contact Picker API は読み取り専用。一括アクセス・書き込みは不可。

**ネイティブアプリでの実現方法**:
- iOS: `CNContactStore` (Contacts.framework)
- Android: `ContactsContract` プロバイダー

---

## 5. 端末ファイルへの無制限アクセス

**現在実装しない理由**: File System Access API は都度ユーザー許可が必要。

**ネイティブアプリでの実現方法**:
- iOS: `FileManager`
- Android: `MediaStore` / `SAF`

---

## 6. AirDropの直接制御

**現在実装しない理由**: AirDropはApple独自プロトコル（AWDL）。Webからは操作不可。

**実現方法**: iOS ネイティブアプリの `UIActivityViewController` 経由

---

## 7. LINEアプリの内部操作・直接制御

**現在実装しない理由**: LINE SDKはネイティブアプリ向け。Webからは`line://`スキームによるURL起動のみ。

**実現方法**: LINE SDK for iOS/Android

---

## 8. アプリ終了中の常時位置情報取得

**現在実装しない理由**: バックグラウンド位置情報取得にはネイティブ権限が必要。

**実現方法**:
- iOS: `CLLocationManager` の significant-change monitoring
- Android: `FusedLocationProviderClient` + `Service`

---

## 9. OSレベルの高度な通知制御

**現在実装しない理由**: Web Push APIは基本的な通知のみ対応。リッチ通知・インタラクティブ通知はネイティブ必須。

**実現方法**:
- iOS: `UNUserNotificationCenter`
- Android: `NotificationManager` + `NotificationChannel`
