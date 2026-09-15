// Google Photos API 用の共通モジュール

let accessToken = null;

// 外部からアクセストークンをセットするための関数
export function setPhotosToken(token) {
    accessToken = token;
}

/**
 * 新しいアルバムを作成する
 * @param {string} title - アルバムのタイトル（例: "2026_お城めぐり記録"）
 * @returns {string} 作成されたアルバムのID
 */
export async function createAlbum(title) {
    const res = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            album: { title: title }
        })
    });
    const data = await res.json();
    return data.id;
}

/**
 * 自分が作成したアルバムの一覧を取得する
 * @returns {Array} アルバム情報の配列
 */
export async function getAlbums() {
    const res = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await res.json();
    return data.albums || [];
}

/**
 * 画像・動画をGoogleフォトにアップロードし、メディアアイテムを作成する
 * @param {File|Blob} file - アップロードするファイルオブジェクト
 * @param {string} filename - ファイル名（例: "starscape_maruyachi.jpg"）
 * @param {string} [albumId=null] - 保存先のアルバムID（指定しない場合はメインライブラリに保存）
 * @returns {Object} 作成されたメディアアイテムの情報
 */
export async function uploadMediaToPhotos(file, filename, albumId = null) {
    // ステップ1: バイトデータをアップロードして uploadToken を取得する
    const uploadRes = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-type': 'application/octet-stream',
            'X-Goog-Upload-Content-Type': file.type,
            'X-Goog-Upload-Protocol': 'raw'
        },
        body: file
    });
    
    if (!uploadRes.ok) throw new Error("Googleフォトへのアップロード(Step1)に失敗しました");
    const uploadToken = await uploadRes.text();

    // ステップ2: uploadToken を使ってライブラリ（およびアルバム）に登録する
    const newMediaItem = {
        description: filename,
        simpleMediaItem: { uploadToken: uploadToken }
    };

    const requestBody = {
        newMediaItems: [newMediaItem]
    };
    
    if (albumId) {
        requestBody.albumId = albumId;
    }

    const createRes = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const createData = await createRes.json();
    if (createData.newMediaItemResults && createData.newMediaItemResults[0].status.message === "Success") {
        return createData.newMediaItemResults[0].mediaItem;
    } else {
        throw new Error("Googleフォトへの登録(Step2)に失敗しました");
    }
}
