/**
 * 汎用HTMLビューア (Google Apps Script)
 * 使い方: 呼び出し元のURLに ?id=ファイルID を付けてアクセスする
 */

function doGet(e) {
  // URLのパラメータからファイルIDを取得
  const fileId = e.parameter.id;
  
  // IDが指定されていない場合のエラーハンドリング
  if (!fileId) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif; padding:20px; color:red;">エラー: ファイルID (?id=...) が指定されていません。</div>'
    );
  }
  
  try {
    // Googleドライブからファイルを取得
    const file = DriveApp.getFileById(fileId);
    
    // 中身をUTF-8の文字列として読み込む
    const content = file.getBlob().getDataAsString('UTF-8');
    
    // HTMLとして出力し、スマホで見やすいようにviewportを設定
    return HtmlService.createHtmlOutput(content)
      .setTitle(file.getName().replace('.html', '')) // タブのタイトルをファイル名にする
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
      
  } catch (error) {
    // 権限がない、またはファイルが存在しない場合のエラーハンドリング
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif; padding:20px;">' +
      '<h3 style="color:red;">ファイルの読み込みに失敗しました</h3>' +
      '<p>このファイルが存在しないか、閲覧権限が付与されていません。</p>' +
      '<p style="color:#666; font-size:12px;">詳細: ' + error.message + '</p>' +
      '</div>'
    );
  }
}
