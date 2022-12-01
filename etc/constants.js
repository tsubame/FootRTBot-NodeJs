//======================================================
//
// 定数定義用モジュール
//　・各Twitterアカウントで使い回せる定数を定義
//　・各アカウント固有の設定はapp_configに定義したものを読み込む
//
//======================================================

//======================================================
// require設定
//======================================================

// app_configからアカウント独自の定数を読込
var _app_config = require('./appConfig');

//======================================================
// リツイート設定
//======================================================

// この時間(h)より以前のツイートは無視
module.exports.SKIP_PAST_HOUR = 24;

// TLから1度に取得するツイートの数
module.exports.TWEET_GET_COUNT_FROM_TL = 200;

// この数以上のRT数でリツイート
module.exports.RETWEET_LEAST_RT = 100; 

// 検索時、最新のツイートを検索するか　false = 関連性の高いツイートを検索
module.exports.SEARCH_TWEET_BY_RECENCY = false;

//======================================================
// 検索キーワード
//======================================================

// 検索キーワード　このキーワードで検索し、RT数の多いツイートをRT
module.exports.SEARCH_TARGET_KEYWORDS = _app_config.SEARCH_TARGET_KEYWORDS;

// RT時のNGワード　このキーワードを含むツイートはRTしない
module.exports.RT_NG_KEYWORDS = _app_config.RT_NG_KEYWORDS;


//======================================================
// ツイッターアカウント
//======================================================

// アカウント名
module.exports.SCREEN_NAME = _app_config.TWITTER_SCREEN_NAME;

// アカウントID
module.exports.ACCOUNT_ID = _app_config.TWITTER_ACCOUNT_ID;

// Consumer Key
module.exports.CONSUMER_KEY = _app_config.CONSUMER_KEY;

// Consumer Secret
module.exports.CONSUMER_SECRET = _app_config.CONSUMER_SECRET;

// Access Token
module.exports.ACCESS_TOKEN_KEY = _app_config.ACCESS_TOKEN_KEY;

// Access Token Secret
module.exports.ACCESS_TOKEN_SECRET = _app_config.ACCESS_TOKEN_SECRET;


//======================================================
// ロギング用
//======================================================

// log4jsのオプション
module.exports.LOG4JS_CONFIG_VALS_DICT = {
  appenders: {
    console: {
      type: 'console'
    },
    system: {
      type: 'file',
        'filename': './logs/log.txt',
        'maxLogSize': 104857600,
        'layout': {
          'type': 'pattern',
          'pattern': '%d [%p] %m'}      
    } 
  },
  categories: { 
    default: { 
      appenders: [
        'console',
        'system'
      ], 
      level: 'debug' } 
  }    
};

