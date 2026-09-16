// Google Gmail API 用の共通モジュール

let accessToken = null;

// 外部からアクセストークンをセットするための関数
export function setGmailToken(token) {
    accessToken = token;
}

/**
 * Base64URL形式の文字列を日本語(UTF-8)にデコードする（内部用）
 */
function decodeBase64Url(str) {
    if (!str) return '';
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    try {
        return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
        return atob(base64);
    }
}

/**
 * メールの検索と情報の取得（件名、送信元、日時、本文など）
 * @param {string} query - 検索クエリ（例: "is:unread", "from:example@gmail.com" など。空なら最新のメール）
 * @param {number} maxResults - 取得する最大件数
 * @returns {Array} メールの詳細情報の配列
 */
export async function searchEmails(query = '', maxResults = 10) {
    // 1. 検索クエリに合致するメールのID一覧を取得
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const listRes = await fetch(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const listData = await listRes.json();
    
    if (!listData.messages) return [];

    const emails = [];
    
    // 2. 各メールIDから詳細データを取得し、必要な情報を抽出
    for (const msg of listData.messages) {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const detail = await detailRes.json();
        const headers = detail.payload.headers;

        // ヘッダー情報の抽出
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(件名なし)';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '不明';
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

        // 本文（テキスト）の抽出
        let bodyText = '';
        if (detail.payload.parts) {
            // マルチパート（添付ファイルやHTMLが含まれる場合）
            const textPart = detail.payload.parts.find(p => p.mimeType === 'text/plain');
            if (textPart && textPart.body.data) {
                bodyText = decodeBase64Url(textPart.body.data);
            }
        } else if (detail.payload.body && detail.payload.body.data) {
            // プレーンテキストのみの場合
            bodyText = decodeBase64Url(detail.payload.body.data);
        }

        emails.push({
            id: msg.id,
            subject: subject,
            from: from,
            date: date,
            snippet: detail.snippet, // Gmailの一覧に出るような短い要約
            body: bodyText
        });
    }
    return emails;
}

/**
 * メールの送信（To, CC, BCC, 件名, 本文, 添付ファイル）
 * @param {Object} options - 送信オプション
 * @param {string} options.to - 宛先
 * @param {string} [options.cc] - CC宛先
 * @param {string} [options.bcc] - BCC宛先
 * @param {string} options.subject - 件名
 * @param {string} options.body - 本文
 * @param {Array} [options.attachments] - 添付ファイルの配列 [{name: 'file.jpg', type: 'image/jpeg', base64: '...'}]
 */
export async function sendEmail({ to, cc = '', bcc = '', subject, body, attachments = [] }) {
    const boundary = 'myapp_boundary_' + Date.now().toString(16);
    let emailContent = '';

    // ヘッダーの組み立て
    emailContent += `To: ${to}\r\n`;
    if (cc) emailContent += `Cc: ${cc}\r\n`;
    if (bcc) emailContent += `Bcc: ${bcc}\r\n`;
    
    // 日本語の件名をRFC1342形式にエンコード
    const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    emailContent += `Subject: ${encodedSubject}\r\n`;
    emailContent += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // 本文の組み立て
    emailContent += `--${boundary}\r\n`;
    emailContent += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    emailContent += `${body}\r\n\r\n`;

    // 添付ファイルの組み立て
    for (const file of attachments) {
        // "data:image/jpeg;base64," のようなプレフィックスがあれば除去
        const cleanBase64 = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
        // 日本語ファイル名のエンコード
        const encodedFilename = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(file.name)))}?=`;
        
        emailContent += `--${boundary}\r\n`;
        emailContent += `Content-Type: ${file.type}; name="${encodedFilename}"\r\n`;
        emailContent += `Content-Disposition: attachment; filename="${encodedFilename}"\r\n`;
        emailContent += `Content-Transfer-Encoding: base64\r\n\r\n`;
        emailContent += `${cleanBase64}\r\n\r\n`;
    }

    emailContent += `--${boundary}--\r\n`;

    // 全体をBase64URL形式にエンコード
    const rawEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    // Gmail APIで送信
    const res = await fetch('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawEmail })
    });

    if (!res.ok) {
        throw new Error("メールの送信に失敗しました");
    }
    
    return await res.json();
}
