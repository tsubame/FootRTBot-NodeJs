//======================================================
//
// ツイート用コントローラモジュール
//
//======================================================

//======================================================
// require設定
//======================================================

// 定数
const _constants = require('../etc/const');

// log4js
const _log4js = require('log4js');

// Twitter操作用モデル
const _twAccessor = require('../models/twitterAPIAccessor');

// prisma 
const _prisma = require('@prisma/client');

// DB操作用
const _dbAccessor = require('../models/dbAccessor');


//======================================================
// 変数宣言
//======================================================

// ロギング用設定
_log4js.configure(_constants.LOG4JS_CONFIG_VALS_DICT);

// ロギング用
const _logger = _log4js.getLogger();

// PrismaClient
const _prismaClient = new _prisma.PrismaClient();


//======================================================
//
// 1-1. タイムライン上の一定数以上のツイートをRT
//
//======================================================

/**
 * タイムライン上の一定数以上のツイートをRT
 * 	・タイムライン上から一定以上のRTのツイートを取得
 * 	・RT数の多いツイートのうち、DB未保存のツイートをピックアップ
 * 	・RT実行
 * 	・RTしたツイートをDB登録
 * 	・RTしたツイートのうち、未フォローのユーザをDBに保存
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
module.exports.retweetFromHomeTimeLine = async function(req, res) {
	try {
		// ホームタイムライン上から一定数以上のRTのツイートを取得
		const tlManyRTTweets = await _twAccessor.getManyRTTweetsFromTimeLine();
		// RT数の多いツイートのうち、DB未保存のツイートをピックアップ
		const newManyRTTweets = await _dbAccessor.getNotDBSavedTweets(tlManyRTTweets);
		console.log('TL内のRT数の多い新規ツイート：' + newManyRTTweets.length);
		// RT実行
		_twAccessor.retweetTargetTweets(newManyRTTweets);
		// RTしたツイートをDB登録
		_dbAccessor.saveTweetDatas(newManyRTTweets);		

		// RTしたツイートのうち、未フォローのユーザをDBに保存
		//saveNotFollowUserInRTTweetsToDB(newManyRTTweetModels);
	} catch (error) {
		_logger.error(error);
	}

	// 結果を描画
	res.send("done.");	
}

//======================================================
// RTしたツイートのうち、未フォローのユーザをDBに保存
//======================================================

/**
 * RTしたツイートのうち、未フォローのユーザをDBに保存
 * 
 * @param {array} tweets 
 */
async function saveNotFollowUserInRTTweetsToDB(tweets) {
	var targetFcs = [];

	try {
		// 自分がフォローしているユーザデータを取得
		const fuModels = await _twAccessor.getMyFollowUserModels();

		// ツイートを走査
		for (tm of tweets) {
			// 未フォローなら
			if (!checkTargetUserFollowing(tm, fuModels)) {
				// フォロー候補ユーザモデルをセットし、配列に追加
				const fum = _dbAccessor.getUserModelFromTweetModel(tm);				
				notFollowUModels.push();
			}
		}

		// 未フォローのユーザのうち、DB未保存のデータを保存
		_dbAccessor.saveFollowCandidateModels(not)
		console.log('[未フォローユーザ]' + notFollowUserModels);
		_dbAccessor.saveUserModels(fuModels);
	} catch (error) {
		_logger.error(error);
	}	
}

/**
 * 対象ツイートのユーザをフォロー済かを返す
 * 
 * @param {Object} tm
 * @param {array} folloingUModels 
 * @returns {boolean}
 */
function checkTargetUserFollowing(tm, folloingUModels) {
	try {
		// ツイートを走査
		for (fu of folloingUModels) {
			if (fu.user_screen_name == tm.user_screen_name) {
				return true;
			}
		}
	} catch (error) {
		_logger.error(error);
	}	

	return false;
}

//======================================================
//
// 1-2. トレンド内の対象ジャンルのキーワードを検索し、一定数以上のツイートをRT
//
//======================================================

/**
 * トレンド内の対象ジャンルのキーワードを検索し、一定数以上のツイートをRT
 * 	・日本のトレンドのキーワードのうち、TLのツイート内に含まれるキーワードをピックアップ
 * 	・それぞれを検索し、RT数の多いツイートをRT
 * 	・RTしたツイートをDB登録
 * 	・RTしたツイートのうち、未フォローのユーザをDBに保存
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
 module.exports.retweetFromTrendWord = async function(req, res) {
	try {
		// 日本のトレンドのキーワードのうち、TLのツイート内に含まれるキーワードをピックアップ
		const trWords = await _twAccessor.getTrendKeywordsInHomeTimeLine();
		// それぞれを検索し、RT数の多いツイートをRT
		for (tWord of trWords) {
			var searchedManyRTTweets = await _twAccessor.getManyRTTweetsBySearch(tWord);
			// 上記のうち、DB未保存のツイートをピックアップ
			const newManyRTTweets = await _dbAccessor.getNotDBSavedTweets(searchedManyRTTweets);

			// RT実行
			_twAccessor.retweetTargetTweets(newManyRTTweets);
			// RTしたツイートをDB登録
			_dbAccessor.saveTweetDatas(newManyRTTweets);					
		}
	} catch (error) {
		_logger.error(error);
	}

	// 結果を描画
	res.send("done.");	
}


//======================================================
//
// 1-3. 特定のキーワードを検索し、一定数以上のツイートをRT
//
//======================================================

/**
 * 特定のキーワードを検索し、一定数以上のツイートをRT
 * 	・定数で設定されたキーワードを検索し、RT数の多いツイートをRT
 *	・NGワードを含むツイートはRTしない
 * 	・RTしたツイートをDB登録
 * 	・RTしたツイートのうち、未フォローのユーザをDBに保存
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
module.exports.retweetFromTargetSearchWords = async function(req, res) {
	var rtTargetTweets = [];

	try {
		// 対象のキーワードを走査
		for (tWord of _constants.SEARCH_TARGET_KEYWORDS) {
			// 対象のキーワードで検索し、RT数の多いツイートをセット
			const searchedManyRTTweets = await _twAccessor.getManyRTTweetsBySearch(tWord);

			// 上記のうち、DB未保存のツイートをピックアップ
			const newManyRTTweets = await _dbAccessor.getNotDBSavedTweets(searchedManyRTTweets);

			// NGワードを含まないものを配列に追加
			for (tw of newManyRTTweets) {
				if (!checkTargetTweetContainsNGWord(tw)) {
					rtTargetTweets.push(tw);

					// ロギング
					_logger.debug('[RT候補を検索キーワード「' + tWord + '」からセット] ' + tw.rt_count + 'RT');
					_logger.debug(tw.tweet_text);
				}
			}
		}

		// RT実行
		_twAccessor.retweetTargetTweets(rtTargetTweets);
		// RTしたツイートをDB登録
		_dbAccessor.saveTweetDatas(rtTargetTweets);							
	} catch (error) {
		_logger.error(error);
	}

	// 結果を描画
	res.send("done.");	
}

//======================================================
// 対象のツイートがNGワードを含むかを返す
//======================================================

/**
 * 対象のツイートがNGワードを含むかを返す
 * 
 * @param {Object} tw 
 * @returns {Boolean}
 */
function checkTargetTweetContainsNGWord(tw) {
	try {
		// NGワードを走査
		for (ngWord of _constants.RT_NG_KEYWORDS) { 
			if (tw.tweet_text.indexOf(ngWord) !== -1) {
				return true;
			}
		}
	} catch (error) {
		_logger.error(error);
	}

	return false;
}
