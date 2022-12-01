//======================================================
//
// アプリケーション独自の設定定義用（アカウント別の設定を記述）　
//
//======================================================

const e = require("express");

//======================================================
// メール
//======================================================

// メールアドレス
module.exports.MAIL_ADD = 'taltal3014@gmail.com';

//======================================================
// Twitterアカウント
//======================================================

// ツイッターアカウント名
module.exports.TWITTER_SCREEN_NAME = 'foot_rt_bot';

// ツイッターアカウントID
module.exports.TWITTER_ACCOUNT_ID = '1591213125994323968';

// BEARER_KEY
module.exports.BEARER_KEY = 'AAAAAAAAAAAAAAAAAAAAAFDyjAEAAAAAFUK1lncC2AEwIbMne0pfbBbx%2Fug%3DBae31cH2GmZCqfQr2AvFzRmtCh8onnSXziChh3nws4P9Pp5cs8';

// Consumer Key
module.exports.CONSUMER_KEY = 'VT5zwfxCETC3VuLfzZFlyte9B';

// Consumer Secret
module.exports.CONSUMER_SECRET = 'eNN822w0pmBq3GLhww9F9f0hP8xG41wGvzydL5yPYrnGjwKpZR';

// AccessToken Key
module.exports.ACCESS_TOKEN_KEY = '1591213125994323968-LGoLoarKebOyqNR6nJqcB06ibihisV';

// AccessToken Secret
module.exports.ACCESS_TOKEN_SECRET = 'F8UgcgDNwKv624pmW89eCSRSupgHNkpzh7Yi8KJwvGqJ8';

//======================================================
// サイト設定
//======================================================

// ポート番号
module.exports.PORT = 8080;

// トップページのアドレス
module.exports.TOP_PAGE_URL = 'localhost/';

//======================================================
// 検索キーワード
//======================================================

// 検索キーワード　このキーワードで検索し、RT数の多いツイートをRT
module.exports.SEARCH_TARGET_KEYWORDS = ['ワールドカップ', 'daihyo', 'サッカー日本代表'];

// RT時のNGワード　このキーワードを含むツイートはRTしない
module.exports.RT_NG_KEYWORDS = ['定期', 'フォロー', 'プレゼント', '当選', '抽選', '購入', 'bot', 'wittbot'];