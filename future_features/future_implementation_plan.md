# 将来的な実装計画

## Phase 2（Webアプリ拡張）

### サーバーサイドOCR
- Google Cloud Vision API をAPI Routeで実装
- 日本語名刺の高精度認識
- 実装条件: GCPアカウントの準備

### Web Push通知
- リマインダー機能のプッシュ通知対応
- next_contact_date 到達時の通知
- 実装条件: iOS 16.4+ ターゲット確定時

### オフライン対応
- Service Workerによるキャッシュ戦略
- IndexedDBによるオフラインデータ同期
- 実装条件: 利用データ規模の確認後

### 重複名刺の自動検出・統合UI
- 同名・同会社の名刺を自動検出
- 統合UIの実装

## Phase 3（ネイティブアプリ化）

### React Native / Expo移行
- 既存のSupabaseバックエンドをそのまま利用
- UIコンポーネントをNativeWind（Tailwind CSS互換）で移行
- 推定工数: 3-6ヶ月

### ネイティブ機能追加
- Face ID / Touch ID（LocalAuthentication）
- 電話帳の読み書き（Contacts framework）
- AirDrop共有
- バックグラウンド位置情報

### Apple Store / Google Play リリース
- App Store Connect 登録
- Google Play Console 登録
- プライバシーポリシーの整備
