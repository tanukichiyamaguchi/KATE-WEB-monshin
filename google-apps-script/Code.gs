/**
 * KATEstageLASH Web問診票 - Google Apps Script
 *
 * このスクリプトをGoogle Apps Scriptに貼り付けて、
 * Webアプリとしてデプロイしてください。
 */

// スプレッドシートの設定
const SPREADSHEET_ID = '1jtexHAtYskILJC6aDk8IzJAdoiKE2YEDYzkyCYyV45M';
const SHEET_NAME = '問診票データ';
const SETTINGS_SHEET_NAME = '設定';
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
 * 次のカルテ番号を生成
 */
function generateKarteNumber() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);

  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    setupSettingsSheet(settingsSheet);
  }

  // カルテ番号カウンターを取得（B2セル）
  const counterCell = settingsSheet.getRange('B2');
  let currentNumber = counterCell.getValue() || 0;
  currentNumber++;

  // カウンターを更新
  counterCell.setValue(currentNumber);

  // 0001 形式でカルテ番号を生成
  return String(currentNumber).padStart(4, '0');
}

/**
 * 設定シートを初期化
 */
function setupSettingsSheet(sheet) {
  // ヘッダーと初期値を設定
  const settings = [
    ['設定項目', '値'],
    ['カルテ番号カウンター', 0],
    ['', ''],
    ['メール送信先（1行に1アドレス）', ''],
    ['', 'example1@example.com'],
    ['', 'example2@example.com']
  ];

  sheet.getRange(1, 1, settings.length, 2).setValues(settings);

  // ヘッダーのスタイル
  sheet.getRange(1, 1, 1, 2).setBackground('#C9A84C').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(4, 1).setBackground('#E8D9A0').setFontWeight('bold');

  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 300);
}

/**
 * 設定シートからメール送信先リストを取得
 */
function getEmailRecipients() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);

  if (!settingsSheet) {
    return [];
  }

  // B5セル以降のメールアドレスを取得
  const lastRow = settingsSheet.getLastRow();
  if (lastRow < 5) return [];

  const emailRange = settingsSheet.getRange(5, 2, lastRow - 4, 1);
  const emails = emailRange.getValues()
    .flat()
    .filter(email => email && email.toString().includes('@'));

  return emails;
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

  // カルテ番号を生成
  const karteNumber = generateKarteNumber();
  data.karteNumber = karteNumber;

  // データを行として追加
  const row = createRow(data);
  sheet.appendRow(row);

  // 署名画像を保存（オプション）
  let signatureUrl = '';
  if (data.signature && data.signature.startsWith('data:image')) {
    signatureUrl = saveSignatureImage(data.signature, data.name, data.timestamp);
  }

  // PDFを生成してメール送信
  try {
    const pdfBlob = generatePDF(data, signatureUrl);
    sendEmailWithPDF(data, pdfBlob, karteNumber);
  } catch (error) {
    console.error('Error sending email:', error);
  }

  return { row: sheet.getLastRow(), karteNumber: karteNumber };
}

/**
 * ヘッダー行を作成
 */
function createHeader(sheet) {
  const headers = [
    'カルテ番号',
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
    data.karteNumber || '',
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
 * PDF用HTMLを生成
 */
function generatePDFHtml(data, signatureUrl) {
  const now = new Date();
  const formattedDate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy年MM月dd日 HH:mm');

  // 値を安全に取得するヘルパー関数
  const v = (val) => val || '-';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Hiragino Kaku Gothic Pro', 'メイリオ', sans-serif;
      font-size: 9px;
      line-height: 1.3;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #C9A84C;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 16px;
      color: #C9A84C;
      letter-spacing: 2px;
    }
    .header .subtitle {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }
    .karte-info {
      display: flex;
      justify-content: space-between;
      background: #f8f6f0;
      padding: 5px 10px;
      margin-bottom: 8px;
      border-radius: 3px;
    }
    .karte-number {
      font-size: 12px;
      font-weight: bold;
      color: #C9A84C;
    }
    .date { font-size: 9px; color: #666; }
    .section {
      margin-bottom: 6px;
      border: 1px solid #ddd;
      border-radius: 3px;
      overflow: hidden;
    }
    .section-title {
      background: #C9A84C;
      color: white;
      padding: 3px 8px;
      font-size: 9px;
      font-weight: bold;
    }
    .section-content {
      padding: 5px 8px;
    }
    .row {
      display: flex;
      border-bottom: 1px dotted #eee;
      padding: 2px 0;
    }
    .row:last-child { border-bottom: none; }
    .label {
      width: 120px;
      font-weight: bold;
      color: #666;
      flex-shrink: 0;
    }
    .value { flex: 1; }
    .two-col { display: flex; gap: 10px; }
    .two-col > div { flex: 1; }
    .warning {
      background: #fff3cd;
      border-left: 3px solid #ffc107;
      padding: 3px 8px;
      margin: 3px 0;
      font-size: 8px;
    }
    .consent-box {
      background: #e8f5e9;
      padding: 5px 8px;
      border-radius: 3px;
      margin-top: 5px;
    }
    .signature-area {
      text-align: center;
      margin-top: 8px;
      padding: 5px;
      border: 1px solid #ddd;
      border-radius: 3px;
    }
    .signature-img {
      max-height: 40px;
      max-width: 150px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KATEstageLASH</h1>
    <div class="subtitle">問 診 票</div>
  </div>

  <div class="karte-info">
    <span class="karte-number">${v(data.karteNumber)}</span>
    <span class="date">${formattedDate}</span>
  </div>

  <div class="two-col">
    <div class="section">
      <div class="section-title">基本情報</div>
      <div class="section-content">
        <div class="row"><span class="label">お名前</span><span class="value">${v(data.name)}（${v(data.furigana)}）</span></div>
        <div class="row"><span class="label">生年月日</span><span class="value">${v(data.birthDate)}</span></div>
        <div class="row"><span class="label">電話番号</span><span class="value">${v(data.phone)}</span></div>
        <div class="row"><span class="label">メール</span><span class="value">${v(data.email)}</span></div>
        <div class="row"><span class="label">ご職業</span><span class="value">${v(data.occupation)}</span></div>
        <div class="row"><span class="label">来店経路</span><span class="value">${v(data.howFound)}</span></div>
        <div class="row"><span class="label">来店動機</span><span class="value">${v(data.visitReason)}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">ライフスタイル</div>
      <div class="section-content">
        <div class="row"><span class="label">メイク頻度</span><span class="value">${v(data.makeupFrequency)}</span></div>
        <div class="row"><span class="label">目元メイク</span><span class="value">${v(data.eyeMakeup)}</span></div>
        <div class="row"><span class="label">就寝姿勢</span><span class="value">${v(data.sleepPosition)}</span></div>
        <div class="row"><span class="label">運動頻度</span><span class="value">${v(data.exerciseFrequency)}</span></div>
        <div class="row"><span class="label">オイルクレンジング</span><span class="value">${v(data.oilCleansing)}</span></div>
        <div class="row"><span class="label">コンタクト</span><span class="value">${v(data.contactLens)}</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">健康状態・既往歴</div>
    <div class="section-content">
      <div class="two-col">
        <div>
          <div class="row"><span class="label">眼科通院</span><span class="value">${v(data.eyeClinic)} ${data.eyeClinicCondition ? '(' + data.eyeClinicCondition + ')' : ''}</span></div>
          <div class="row"><span class="label">目の既往歴</span><span class="value">${v(data.eyeHistory)} ${data.eyeHistoryOther ? '(' + data.eyeHistoryOther + ')' : ''}</span></div>
          <div class="row"><span class="label">アレルギー</span><span class="value">${v(data.allergies)} ${data.allergiesOther ? '(' + data.allergiesOther + ')' : ''}</span></div>
          <div class="row"><span class="label">目元の症状</span><span class="value">${v(data.eyeSymptoms)}</span></div>
        </div>
        <div>
          <div class="row"><span class="label">服用中の薬</span><span class="value">${v(data.medication)} ${data.medicationDetails ? '(' + data.medicationDetails + ')' : ''}</span></div>
          <div class="row"><span class="label">皮膚疾患</span><span class="value">${v(data.skinCondition)}</span></div>
          <div class="row"><span class="label">妊娠・授乳</span><span class="value">${v(data.pregnancy)}</span></div>
          <div class="row"><span class="label">美容医療歴</span><span class="value">${v(data.cosmeticHistory)}</span></div>
        </div>
      </div>
      ${data.pastTroubles && data.pastTroubles !== '特になし' ? '<div class="warning">過去トラブル: ' + data.pastTroubles + '</div>' : ''}
    </div>
  </div>

  <div class="two-col">
    <div class="section">
      <div class="section-title">まつ毛・眉毛の状態</div>
      <div class="section-content">
        <div class="row"><span class="label">まつ毛の状態</span><span class="value">${v(data.lashCondition)}</span></div>
        <div class="row"><span class="label">眉毛の状態</span><span class="value">${v(data.browCondition)}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">施術経験</div>
      <div class="section-content">
        <div class="row"><span class="label">まつエク</span><span class="value">${v(data.lashExtExperience)} ${data.lashExtLastTime ? '(最終:' + data.lashExtLastTime + ')' : ''}</span></div>
        <div class="row"><span class="label">まつ毛パーマ</span><span class="value">${v(data.lashPermExperience)} ${data.lashPermLastTime ? '(最終:' + data.lashPermLastTime + ')' : ''}</span></div>
        <div class="row"><span class="label">眉サロン</span><span class="value">${v(data.browSalonExperience)}</span></div>
        <div class="row"><span class="label">眉ワックス</span><span class="value">${v(data.browWaxExperience)} ${data.browWaxLastTime ? '(最終:' + data.browWaxLastTime + ')' : ''}</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ご希望</div>
    <div class="section-content">
      <div class="row"><span class="label">希望メニュー</span><span class="value">${v(data.desiredMenu)}</span></div>
      <div class="row"><span class="label">まつ毛イメージ</span><span class="value">${v(data.lashStyle)}</span></div>
      <div class="row"><span class="label">眉毛イメージ</span><span class="value">${v(data.browStyle)}</span></div>
      <div class="row"><span class="label">重視ポイント</span><span class="value">${v(data.priorities)}</span></div>
      <div class="row"><span class="label">来店ペース</span><span class="value">${v(data.visitFrequency)}</span></div>
      <div class="row"><span class="label">クーポン</span><span class="value">${v(data.couponType)} ${data.couponName ? '(' + data.couponName + ')' : ''}</span></div>
    </div>
  </div>

  <div class="consent-box">
    <strong>同意事項:</strong>
    施術内容理解: ✓ | 注意事項理解: ✓ | 個人情報同意: ✓ |
    SNS掲載: ${v(data.snsConsent)} ${data.reviewConsentCheck ? '| 口コミ同意: ✓' : ''}
  </div>

  ${signatureUrl ? `
  <div class="signature-area">
    <div style="font-size:8px;color:#666;">署名</div>
    <img src="${signatureUrl}" class="signature-img" />
  </div>
  ` : ''}
</body>
</html>`;
}

/**
 * PDFを生成
 */
function generatePDF(data, signatureUrl) {
  const html = generatePDFHtml(data, signatureUrl);

  // 一時的なHTMLファイルを作成してPDFに変換
  const blob = Utilities.newBlob(html, 'text/html', 'monshin.html');

  // Google DocsでHTMLをPDFに変換
  const tempDoc = Drive.Files.insert(
    { title: '問診票_' + data.karteNumber, mimeType: 'application/vnd.google-apps.document' },
    blob,
    { convert: true }
  );

  // PDFとしてエクスポート
  const pdfBlob = DriveApp.getFileById(tempDoc.id).getAs('application/pdf');
  pdfBlob.setName('問診票_' + data.karteNumber + '_' + data.name + '.pdf');

  // 一時ファイルを削除
  DriveApp.getFileById(tempDoc.id).setTrashed(true);

  return pdfBlob;
}

/**
 * PDFをメールで送信
 */
function sendEmailWithPDF(data, pdfBlob, karteNumber) {
  const recipients = getEmailRecipients();

  if (recipients.length === 0) {
    console.log('メール送信先が設定されていません');
    return;
  }

  const subject = `問診票：${karteNumber} ${data.name || ''}`;

  const body = `
新しい問診票が送信されました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
カルテ番号: ${karteNumber}
お名前: ${data.name || ''} (${data.furigana || ''})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 基本情報
・生年月日: ${data.birthDate || '-'}
・電話番号: ${data.phone || '-'}
・メール: ${data.email || '-'}
・ご職業: ${data.occupation || '-'}
・来店経路: ${data.howFound || '-'}
・来店動機: ${data.visitReason || '-'}

■ 健康状態
・眼科通院: ${data.eyeClinic || '-'} ${data.eyeClinicCondition ? '(' + data.eyeClinicCondition + ')' : ''}
・アレルギー: ${data.allergies || '-'} ${data.allergiesOther ? '(' + data.allergiesOther + ')' : ''}
・服用中の薬: ${data.medication || '-'} ${data.medicationDetails ? '(' + data.medicationDetails + ')' : ''}
・妊娠・授乳: ${data.pregnancy || '-'}

■ ご希望
・希望メニュー: ${data.desiredMenu || '-'}
・まつ毛イメージ: ${data.lashStyle || '-'}
・眉毛イメージ: ${data.browStyle || '-'}
・重視ポイント: ${data.priorities || '-'}
・来店ペース: ${data.visitFrequency || '-'}

■ クーポン・同意
・クーポン: ${data.couponType || '-'} ${data.couponName ? '(' + data.couponName + ')' : ''}
・SNS掲載: ${data.snsConsent || '-'}
${data.reviewConsentCheck ? '・口コミ投稿: 同意済み' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
詳細はPDFをご確認ください。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  // 全ての送信先にメールを送信
  recipients.forEach(email => {
    try {
      GmailApp.sendEmail(email, subject, body, {
        attachments: [pdfBlob],
        name: 'KATEstageLASH 問診票システム'
      });
      console.log('メール送信成功: ' + email);
    } catch (error) {
      console.error('メール送信エラー (' + email + '):', error);
    }
  });
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

  // メインシートの設定
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  createHeader(sheet);

  // シート全体のスタイル設定
  sheet.setColumnWidth(1, 120);  // カルテ番号
  sheet.setColumnWidth(2, 180);  // タイムスタンプ
  sheet.setColumnWidth(3, 150);  // 送信日時
  sheet.setColumnWidth(4, 100);  // お名前
  sheet.setColumnWidth(5, 120);  // フリガナ

  // 設定シートの作成
  let settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    setupSettingsSheet(settingsSheet);
  }

  Logger.log('スプレッドシートの設定が完了しました');
  Logger.log('設定シートでメール送信先を登録してください');
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

/**
 * メール送信テスト
 */
function testEmailSend() {
  const testData = {
    karteNumber: 'KATE-TEST',
    name: 'テスト 太郎',
    furigana: 'テスト タロウ',
    birthDate: '1990年1月1日',
    phone: '090-1234-5678',
    email: 'test@example.com',
    desiredMenu: 'まつ毛パーマ',
    snsConsent: '顔出しOK'
  };

  try {
    const pdfBlob = generatePDF(testData, null);
    sendEmailWithPDF(testData, pdfBlob, testData.karteNumber);
    Logger.log('テストメール送信完了');
  } catch (error) {
    Logger.log('エラー: ' + error.message);
  }
}
