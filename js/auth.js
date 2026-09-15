// Google Identity Services 用の共通認証モジュール

let tokenClient;
let accessToken = null;
let isAppInitialized = false;

// 外部のアプリからアクセストークンを取得するための関数
export function getAccessToken() {
    return accessToken;
}

// 認証の初期化関数（呼び出し元のアプリから設定を受け取る）
export function initAuth(config, onSuccess) {
    const { clientId, scopes, appName } = config;
    
    // アプリごとに localStorage のキーを分ける（例: "MyRecordApp_token"）
    const prefix = appName || 'default_app';
    const tokenKey = `${prefix}_token`;
    const expiresKey = `${prefix}_expires_at`;
    const emailKey = `${prefix}_email`;

    const storedToken = localStorage.getItem(tokenKey);
    const expiresAt = localStorage.getItem(expiresKey);

    // トークンの有効期限チェック（残り1分以上あるか）
    if (storedToken && expiresAt && Date.now() < parseInt(expiresAt) - 60000) {
        accessToken = storedToken;
        isAppInitialized = true;
        if (onSuccess) onSuccess(accessToken);
    }

    // Google Identity Services (GSI) のクライアント初期化
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes,
        callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                accessToken = tokenResponse.access_token;
                
                const expiryTime = Date.now() + (tokenResponse.expires_in * 1000);
                localStorage.setItem(tokenKey, accessToken);
                localStorage.setItem(expiresKey, expiryTime.toString());

                // 次回以降の自動ログイン（サイレント認証）のためにメールアドレスを保存
                try {
                    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    const userInfo = await userInfoRes.json();
                    if (userInfo.email) {
                        localStorage.setItem(emailKey, userInfo.email);
                    }
                } catch (e) {
                    console.log("ユーザー情報の取得に失敗", e);
                }

                if (!isAppInitialized) {
                    isAppInitialized = true;
                    if (onSuccess) onSuccess(accessToken);
                }
            }
        },
    });
}

// ログインボタンが押された時の処理
export function handleAuthClick(appName = 'default_app') {
    const emailKey = `${appName}_email`;
    const savedEmail = localStorage.getItem(emailKey);
    
    if (savedEmail) {
        // 一度ログインしたことがあれば、アカウント選択をスキップして自動ログイン
        tokenClient.requestAccessToken({ prompt: '', login_hint: savedEmail });
    } else {
        // 初回は同意画面を表示
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}
