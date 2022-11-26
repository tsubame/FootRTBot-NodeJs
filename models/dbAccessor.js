//======================================================
//
// DB操作用モジュール
//
// [索引]
//	□ 1-1. TwitterAPIから取得したTweetObjectをDB保存用のTweetモデルに変換
//	□ 1-2. TwitterAPIから取得したUserObjectをDB保存用のUserモデルに変換
//	□ 2.　　対象ツイートのうち、DB未保存のデータを返す
//	□ 3.　　対象ツイートデータをDBに保存
//
//======================================================


//======================================================
// require設定
//======================================================

// 定数
const _constants = require('../etc/const');

// log4js
const _log4js = require('log4js');

// prisma 
const _prisma = require('@prisma/client');

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
// 1-1. TwitterAPIから取得したTweetObjectをDB保存用のTweetモデルに変換
//
//======================================================

/**
 * APIから取得したTweetObjectをDB保存用のTweetモデルに変換
 * 
 * @param {Object} twObj
 * @return {Object} 
 */
module.exports.getTweetModelFromTweetObj = function(twObj) {
  var d = {}

  try {
    d = {
			'id_str_in_twitter': twObj.id_str,
      'user_name': twObj.user.name,
      'user_screen_name':  twObj.user.screen_name,
      'tweet_text': twObj.full_text,
      'rt_count':   twObj.retweet_count,      
      'rt_user_account_name': '',
      'posted_date': new Date(twObj.created_at),
    }
	} catch (error) {
		_logger.error(error);
	}		

  return d;
}

//======================================================
//
// 1-2. TwitterAPIから取得したUserObjectをDB保存用のUserモデルに変換
//
//======================================================

/**
 * TwitterAPIから取得したUserObjectをDB保存用のUserモデルに変換
 * 
 * @param {Object} uObj
 * @return {Object} 
 */
 module.exports.getTweetModelFromTweetObj = function(uObj) {
  var d = {}

  try {
    d = {
      'user_name': uObj.uname,
      'user_screen_name':  uObj.screen_name,
    }
	} catch (error) {
		_logger.error(error);
	}		

  return d;
}

//======================================================
//
// 2. 対象ツイートのうち、DB未保存のデータを返す
//
//======================================================

/**
 * 対象ツイートのうち、DB未保存のデータを返す
 * 
 * @param {array} tTweetDatas 
 * @return {array}
 */
 module.exports.getNotDBSavedTweetModels = async function(tTweetDatas) {
	var notDBSavedTweetDatas = [];

	try {
		const MAX_FETCH_COUNT = 1000
		// DBのデータを取得
		const dbSavedTweetDatas = await _prismaClient.tweet.findMany({'orderBy': {'posted_date': 'desc'}, 'take': MAX_FETCH_COUNT});		
		console.log('DB保存済のデータを取得: ' + dbSavedTweetDatas.length + '件');

		// 対象ツイートを走査
		for (tw of tTweetDatas) {
			// DB未保存なら配列に追加
			if (!checkTargetTweetAlreadyDBSaved(dbSavedTweetDatas, tw)) {
				notDBSavedTweetDatas.push(tw);
			}
		}
	} catch (error) {
		_logger.error(error);
	}		

	return notDBSavedTweetDatas;
}

//======================================================
// 対象ツイートがDB保存済かを返す
//======================================================

/**
 * 対象ツイートがDB保存済かを返す
 * 
 * @param {array} dbSavedTweets 
 * @param {Object} tTweet 
 * @returns 
 */
function checkTargetTweetAlreadyDBSaved(dbSavedTweets, tTweet) {
	try {
		for (tw of dbSavedTweets) {
			if (tw.id_str_in_twitter = tTweet.id_str_in_twitter) {
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
// 3. 対象ツイートデータをDBに保存
//
//======================================================

/**
 * 対象ツイートデータをDBに保存
 * 
 * @param {array} tTweetDatas 
 * @return {array}
 */
 module.exports.saveTweetDatas = async function(tTweetDatas) {
	try {
		for (d of tTweetDatas) {
			await _prismaClient.tweet.create({
				data: {
					'id_str_in_twitter': d.id_str_in_twitter,
					'user_name': d.user_name,
					'user_screen_name':  d.user_screen_name,
					'tweet_text': d.tweet_text,
					'rt_count':   d.rt_count,      
					'rt_user_account_name': '',
					'posted_date': d.posted_date,					
				}
			})
		}
	} catch (error) {
		_logger.error(error);
	}		
}

