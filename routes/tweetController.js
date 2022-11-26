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
// 1. ホームタイムライン上の一定数以上のツイートをRT
//
//======================================================

/**
 * ホームタイムライン上の一定数以上のツイートをRT
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
module.exports.retweetFromHomeTimeLine = async function(req, res) {
	try {
		// ホームタイムライン上から一定数以上のRTのツイートを取得
		const htManyRTTweetModels = await _twAccessor.getManyRTTweetModelsFromTimeLine();
		console.log('RT数の多いTLのツイート：' + htManyRTTweetModels.length);

		// DB未保存のデータのみを取得
		const newManyRTTweetModels = await _dbAccessor.getNotDBSavedTweetModels(htManyRTTweetModels);
		console.log('DB未保存のRT数の多いTLのツイート：' + newManyRTTweetModels.length);

		// RT実行
		_twAccessor.retweetTargetTweets(newManyRTTweetModels);
		// DB登録
		_dbAccessor.saveTweetDatas(newManyRTTweetModels);		

		// フォロー中のユーザのアカウント名を取得
		const fsNames = await _tw.getFollowUserScreenNames();


		// 未フォローのユーザをD

		/*
		// トレンドワードをセット
		_twAccessor.getTrendKeywordsInHomeTimeLine().then(function(trWords) { 
			console.log(trWords);

			// 各ワードで検索
			for (trWord of trWords) {
				_twAccessor.getManyRTTweetIdsBySearch(trWord).then(function() {
					
				});
			}
		});*/
	} catch (error) {
		_logger.error(error);
	}

	res.send("done.");	
}

//======================================================
// RTしたツイートのユーザのうち、未フォローのユーザを返す
//======================================================

function getNotFollowUserScreenNames

/*
// TLを取得して100RT以上のものをリツイート
function rtTweets(req, res){
	var action = require('../models/rt_tweets_action');
	action.exec();

	res.send('done.');
};

// アクション 最近のRTを表示
function showRecentRetweets(req, res){
	retweet_model.getRecentRetweets(100, function(recent_retweets) {
		res.render('show_recent_rts', { retweets: recent_retweets });
	});
};

// アクション 最近のRTとRT候補をメールで送信
function sendRtMail(req, res) {
	var action = require('../models/send_rt_mail_action');
	action.exec();

	res.send('done.');
}


// デモコード
function demo(req, res) {
	tw.setAccount(CONST.ACCOUNT.TWEET);
	//tw.setAccount(CONST.ACCOUNT.WATCH_TL);
	//tw.demo();

	var functions = [
	             function(cb) {
	            	 console.log('((ﾉ)・ω・(ヾ)ﾑﾆﾑﾆ');
	            	 cb();
	             },
	             function(cb) {
	             	console.log('(o´・ω・｀)σ)Д｀)ﾌﾟﾆｮﾌﾟﾆｮ');
	             	cb();
	             }

	             ];
	var cb = function() {};
	functions[1](cb);

	var async = require('async');
	async.series(functions);

	res.send('done.');
}*/
