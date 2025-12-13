/**
 * KATEstageLASH Web問診票 - Google Apps Script
 *
 * このスクリプトをGoogle Apps Scriptに貼り付けて、
 * Webアプリとしてデプロイしてください。
 */

// スプレッドシートの設定
const SPREADSHEET_ID = '1XxhyV1R1T3dc_wbtF2K1ofHeqmsCbayUYjiFqerGK1k'; // スプレッドシートIDを設定
const SHEET_NAME = '問診票データ';

/**
 * POSTリクエストを処理
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = saveToSpreadsheet(data);

    // PDF生成とメール送信
    if (data.email) {
      sendPdfEmail(data);
    }

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
    .createTextOutput(JSON.stringify({ status: 'OK', message: 'KATEstageLASH問診票APIは正常に動作しています' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * PDFを生成してメールで送信
 */
function sendPdfEmail(data) {
  try {
    // PDF内容を生成
    const pdfContent = generatePdfContent(data);
    const pdfBlob = createPdfBlob(pdfContent, data.name);

    // メール送信
    const subject = '【KATEstageLASH】問診票の控え';
    const body = `${data.name || 'お客'}様

この度はKATEstageLASH 蒲田西口店をご利用いただきありがとうございます。
ご入力いただいた問診票の控えをPDFにてお送りいたします。

━━━━━━━━━━━━━━━━━━━━
◆ 次回ご来店時のお知らせ ◆
━━━━━━━━━━━━━━━━━━━━

問診票のご入力特典として、
【全メニュー30%OFF】クーポンをプレゼント！

クーポンコード: KATE30OFF
有効期限: 発行日より3ヶ月

次回ご予約時にスタッフへお申し付けください。

━━━━━━━━━━━━━━━━━━━━

ご不明な点がございましたら、お気軽にお問い合わせください。

KATEstageLASH 蒲田西口店
`;

    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body,
      attachments: [pdfBlob]
    });

    console.log('PDF email sent to: ' + data.email);
    return true;
  } catch (error) {
    console.error('Error sending PDF email:', error);
    return false;
  }
}

/**
 * PDF内容を生成（HTML形式）
 */
function generatePdfContent(data) {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy年MM月dd日');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #C9A84C;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      color: #C9A84C;
      margin: 0 0 5px 0;
    }
    .header p {
      color: #666;
      margin: 0;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      background: #C9A84C;
      color: white;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .field {
      display: flex;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .field-label {
      width: 40%;
      color: #666;
      font-weight: bold;
    }
    .field-value {
      width: 60%;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KATEstageLASH</h1>
    <p>Web問診票</p>
    <p style="font-size: 10px; margin-top: 10px;">作成日: ${dateStr}</p>
  </div>

  <div class="section">
    <div class="section-title">基本情報</div>
    ${createField('お名前', data.name)}
    ${createField('フリガナ', data.furigana)}
    ${createField('生年月日', data.birthDate)}
    ${createField('電話番号', data.phone)}
    ${createField('メールアドレス', data.email)}
  </div>

  <div class="section">
    <div class="section-title">来店経路・ライフスタイル</div>
    ${createField('当店を知った経路', data.howFound)}
    ${createField('紹介者', data.referrerName)}
    ${createField('来店動機', data.visitReason)}
    ${createField('ご職業', data.occupation)}
    ${createField('メイク頻度', data.makeupFrequency)}
    ${createField('目元メイク', data.eyeMakeup)}
    ${createField('就寝時の姿勢', data.sleepPosition)}
    ${createField('オイルクレンジング', data.oilCleansing)}
  </div>

  <div class="section">
    <div class="section-title">健康状態・目元の状態</div>
    ${createField('眼科通院', data.eyeClinic)}
    ${createField('病名・症状', data.eyeClinicCondition)}
    ${createField('アレルギー', data.allergies)}
    ${createField('皮膚疾患', data.skinCondition)}
    ${createField('妊娠・授乳', data.pregnancy)}
    ${createField('コンタクトレンズ', data.contactLens)}
    ${createField('目元の症状', data.eyeSymptoms)}
    ${createField('まつ毛の状態', data.lashCondition)}
  </div>

  <div class="section">
    <div class="section-title">施術歴</div>
    ${createField('エクステ経験', data.lashExtExperience)}
    ${createField('エクステ最終時期', data.lashExtLastTime)}
    ${createField('パーマ経験', data.lashPermExperience)}
    ${createField('パーマ最終時期', data.lashPermLastTime)}
    ${createField('眉サロン経験', data.browSalonExperience)}
    ${createField('過去のトラブル', data.pastTroubles)}
  </div>

  <div class="section">
    <div class="section-title">ご希望</div>
    ${createField('希望メニュー', data.desiredMenu)}
    ${createField('まつ毛イメージ', data.lashStyle)}
    ${createField('眉毛イメージ', data.browStyle)}
    ${createField('重視ポイント', data.priorities)}
    ${createField('来店ペース', data.visitFrequency)}
    ${createField('クーポン種別', data.couponType)}
  </div>

  <div class="section">
    <div class="section-title">同意事項</div>
    ${createField('SNS掲載', data.snsConsent)}
    ${createField('施術同意', data.treatmentConsent ? '同意済み' : '')}
    ${createField('注意事項理解', data.aftercareConsent ? '同意済み' : '')}
    ${createField('個人情報同意', data.privacyConsent ? '同意済み' : '')}
  </div>

  <div class="footer">
    <p>KATEstageLASH 蒲田西口店</p>
    <p>この問診票は電子的に記録されています</p>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * フィールドHTMLを生成
 */
function createField(label, value) {
  if (!value) return '';
  return `<div class="field"><span class="field-label">${label}</span><span class="field-value">${value}</span></div>`;
}

/**
 * HTMLからPDF Blobを生成
 */
function createPdfBlob(htmlContent, customerName) {
  const blob = Utilities.newBlob(htmlContent, 'text/html', 'temp.html');
  const pdf = blob.getAs('application/pdf');

  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMdd');
  pdf.setName(`問診票_${customerName || '顧客'}_${dateStr}.pdf`);

  return pdf;
}

/**
 * スプレッドシートにデータを保存
 */
function saveToSpreadsheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  // シートが存在しない場合は作成
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    createHeader(sheet);
  }

  // ヘッダーが存在しない場合は作成
  if (sheet.getLastRow() === 0) {
    createHeader(sheet);
  }

  // データを行として追加
  const row = createRow(data);
  sheet.appendRow(row);

  // 署名画像を保存（オプション）
  if (data.signature && data.signature.startsWith('data:image')) {
    saveSignatureImage(data.signature, data.name, data.timestamp);
  }

  return { row: sheet.getLastRow() };
}

/**
 * ヘッダー行を作成
 */
function createHeader(sheet) {
  const headers = [
    'タイムスタンプ',
    '送信日時',
    'お名前',
    'フリガナ',
    '生年月日',
    '電話番号',
    'メールアドレス',
    '当店を知った経路',
    '紹介者名',
    '来店動機',
    'ご職業',
    'メイク頻度',
    '目元メイク傾向',
    '就寝時の姿勢',
    'オイルクレンジング使用',
    '眼科通院中',
    '通院中の病名・症状',
    'アレルギー',
    '皮膚疾患',
    '妊娠・授乳',
    'コンタクトレンズ',
    '目元の症状',
    'まつ毛の状態',
    'まつ毛エクステ経験',
    'エクステ最終時期',
    'まつ毛パーマ経験',
    'パーマ最終時期',
    '眉毛サロン経験',
    '過去施術のトラブル',
    '希望メニュー',
    'まつ毛仕上がりイメージ',
    '眉毛仕上がりイメージ',
    '重視ポイント',
    '来店ペース希望',
    'クーポン種別',
    'クーポン名',
    '施術同意',
    'アフターケア同意',
    '個人情報同意',
    'SNS掲載同意',
    '口コミ投稿同意',
    '署名画像URL'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダーのスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#C9A84C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // 列幅の自動調整
  sheet.setFrozenRows(1);
}

/**
 * データから行を作成
 */
function createRow(data) {
  const now = new Date();
  const formattedDate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  return [
    data.timestamp || now.toISOString(),
    formattedDate,
    data.name || '',
    data.furigana || '',
    data.birthDate || '',
    data.phone || '',
    data.email || '',
    data.howFound || '',
    data.referrerName || '',
    data.visitReason || '',
    data.occupation || '',
    data.makeupFrequency || '',
    data.eyeMakeup || '',
    data.sleepPosition || '',
    data.oilCleansing || '',
    data.eyeClinic || '',
    data.eyeClinicCondition || '',
    data.allergies || '',
    data.skinCondition || '',
    data.pregnancy || '',
    data.contactLens || '',
    data.eyeSymptoms || '',
    data.lashCondition || '',
    data.lashExtExperience || '',
    data.lashExtLastTime || '',
    data.lashPermExperience || '',
    data.lashPermLastTime || '',
    data.browSalonExperience || '',
    data.pastTroubles || '',
    data.desiredMenu || '',
    data.lashStyle || '',
    data.browStyle || '',
    data.priorities || '',
    data.visitFrequency || '',
    data.couponType || '',
    data.couponName || '',
    data.treatmentConsent || '',
    data.aftercareConsent || '',
    data.privacyConsent || '',
    data.snsConsent || '',
    data.reviewConsentCheck || '',
    '' // 署名画像URLは後で更新
  ];
}

/**
 * 署名画像をGoogle Driveに保存
 */
function saveSignatureImage(base64Data, customerName, timestamp) {
  try {
    // Base64データからBlob作成
    const base64 = base64Data.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/png');

    // ファイル名を設定
    const date = new Date();
    const dateStr = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
    const fileName = `署名_${customerName}_${dateStr}.png`;
    blob.setName(fileName);

    // 署名フォルダを取得または作成
    const folderName = 'KATEstageLASH_署名';
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);

    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // ファイルを保存
    const file = folder.createFile(blob);

    // スプレッドシートの最新行に署名URLを追加
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    sheet.getRange(lastRow, lastCol).setValue(file.getUrl());

    return file.getUrl();
  } catch (error) {
    console.error('Error saving signature:', error);
    return null;
  }
}

/**
 * スプレッドシートの初期設定
 * 最初に一度だけ実行してください
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  createHeader(sheet);

  // シート全体のスタイル設定
  sheet.setColumnWidth(1, 180);  // タイムスタンプ
  sheet.setColumnWidth(2, 150);  // 送信日時
  sheet.setColumnWidth(3, 100);  // お名前
  sheet.setColumnWidth(4, 120);  // フリガナ

  Logger.log('スプレッドシートの設定が完了しました');
}

/**
 * テスト用関数
 */
function testSaveData() {
  const testData = {
    timestamp: new Date().toISOString(),
    name: 'テスト 太郎',
    furigana: 'テスト タロウ',
    birthDate: '1990年1月1日',
    phone: '090-1234-5678',
    email: 'test@example.com',
    howFound: 'HotpepperBeauty, Instagram',
    visitReason: '初めて試したい',
    occupation: '会社員（事務・内勤）',
    makeupFrequency: '毎日',
    eyeMakeup: 'ナチュラル',
    sleepPosition: '仰向け',
    oilCleansing: '使用していない',
    eyeClinic: 'いいえ',
    allergies: '花粉症',
    skinCondition: '特になし',
    pregnancy: 'どちらでもない',
    contactLens: 'ソフト',
    eyeSymptoms: '特になし',
    lashCondition: '気にならない',
    lashExtExperience: '初めて',
    lashPermExperience: '初めて',
    browSalonExperience: '初めて',
    pastTroubles: '特になし',
    desiredMenu: 'まつ毛パーマ',
    lashStyle: 'ナチュラル',
    browStyle: 'ナチュラル',
    priorities: '持ちの良さ, ナチュラルさ',
    visitFrequency: '月1回程度',
    couponType: '通常予約',
    treatmentConsent: '施術内容・リスク理解',
    aftercareConsent: '注意事項理解',
    privacyConsent: '個人情報同意',
    snsConsent: '目元のみOK'
  };

  const result = saveToSpreadsheet(testData);
  Logger.log('テストデータを保存しました: ' + JSON.stringify(result));
}

/**
 * メール送信テスト用関数
 */
function testSendEmail() {
  const testData = {
    name: 'テスト 太郎',
    furigana: 'テスト タロウ',
    birthDate: '1990年1月1日',
    phone: '090-1234-5678',
    email: 'your-test-email@example.com', // テスト用メールアドレスを設定
    howFound: 'HotpepperBeauty',
    visitReason: '初めて試したい',
    occupation: '会社員',
    makeupFrequency: '毎日',
    eyeMakeup: 'ナチュラル',
    sleepPosition: '仰向け',
    oilCleansing: '使用していない',
    eyeClinic: 'いいえ',
    allergies: '特になし',
    skinCondition: '特になし',
    pregnancy: 'どちらでもない',
    contactLens: 'ソフト',
    eyeSymptoms: '特になし',
    lashCondition: '気にならない',
    lashExtExperience: '初めて',
    lashPermExperience: '初めて',
    browSalonExperience: '初めて',
    pastTroubles: '特になし',
    desiredMenu: 'まつ毛パーマ',
    lashStyle: 'ナチュラル',
    browStyle: 'ナチュラル',
    priorities: '持ちの良さ',
    visitFrequency: '月1回程度',
    couponType: '通常予約',
    treatmentConsent: '同意済み',
    aftercareConsent: '同意済み',
    privacyConsent: '同意済み',
    snsConsent: '目元のみOK'
  };

  const result = sendPdfEmail(testData);
  Logger.log('メール送信結果: ' + result);
}
