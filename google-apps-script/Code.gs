/**
 * KATEstageLASH Web問診票 - Google Apps Script
 *
 * このスクリプトをGoogle Apps Scriptに貼り付けて、
 * Webアプリとしてデプロイしてください。
 */

// スプレッドシートの設定
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // スプレッドシートIDを設定
const SHEET_NAME = '問診票データ';

/**
 * POSTリクエストを処理
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = saveToSpreadsheet(data);

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
    'その他（経路）',
    '来店動機',
    'ご職業',
    'メイク頻度',
    '目元メイク傾向',
    '就寝時の姿勢',
    '運動・サウナ・プール頻度',
    'オイルクレンジング使用',
    '眼科通院中',
    '通院中の病名・症状',
    '目の病気既往歴',
    '目の病気その他',
    'アレルギー',
    'アレルギーその他',
    '施術トラブル経験',
    '服用中の薬',
    '薬名',
    '皮膚疾患',
    '妊娠・授乳',
    '美容医療施術歴',
    'コンタクトレンズ',
    '目元の症状',
    'まつ毛の状態',
    '眉毛の状態',
    'まつ毛エクステ経験',
    'エクステ最終時期',
    '残りエクステ有無',
    'まつ毛パーマ経験',
    'パーマ最終時期',
    '眉毛サロン経験',
    '眉毛ワックス経験',
    'ワックス最終時期',
    '過去施術のトラブル',
    '希望メニュー',
    'まつ毛仕上がりイメージ',
    '眉毛仕上がりイメージ',
    '重視ポイント',
    '参考写真',
    '来店ペース希望',
    'クーポン種別',
    'クーポン名',
    '施術同意（内容理解）',
    '施術同意（注意事項）',
    '施術同意（個人情報）',
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
    data.howFoundOther || '',
    data.visitReason || '',
    data.occupation || '',
    data.makeupFrequency || '',
    data.eyeMakeup || '',
    data.sleepPosition || '',
    data.exerciseFrequency || '',
    data.oilCleansing || '',
    data.eyeClinic || '',
    data.eyeClinicCondition || '',
    data.eyeHistory || '',
    data.eyeHistoryOther || '',
    data.allergies || '',
    data.allergiesOther || '',
    data.pastTroubles || '',
    data.medication || '',
    data.medicationDetails || '',
    data.skinCondition || '',
    data.pregnancy || '',
    data.cosmeticHistory || '',
    data.contactLens || '',
    data.eyeSymptoms || '',
    data.lashCondition || '',
    data.browCondition || '',
    data.lashExtExperience || '',
    data.lashExtLastTime || '',
    data.remainingExt || '',
    data.lashPermExperience || '',
    data.lashPermLastTime || '',
    data.browSalonExperience || '',
    data.browWaxExperience || '',
    data.browWaxLastTime || '',
    data.pastIssues || '',
    data.desiredMenu || '',
    data.lashStyle || '',
    data.browStyle || '',
    data.priorities || '',
    data.referencePhoto || '',
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
    howFound: 'HotpepperBeauty, Instagram（投稿）',
    visitReason: '初めて施術を試してみたい',
    occupation: '会社員（事務・内勤）',
    makeupFrequency: '毎日',
    eyeMakeup: 'ナチュラル',
    sleepPosition: '仰向け',
    exerciseFrequency: '週1〜2回',
    oilCleansing: '使用していない',
    eyeClinic: 'いいえ',
    eyeHistory: '特になし',
    allergies: '花粉症',
    pastTroubles: '特になし',
    medication: 'なし',
    skinCondition: '特になし',
    pregnancy: 'どちらでもない',
    cosmeticHistory: '特になし',
    contactLens: 'ソフトコンタクト',
    eyeSymptoms: '特になし',
    lashCondition: '特に気にならない',
    browCondition: '特に気にならない',
    lashExtExperience: '初めて',
    lashPermExperience: '初めて',
    browSalonExperience: '初めて',
    browWaxExperience: '初めて',
    pastIssues: '特になし',
    desiredMenu: 'まつ毛パーマ',
    lashStyle: 'ナチュラル',
    browStyle: 'ナチュラル',
    priorities: '持ちの良さ, ナチュラルさ',
    referencePhoto: 'なし',
    visitFrequency: '月1回程度',
    couponType: '通常予約（クーポンなし）',
    treatmentConsent: '施術内容・リスク理解',
    aftercareConsent: '注意事項理解',
    privacyConsent: '個人情報同意',
    snsConsent: '目元のみ（顔なし）ならOK'
  };

  const result = saveToSpreadsheet(testData);
  Logger.log('テストデータを保存しました: ' + JSON.stringify(result));
}
