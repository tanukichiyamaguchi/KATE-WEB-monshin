# KATEstageLASH 蒲田西口店 Web問診票

まゆ毛まつ毛専門店「KATEstageLASH 蒲田西口店」のWeb問診票システムです。
スマートフォンでの入力に最適化され、Google Spreadsheetにデータが蓄積されます。

## 機能

- ステップ形式の問診票（全10セクション）
- 条件分岐による動的な質問表示
- 手書き署名機能
- Google Spreadsheetへの自動データ保存
- スマートフォン最適化デザイン
- 金色（#C9A84C）をベースとした洗練されたUI

## ファイル構成

```
KATE-WEB-monshin/
├── index.html                 # メインHTMLファイル
├── styles.css                 # スタイルシート
├── script.js                  # JavaScript
├── assets/
│   └── logo.png               # ロゴ画像（要配置）
├── google-apps-script/
│   └── Code.gs                # Google Apps Script
└── README.md                  # このファイル
```

## セットアップ手順

### 1. Google Spreadsheetの準備

1. [Google Spreadsheet](https://sheets.google.com) で新しいスプレッドシートを作成
2. スプレッドシートのURLからIDを取得
   - URL例: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - `SPREADSHEET_ID` の部分をコピー

### 2. Google Apps Scriptの設定

1. [Google Apps Script](https://script.google.com) にアクセス
2. 「新しいプロジェクト」をクリック
3. `google-apps-script/Code.gs` の内容をコピーして貼り付け
4. `SPREADSHEET_ID` を実際のIDに置き換え
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ここを変更
   ```
5. 「保存」をクリック
6. 「実行」→「setupSpreadsheet」を選択して実行（初回のみ）
7. 権限の承認を行う

### 3. Google Apps ScriptをWebアプリとしてデプロイ

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 種類として「ウェブアプリ」を選択
3. 以下の設定を行う：
   - 説明: KATEstageLASH問診票
   - 実行ユーザー: 自分
   - アクセスできるユーザー: 全員
4. 「デプロイ」をクリック
5. 表示されたWebアプリのURLをコピー

### 4. フロントエンドの設定

1. `script.js` を開く
2. `GOOGLE_SCRIPT_URL` を取得したWebアプリURLに置き換え
   ```javascript
   const CONFIG = {
       GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/xxxxx/exec',
       // ...
   };
   ```

### 5. ロゴ画像の配置

1. `assets/` フォルダにロゴ画像を `logo.png` として配置
2. 推奨サイズ: 幅 360px 以上

### 6. Webサーバーへのデプロイ

以下のいずれかの方法でデプロイ：

#### GitHub Pages
1. GitHubリポジトリにプッシュ
2. Settings → Pages → Source で `main` ブランチを選択
3. `https://username.github.io/repository-name/` でアクセス

#### Netlify
1. Netlifyにログイン
2. 「New site from Git」でリポジトリを選択
3. 自動デプロイ設定

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 問診票セクション一覧

| セクション | 内容 |
|------------|------|
| 1 | 基本情報（名前、生年月日、連絡先） |
| 2 | 当店を知った経路・来店動機 |
| 3 | ライフスタイル（職業、メイク頻度等） |
| 4 | 健康状態・アレルギー歴 |
| 5 | 目元の現在の状態 |
| 6 | 施術歴・経験 |
| 7 | ご希望・デザインイメージ |
| 8 | クーポン確認 |
| 9 | 同意・確認事項 |
| 10 | 署名・送信 |

## 条件分岐

以下の質問は回答内容に応じて追加質問が表示されます：

- 「紹介」選択時 → 紹介者名入力
- 「その他」選択時 → 詳細入力
- 眼科通院「はい」→ 病名・症状選択
- 服薬「あり」→ 薬名入力
- まつ毛エクステ経験あり → 最終時期・残存確認
- 口コミクーポン選択時 → 口コミ同意確認

## カスタマイズ

### コーポレートカラーの変更

`styles.css` の CSS変数を編集：

```css
:root {
    --gold-primary: #C9A84C;    /* メインカラー */
    --gold-light: #E8D9A0;      /* 明るいトーン */
    --gold-dark: #9A7B30;       /* 暗いトーン */
}
```

### 質問項目の追加・変更

1. `index.html` で質問を追加
2. `script.js` の `collectFormData()` でフィールド名を追加
3. `Code.gs` の `createHeader()` と `createRow()` を更新

## トラブルシューティング

### データが保存されない
- Google Apps ScriptのURLが正しいか確認
- スプレッドシートIDが正しいか確認
- デプロイ設定で「全員がアクセス可能」になっているか確認

### 署名が保存されない
- Google Driveの権限を確認
- Apps Scriptに必要な権限が付与されているか確認

### CORSエラー
- `no-cors` モードでリクエストを送信しているため、通常は発生しません
- 問題が続く場合はGoogle Apps Scriptの再デプロイを試してください

## ライセンス

KATEstageLASH 蒲田西口店 専用

## お問い合わせ

技術的な問題については、開発担当者にお問い合わせください。
