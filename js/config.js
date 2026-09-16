// Google API Toolkit - 共通設定ファイル

export const SHARED_CONFIG = {
    // ▼ 先ほどCloud Consoleで設定したクライアントID
    CLIENT_ID: '794084414694-r5m0v5qoart5o5r23tc4l5kkl2pf7bk1.apps.googleusercontent.com',
    
    // ▼ 共通で利用するすべての権限（スコープ）
    SCOPES: [
        'https://www.googleapis.com/auth/drive.file',             // Drive保存用
        'https://www.googleapis.com/auth/calendar.events',        // カレンダー操作用
        'https://www.googleapis.com/auth/photoslibrary.appendonly', // Googleフォト保存用
        'https://www.googleapis.com/auth/gmail.readonly',         // Gmail読み取り用
        'https://www.googleapis.com/auth/gmail.send'              // Gmail動作用
    ].join(' '),
    
    // ▼ 共通HTMLビューア（GAS）のURL
    VIEWER_API_URL: 'https://script.google.com/macros/s/AKfycbyHDixocOZX8Q4wqp_hoVcfTnZr9e-0-smYGCSbGQlRJY6tUPihnYM6d5bvh2E0IVU7/exec'
};
