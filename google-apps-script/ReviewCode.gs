/**
 * KATEstageLASH 口コミ投稿システム - Google Apps Script
 *
 * このスクリプトをGoogle Apps Scriptに貼り付けて、
 * Webアプリとしてデプロイしてください。
 *
 * デプロイ手順:
 * 1. Google Apps Script (https://script.google.com) で新しいプロジェクトを作成
 * 2. このコードを貼り付け
 * 3. SPREADSHEET_ID を実際のスプレッドシートIDに変更
 * 4. 「デプロイ」→「新しいデプロイ」を選択
 * 5. 種類で「ウェブアプリ」を選択
 * 6. 「アクセスできるユーザー」を「全員」に設定
 * 7. デプロイしてURLをコピー
 * 8. review.js の GOOGLE_SCRIPT_URL にURLを設定
 */

// スプレッドシートの設定
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // スプレッドシートIDを設定
const SHEET_NAME = '口コミデータ';

/**
 * POSTリクエストを処理
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = saveReviewData(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, result: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを処理（テスト用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'OK',
      message: 'KATEstageLASH口コミAPIは正常に動作しています',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 口コミデータをスプレッドシートに保存
 */
function saveReviewData(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  // シートが存在しない場合は作成
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    createReviewHeader(sheet);
  }

  // ヘッダーが存在しない場合は作成
  if (sheet.getLastRow() === 0) {
    createReviewHeader(sheet);
  }

  // データを行として追加
  const row = createReviewRow(data);
  sheet.appendRow(row);

  return { row: sheet.getLastRow() };
}

/**
 * ヘッダー行を作成
 */
function createReviewHeader(sheet) {
  const headers = [
    'タイムスタンプ',
    '送信日時',
    '総合評価',
    '施術の技術',
    'スタッフの接客',
    '仕上がり・デザイン',
    '店内の雰囲気',
    '清潔感',
    '価格の満足度',
    '平均評価',
    '利用メニュー',
    '口コミ本文',
    '文字数'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダーのスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#C9A84C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // 列幅の設定
  sheet.setColumnWidth(1, 180);  // タイムスタンプ
  sheet.setColumnWidth(2, 150);  // 送信日時
  sheet.setColumnWidth(3, 80);   // 総合評価
  sheet.setColumnWidth(4, 100);  // 施術の技術
  sheet.setColumnWidth(5, 120);  // スタッフの接客
  sheet.setColumnWidth(6, 140);  // 仕上がり・デザイン
  sheet.setColumnWidth(7, 100);  // 店内の雰囲気
  sheet.setColumnWidth(8, 80);   // 清潔感
  sheet.setColumnWidth(9, 100);  // 価格の満足度
  sheet.setColumnWidth(10, 80);  // 平均評価
  sheet.setColumnWidth(11, 200); // 利用メニュー
  sheet.setColumnWidth(12, 400); // 口コミ本文
  sheet.setColumnWidth(13, 80);  // 文字数

  // ヘッダー行を固定
  sheet.setFrozenRows(1);
}

/**
 * データから行を作成
 */
function createReviewRow(data) {
  const now = new Date();
  const formattedDate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  // ratings オブジェクトを展開
  const ratings = data.ratings || {};

  return [
    data.timestamp || now.toISOString(),
    formattedDate,
    ratings.overall || 0,
    ratings.technique || 0,
    ratings.service || 0,
    ratings.design || 0,
    ratings.atmosphere || 0,
    ratings.cleanliness || 0,
    ratings.price || 0,
    data.averageRating || 0,
    data.menus || '',
    data.reviewText || '',
    (data.reviewText || '').length
  ];
}

/**
 * スプレッドシートの初期設定
 * 最初に一度だけ実行してください
 */
function setupReviewSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  createReviewHeader(sheet);

  // 条件付き書式を設定（評価によって色分け）
  const ratingColumns = [3, 4, 5, 6, 7, 8, 9]; // 各評価列

  ratingColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);

    // 5点: 緑
    const rule5 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(5)
      .setBackground('#C8E6C9')
      .setRanges([range])
      .build();

    // 4点: 薄緑
    const rule4 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(4)
      .setBackground('#DCEDC8')
      .setRanges([range])
      .build();

    // 3点: 黄
    const rule3 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(3)
      .setBackground('#FFF9C4')
      .setRanges([range])
      .build();

    // 2点: オレンジ
    const rule2 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(2)
      .setBackground('#FFE0B2')
      .setRanges([range])
      .build();

    // 1点: 赤
    const rule1 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(1)
      .setBackground('#FFCDD2')
      .setRanges([range])
      .build();

    const rules = sheet.getConditionalFormatRules();
    rules.push(rule5, rule4, rule3, rule2, rule1);
    sheet.setConditionalFormatRules(rules);
  });

  Logger.log('口コミスプレッドシートの設定が完了しました');
}

/**
 * テスト用関数
 */
function testSaveReviewData() {
  const testData = {
    timestamp: new Date().toISOString(),
    ratings: {
      overall: 5,
      technique: 5,
      service: 4,
      design: 5,
      atmosphere: 4,
      cleanliness: 5,
      price: 4
    },
    menus: 'まつげパーマ, アイブロウ',
    reviewText: '初めてまつげパーマとアイブロウをお願いしました。カウンセリングがとても丁寧で、私の希望をしっかり聞いてくださいました。仕上がりも想像以上に綺麗で、とても満足しています。スタッフの方の技術力の高さを感じました。店内も清潔感があり、リラックスして施術を受けることができました。また次回もお願いしたいと思います。',
    averageRating: '4.6'
  };

  const result = saveReviewData(testData);
  Logger.log('テストデータを保存しました: ' + JSON.stringify(result));
}

/**
 * 統計情報を取得する関数
 */
function getReviewStatistics() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet || sheet.getLastRow() <= 1) {
    return { totalReviews: 0, averageRating: 0 };
  }

  const data = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
  const ratings = data.flat().filter(r => r > 0);

  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0
    ? (ratings.reduce((a, b) => a + b, 0) / totalReviews).toFixed(2)
    : 0;

  Logger.log(`総口コミ数: ${totalReviews}, 平均評価: ${averageRating}`);

  return {
    totalReviews: totalReviews,
    averageRating: averageRating
  };
}

/**
 * 月次レポートを作成する関数
 */
function createMonthlyReport() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('データがありません');
    return;
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let monthlyReviews = [];

  for (let i = 1; i < data.length; i++) {
    const timestamp = new Date(data[i][0]);
    if (timestamp >= firstDayOfMonth && timestamp <= lastDayOfMonth) {
      monthlyReviews.push({
        date: data[i][1],
        overall: data[i][2],
        technique: data[i][3],
        service: data[i][4],
        design: data[i][5],
        atmosphere: data[i][6],
        cleanliness: data[i][7],
        price: data[i][8],
        averageRating: data[i][9],
        menus: data[i][10],
        reviewText: data[i][11]
      });
    }
  }

  const totalReviews = monthlyReviews.length;

  if (totalReviews === 0) {
    Logger.log('今月の口コミはありません');
    return;
  }

  const avgOverall = monthlyReviews.reduce((a, b) => a + (b.overall || 0), 0) / totalReviews;
  const avgTechnique = monthlyReviews.reduce((a, b) => a + (b.technique || 0), 0) / totalReviews;
  const avgService = monthlyReviews.reduce((a, b) => a + (b.service || 0), 0) / totalReviews;
  const avgDesign = monthlyReviews.reduce((a, b) => a + (b.design || 0), 0) / totalReviews;
  const avgAtmosphere = monthlyReviews.reduce((a, b) => a + (b.atmosphere || 0), 0) / totalReviews;
  const avgCleanliness = monthlyReviews.reduce((a, b) => a + (b.cleanliness || 0), 0) / totalReviews;
  const avgPrice = monthlyReviews.reduce((a, b) => a + (b.price || 0), 0) / totalReviews;

  const report = `
=== ${now.getFullYear()}年${now.getMonth() + 1}月 口コミレポート ===

総口コミ数: ${totalReviews}件

【平均評価】
総合評価: ${avgOverall.toFixed(2)}
施術の技術: ${avgTechnique.toFixed(2)}
スタッフの接客: ${avgService.toFixed(2)}
仕上がり・デザイン: ${avgDesign.toFixed(2)}
店内の雰囲気: ${avgAtmosphere.toFixed(2)}
清潔感: ${avgCleanliness.toFixed(2)}
価格の満足度: ${avgPrice.toFixed(2)}
  `;

  Logger.log(report);
  return report;
}
