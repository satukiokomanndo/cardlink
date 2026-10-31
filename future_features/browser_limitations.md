# ブラウザの制約とWebAPIの限界

## OCR精度の制限

**制約**: クライアントサイドOCR（Tesseract.js）は日本語認識精度が低い場合がある。

**回避策（実装済み）**: 認識結果の手動編集を必須フローとして設計。

**将来の改善**: Google Cloud Vision API / Amazon Textract をサーバーサイドで呼び出す。APIキーは環境変数で管理し、クライアントに露出させない。

---

## Service Worker / PWAの制限

**制約**:
- iOSのSafariはWeb Pushの対応が限定的（iOS 16.4以降は対応）
- バックグラウンド同期は一部ブラウザのみ対応

**対応済み**:
- PWA manifest.json の設定
- オフライン対応は将来実装予定

---

## File System Access APIの制限

**制約**: Safari（iOS）は非対応。ファイルの書き込みはダウンロード方式のみ。

**実装方針（採用済み）**: `<a download>` を使ったファイルダウンロード方式で統一。

---

## Web Share APIの制限

**制約**: デスクトップChromeは対応、iOSのSafariは対応、Android Chromeは対応。一部環境では未対応。

**実装方針（採用済み）**: `navigator.share` が利用可能な場合はOSの共有メニューを使用。未対応の場合はクリップボードコピーにフォールバック。

---

## カメラAPIの制限

**制約**: `getUserMedia` は HTTPS 必須。ローカル開発時は `localhost` のみ許可。

**対応済み**: Supabaseホスティングは HTTPS のため問題なし。
