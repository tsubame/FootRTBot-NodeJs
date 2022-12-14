//======================================================
//
// TwitterAPI操作用モジュール
//
// [必要ライブラリ]
//  ・twitter-api-v2
//  ・log4js
//
// [索引]
//    □ 1.   ホームタイムラインから一定のRT数以上のツイートを取得
//    □ 2.   複数件のツイートをRT
//    □ 3.   対象キーワードで検索を実行し、一定のRT以上のツイートIDのリストを返す　
//    □ 4.   トレンドのキーワードのうち、ホームタイムラインでつぶやかれているキーワード一覧を取得
//    □ 5.   対象ツイートの情報を取得して投稿日時をセット
//    □ 6.   自分がフォローしているユーザのIDを全件取得
//
//======================================================

//======================================================
// モジュール読込
//======================================================

// 定数
const _constants = require('../etc/constants');

// twitter-api-v2ライブラリ
const _twitterAPI = require('twitter-api-v2');

// ロギング用ライブラリ
const _log4js = require('log4js');

// DB操作用
const _dbAccessor = require('./dbAccessor');

//======================================================
// 変数宣言
//======================================================

// ロギング用設定
_log4js.configure(_constants.LOG4JS_CONFIG_VALS_DICT);

// ロギング用
const _logger = _log4js.getLogger();

// TwitterAPI生成
const _twAPI = new _twitterAPI.TwitterApi({
  appKey: _constants.CONSUMER_KEY,
  appSecret: _constants.CONSUMER_SECRET,
  accessToken: _constants.ACCESS_TOKEN_KEY,
  accessSecret: _constants.ACCESS_TOKEN_SECRET
});

// Twitter操作用クライアント生成
const _twClient = _twAPI.readWrite;

// 自分のツイッターID
var _myTwitterID = '';


//======================================================
//
// 1. ホームタイムラインから一定のRT数以上のツイートを取得
//
//======================================================

/**
 * ホームタイムラインから一定のRT数以上のツイートを取得
 * 　・タイムラインから200件分のツイートを取得
 * 　・自分のアカウントでRT済のものはスキップ
 * 　・RT数が一定のものをPrismaのTweetモデルデータに変換し、配列に格納して返す
 * 
 * @return {array} Tweetモデルデータの配列
 */
module.exports.getManyRTTweetsFromTimeLine = async function() {
  var manyRtTweets = [];

  try {        
    // タイムラインからツイート取得
    const homeTimeline = await _twClient.v1.homeTimeline({'count': _constants.TWEET_GET_COUNT_FROM_TL});
    console.log(homeTimeline.tweets.length, 'tweet fetched from timeline.');

    // ツイートを走査
    for (const tObj of homeTimeline.tweets) {
      // RT済はスキップ
      if (tObj.retweeted) {
        continue;
      }

      // APIのツイートデータをDB保存用のツイートデータに変換
      const tw = _dbAccessor.getTweetModelFromTweetObj(tObj);
      // RT数が一定以上なら配列に追加
      if (_constants.RETWEET_LEAST_RT < tw.rt_count) {    
        manyRtTweets.push(tw);
      }
    }
  } catch (error) {
    _logger.error(error);
  }  

  return manyRtTweets;
}


//======================================================
//
// 2. 複数件のツイートをRT
//
//======================================================

/**
 * 複数件のツイートをRT
 *  ・自分のTwitterIDをセット
 *  ・対象ツイートの件数、RT実行
 * 
 * @param {array} tws RT対象のTweetモデルデータの配列
 */
module.exports.retweetTargetTweets = async function(tws) {
  try {
    // 自分のTwitterIDをセット
    await setMyTwitterID();
    
    // 各ツイートをRT
    for (const d of tws) {      
      retweetTargetIDTweet(d.id_str_in_twitter);
      _logger.debug('[RT実行] ' + d.rt_count + 'RT ' + d.user_screen_name + ' ' + d.tweet_text);
    }
  } catch (error) {
    _logger.error(error);
  }
}

//======================================================
// 自分のTwitterIDをセット
//======================================================

/** 
 * 自分のTwitterIDをセット
 * 　・APIで自分のTwitterIDを取得し、_myTwitterIDにセット
 */
async function setMyTwitterID() {
  try {
    // 自分のTwitterIDをセット
    const mDict = await _twClient.v2.me({ expansions: ['pinned_tweet_id'] });
    _myTwitterID = mDict.data.id.toString();    
  } catch (error) {
    _logger.error(error);
  }
}

//======================================================
// 1件のツイートのRTを実行
//======================================================

/**
 * 1件のツイートのRTを実行
 * 
 * @param tidStr RTするツイートのID
 */
async function retweetTargetIDTweet(tidStr) {
  try {  
    // RT実行    
    await _twClient.v2.retweet(_myTwitterID, tidStr);    
    console.log('retweeted. ' + tidStr);
  } catch (error) {
    _logger.error(error);
  }
}

//======================================================
//
// 3. 対象キーワードで検索を実行し、一定のRT以上のツイートIDのリストを返す　
//
//======================================================

/**
 * 対象キーワードで検索を実行し、一定のRT以上のツイートIDのリストを返す　
 *  ・APIで検索を実施
 *  ・検索結果の各ツイートデータを走査
 *  ・API検索結果のツイートオブジェクトをDB保存用のTweetモデルに変換
 *  ・配列に該当ツイートのIDを保存済ならスキップ（複数ユーザにRTされたツイートは複数件引っかかるため）
 *  ・アカウント名も検索の対象になるため、本文に検索キーワードが含まれていない場合はスキップ
 *  ・RT数が一定以上なら配列に追加
 * 
 * @param {string} q 検索キーワード
 * @returns {array}  Tweetモデルデータの配列
 */
 module.exports.getManyRTTweetsBySearch = async function(q) {
  var tweets = [];
  var savedTweetIds = [];

  try {
    // APIで対象キーワードの検索を実施
    const searchResObj = await getSearchResultObj(q);

    // 検索結果のツイートを走査
    for (const twObj of searchResObj._realData.data) {
      // API検索結果オブジェクトをTweetモデルに変換
      const tw = _dbAccessor.getTweetModelFromTweetSearchObj(twObj);

      // 配列に該当ツイートのIDを保存済ならスキップ
      if (savedTweetIds.indexOf(tw.id_str_in_twitter) !== -1) {
        continue;
      // ツイート本文にキーワードが含まれていなければスキップ
      } else if (tw.tweet_text.indexOf(q) === -1) {
        continue;
      }

      // RT数が一定以上なら配列に追加
      if (_constants.RETWEET_LEAST_RT <= tw.rt_count) {        
        tweets.push(tw);
        savedTweetIds.push(tw.id_str_in_twitter);
      }
    }
  } catch (error) {
    _logger.error(error);
  }

  return tweets
}

//======================================================
// APIの検索結果オブジェクトを取得
//======================================================

/**
 * APIの検索結果オブジェクトを取得
 * 　・定数の値に合わせて新着ツイート、または関連性の高いツイートを検索するかをセット
 * 　・24時間以内のツイートのみを100件取得
 * 
 * @param {string} q 検索キーワード
 * @returns {Object} API検索結果のTwitterObject
 */
async function getSearchResultObj(q) {
  const SORT_ORDER_RECENCY   = 'recency';
  const SORT_ORDER_RELEVANCY = 'relevancy';
  const SEARCH_COUNT = 100;

  try {
    // 自分のTwitterIDをセット
    await setMyTwitterID();

    // 新着ツイート、または関連性の高いツイートを検索するかをセット
    var sortOrder = SORT_ORDER_RELEVANCY;
    if (_constants.SEARCH_TWEET_BY_RECENCY) {
      sortOrder = SORT_ORDER_RECENCY;
    }
    
    // 検索対象の開始時刻（24時間前）をセット
    var startTime = new Date()
    startTime.setHours(startTime.getHours() - _constants.SKIP_PAST_HOUR);

    // 検索実行
    const searchResObj = await _twClient.v2.search(q, 
        {'tweet.fields': ['public_metrics', 'referenced_tweets', 'created_at', 'source'], 
         'start_time':  startTime.toISOString(), 
         'user.fields': ['public_metrics'], 
         'sort_order':  sortOrder, 
         'max_results': SEARCH_COUNT, 
         'expansions':  ['referenced_tweets.id']});
    
    return searchResObj;
  } catch (error) {
    _logger.error(error);
  }
}

//======================================================
//
// 4. トレンドのキーワードのうち、ホームタイムラインでつぶやかれているキーワード一覧を取得
//
//======================================================

/**
 * トレンドのキーワードのうち、ホームタイムラインでつぶやかれているキーワード一覧を取得
 * 　・日本のトレンドのキーワード一覧を取得
 * 　・ホームタイムラインのツイートに含まれているキーワード一覧を返す
 * 
 * @return {array} キーワードの配列
 */
 module.exports.getTrendKeywordsInHomeTimeLine = async function () {
  htTrWords = [];

  try {
    // 日本のトレンドキーワード一覧をセット 
    const allTrWords = await getJPTrendKeywords();
    // タイムラインからツイート取得
    const ht = await _twClient.v1.homeTimeline();

    // トレンドキーワードを走査
    for (trWord of allTrWords) {    
      // 該当キーワードがタイムラインのツイートに含まれれば配列に追加
      if (checkTargetKeywordExistInHomeTimeLine(ht, trWord)) {
        htTrWords.push(trWord);        
      }
    }  
  } catch (error) {
    _logger.error(error);
  }

  return htTrWords;
} 

//======================================================
// トレンドのキーワード一覧を取得
//======================================================

/**
 * トレンドのキーワード一覧を取得
 * 　・日本のトレンドのキーワードを取得
 * 
 * @return {array} キーワードの配列
 */
 async function getJPTrendKeywords() {
  trWords = [];

  try {
    const JAPAN_WOEID = 23424856;

    // トレンド取得
    const trVal = await _twClient.v1.trendsByPlace(JAPAN_WOEID);
    for (tr of trVal[0].trends) {
      trWords.push(tr.name);
    }
  } catch (error) {
    _logger.error(error);
  }

  return trWords;
}

//======================================================
// 対象キーワードがホームタイムラインのツイート内に含まれるかを返す
//======================================================

/**
 * 対象キーワードがホームタイムラインのツイート内に含まれるかを返す
 * 　・TLのツイートを走査
 * 　・フォローしているユーザがRTしたツイートはスキップ（対象ジャンル以外が含まれる可能性があるため）
 * 　・ツイート本文に該当ワードが含まれていればTrue
 * 
 * @param  {Object} ht ホームタイムラインオブジェクト
 * @param  {string} keyword 検索キーワード
 * @return {bool} 
 */
function checkTargetKeywordExistInHomeTimeLine(ht, keyword) {
  try {
    // タイムラインのツイートを走査
    for (const twObj of ht.tweets) {
      // RTされたツイートはスキップ
      if (twObj.retweeted_status) {
        continue;
      }

      // ツイート本文内に該当キーワードが含まれていれば
      if (twObj.full_text.indexOf(keyword) !== -1) {
        console.log('[トレンドが含まれるツイート]' + keyword);
        console.log(twObj.full_text);

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
// 5. 対象ツイートの情報を取得して投稿日時をセット
//
//======================================================

/**
 * 対象ツイートの情報を取得して投稿日時をセット
 * 　・対象ツイートが0件なら終了
 * 　・TwitterAPIでIDをキーにツイート情報を取得
 * 　・取得したデータから各ツイートデータに投稿日時をセット
 * 
 * @param {array} tws Tweetモデルデータの配列
 * @returns {array} Tweetモデルデータの配列
 */
 module.exports.setTweetPostedDates = async function(tws) {
  var twIds = [];

  try {
    // 対象ツイートが0件なら終了
    if (tws.length == 0) {
      return tws;
    }

    // 各ツイートのIDを配列に追加
    for (tw of tws) {
      twIds.push(tw.id_str_in_twitter);
    }

    // 対象IDのデータをAPIで取得
    const res = await _twClient.v2.tweets(twIds, {'tweet.fields': 'created_at'});    
    const tObjs = res.data;
    console.log(tObjs.length + '件のツイートのデータを取得');

    // ツイートを走査。投稿日時をセット
    for (tw of tws) {      
      tw = setTargetTweetPostedDate(tw, tObjs);
    }
  } catch (error) {
    _logger.error(error);
  }

  return tws;
}

//======================================================
// 対象ツイートの投稿日時をセット
//======================================================

/**
 * 対象ツイートの投稿日時をセット
 * 
 * @param {Object} tw Tweetモデルデータ
 * @param {array}  tObjs 
 * @return {Object}
 */
function setTargetTweetPostedDate(tw, tObjs) {
  try {  
    // IDが一致するデータをセット  
    for (tObj of tObjs) {
      if (tw.id_str_in_twitter == tObj.id) {
        tw.posted_date = new Date(tObj.created_at);

        break;
      }
    }
  } catch (error) {
    _logger.error(error);
  }

  return tw;
}

//======================================================
//
// 6. 自分がフォローしているユーザデータを全件取得
//
//======================================================

/**
 * 自分がフォローしているユーザデータを全件取得
 * 　・TwitterAPIで取得したユーザオブジェクトをDB保存用のUserModelに変換して返す
 * 
 * @returns {array}
 */
 module.exports.getMyFollowUserModels = async function() {
  var uModels = [];

  try {
    // 自分のTwitterIDをセット
    await setMyTwitterID();
    // フォロー中のユーザをセット
    const fd = await _twClient.v2.following(_myTwitterID, { "user.fields": ['entities']});    
    const fObjs = fd.data;
    console.log(fObjs.length + '件のフォロー中ユーザのデータを取得');

    // フォローしているユーザを走査
    for (const fObj of fObjs) {
      // Userモデルに変換して配列に追加
      const um = _dbAccessor.getUserModelFromUserObj(fObj);
      uModels.push(um);
    }
  } catch (error) {
    _logger.error(error);
  }

  return uModels
}