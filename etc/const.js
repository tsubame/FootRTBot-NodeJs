//======================================================
//
// 定数定義用モジュール
//　・一部のアカウント独自の設定はapp_configに定義したものを読み込み
//
//======================================================

//======================================================
// require設定
//======================================================

// app_configからアカウント独自の定数を読込
var _app_config = require('./app_config');

//======================================================
// リツイート設定
//======================================================

// この日数より前のツイートは無視
module.exports.SKIP_PAST_DAY = 2;

// TLから1度に取得するツイートの数
module.exports.TWEET_GET_COUNT_FROM_TL = 200;

// この数以上のRT数でリツイート
module.exports.RETWEET_LEAST_RT = 100; 

//======================================================
// サイト設定
//======================================================

// トップページのアドレス
module.exports.TOP_PAGE_URL = _app_config.TOP_PAGE_URL;

// OAuthコールバックのURL
module.exports.OAUTH_CALLBACK_URL = _app_config.TOP_PAGE_URL + 'auth/tweet/callback';

// 待受ポート番号
module.exports.PORT = _app_config.PORT;

//======================================================
// メール
//======================================================

// メールアカウント
module.exports.MAIL = _app_config.MAIL_ADD;

//======================================================
// ツイッターアカウント
//======================================================

// アカウント名
module.exports.SCREEN_NAME = _app_config.TWITTER_SCREEN_NAME;

// アカウントID
module.exports.ACCOUNT_ID = _app_config.TWITTER_ACCOUNT_ID;

// BEARER_KEY
module.exports.BEARER_KEY = _app_config.BEARER_KEY;

// Consumer Key
module.exports.CONSUMER_KEY = _app_config.CONSUMER_KEY;

// Consumer Secret
module.exports.CONSUMER_SECRET = _app_config.CONSUMER_SECRET;

// Access Token
module.exports.ACCESS_TOKEN_KEY = _app_config.ACCESS_TOKEN_KEY;

// Access Token Secret
module.exports.ACCESS_TOKEN_SECRET = _app_config.ACCESS_TOKEN_SECRET;

// アカウント設定。WATCH_TL: TL監視用に使用、TWEET:    つぶやき用に使用
/*
module.exports.ACCOUNT_VALS_DICT = {
	WATCH_TL: {
		screen_name:         _app_config.TWITTER_ACCOUNT_NAME,
		consumer_key:        _app_config.CONSUMER_KEY,
		consumer_secret:     _app_config.CONSUMER_SECRET,
		access_token:        _app_config.ACCESS_TOKEN,
		access_token_secret: _app_config.ACCESS_TOKEN_SECRET
	},
	TWEET: {
		screen_name:         _app_config.TWITTER_ACCOUNT_NAME,
		consumer_key:        _app_config.CONSUMER_KEY,
		consumer_secret:     _app_config.CONSUMER_SECRET,
		access_token:        _app_config.ACCESS_TOKEN,
		access_token_secret: _app_config.ACCESS_TOKEN_SECRET
	},
	DEV: {
		screen_name:         _app_config.TWITTER_ACCOUNT_NAME,
		consumer_key:        _app_config.CONSUMER_KEY,
		consumer_secret:     _app_config.CONSUMER_SECRET,
		access_token:        _app_config.ACCESS_TOKEN,
		access_token_secret: _app_config.ACCESS_TOKEN_SECRET
	}
}*/

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
			'filename': './logs/error.log',
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

/*
// log4j
module.exports.LOG = {
	DIR: './logs/',
	INFO_FILE: 'info.log',
	ERROR_FILE: 'error.log'
}*/
