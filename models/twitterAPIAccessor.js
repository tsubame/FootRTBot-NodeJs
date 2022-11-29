//======================================================
//
// TwitterAPI操作用モジュール
//
// [必要ライブラリ]
//  ・twitter-api-v2
//  ・log4js
//
// [索引]
//    □ 1-1. ホームタイムラインのツイートを200件分取得
//    □ 1-2. ホームタイムラインから一定のRT数以上のツイートを取得
//    □ 2.   複数件のツイートをRT
//    □ 3.   対象キーワードで検索を実行し、一定のRT以上のツイートIDのリストを返す　
//    □ 4.   トレンドのキーワードのうち、ホームタイムラインでつぶやかれているキーワード一覧を取得
//    □ 5.   自分がフォローしているユーザのIDを全件取得
//
//======================================================

//======================================================
// モジュール読込
//======================================================

// 定数
const _constants = require('../etc/const');

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
// 1-1. ホームタイムラインのツイートを200件分取得
//
//======================================================

/**
 * ホームタイムラインのツイートを200件分取得
 * 
 * @param {boolean} includeRTTweet RTされたツイートを含めるか
 * @return {array} 
 */
module.exports.getTweetModelsFromTimeLine = async function(includeRTTweet) {
  var tws = [];

  try {    
    // タイムラインからツイート取得
    const homeTimeline = await _twClient.v1.homeTimeline({'count': _constants.TWEET_GET_COUNT_FROM_TL});
    console.log(homeTimeline.tweets.length, 'fetched.');
    
    // ツイートを走査
    for (const tObj of homeTimeline.tweets) {
      // RTはスキップ
      if (tObj.retweeted_status) {
        if (!includeRTTweet) {
          continue;
        }
      }

      // APIのツイートデータをDB保存用のツイートデータに変換
      const tw = _dbAccessor.getTweetModelFromTweetObj(tObj);
      // 配列に追加
      tws.push(tw);
    }
  } catch (error) {
    _logger.error(error);
  }  

  return tws;
}

//======================================================
//
// 1-2. ホームタイムラインから一定のRT数以上のツイートを取得
//
//======================================================

/**
 * ホームタイムラインから一定のRT数以上のツイートを取得
 * 　・タイムラインから200件分のツイートを取得
 * 　・RT数が一定のものをDB保存用のTweetModelに変換し、配列に格納して返す
 * 
 * @param {function} callback
 * @return {array} TweetModelの配列
 */
module.exports.getManyRTTweetsFromTimeLine = async function(callback) {
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
 *   ・自分のTwitterIDをセット
 *  ・対象ツイートの件数、RT実行
 * 
 * @param {array} twModels RT対象のツイートのモデルの配列
 */
module.exports.retweetTargetTweets = async function(twModels) {
  try {
    // 自分のTwitterIDをセット
    await setMyTwitterID();
    
    // 各ツイートをRT
    for (const d of twModels) {      
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
 * 
 * @param {string} q 
 * @returns 
 */
 module.exports.getManyRTTweetsBySearch = async function(q) {
  var tweets = [];
  var savedTweetIds = [];

  try {
    // 検索実行
    const searchResObj = await getSearchResultObj(q);

    // 検索結果のツイートを走査
    for (const twObj of searchResObj._realData.data) {
      // APIの検索結果をTweetモデルに変換
      const tw = _dbAccessor.getTweetModelFromTweetSearchObj(twObj);      
      // 配列に保存済ならスキップ
      if (savedTweetIds.indexOf(tw.id_str_in_twitter) !== -1) {
        continue;
      }

      // テキストにキーワードが含まれていなければスキップ
      if (tw.tweet_text.indexOf(q) === -1) {
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
// 検索結果のオブジェクトを取得
//======================================================

/**
 * 検索結果のオブジェクトを取得
 * 
 * @param {string} q 
 * @returns 
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
    
    // 開始時刻をセット
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
 * @param  callback 
 * @return htTrWords
 */
 module.exports.getTrendKeywordsInHomeTimeLine = async function (callback) {
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
 * @return {array}
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
 * 　・RTされたツイートはスキップ
 * 
 * @param  {Object} ht 
 * @param  {string} keyword 
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
 * 　・TwitterAPIでIDをキーにツイート情報を取得し、投稿日時をセット
 * 
 * @param {array} tws
 * @returns {array}
 */
 module.exports.setTweetPostedDates = async function(tws) {
  var twIds = [];

  try {
    if (tws.length == 0) {
      return tws;
    }

    // IDを配列に追加
    for (tw of tws) {
      twIds.push(tw.id_str_in_twitter);
    }

    // 対象IDのデータを取得
    const res = await _twClient.v2.tweets(twIds, {'tweet.fields': 'created_at'});    
    const tObjs = res.data;
    console.log(tObjs.length + '件のツイートのデータを取得');
    //console.log(tObjs);

    // ツイートを走査。IDをセット
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
 * @param {Object} tw 
 * @param {array} tObjs 
 * @return {Object}
 */
function setTargetTweetPostedDate(tw, tObjs) {
  try {  
    // IDが一致するデータをセット  
    for (tObj of tObjs) {
      if (tw.id_str_in_twitter == tObj.id) {
        tw.posted_date = new Date(tObj.created_at);
        //tw.client_name = tObj.source;
        //console.log('[日付をセット]' + tw.posted_date);
        //console.log('[クライアントをセット]' + tw.client_name);

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