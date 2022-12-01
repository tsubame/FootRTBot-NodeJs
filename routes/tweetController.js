//======================================================
//
// ツイート用コントローラモジュール
//
// [必要ライブラリ]
//  ・log4js
//
// [索引]
//    □ 1-1. タイムライン上の一定数以上のツイートをRT
//    □ 1-2. トレンド内の対象ジャンルのキーワードを検索し、一定数以上のツイートをRT
//    □ 1-3. 特定のキーワードを検索し、一定数以上のツイートをRT
//
//======================================================

//======================================================
// require設定
//======================================================

// 定数
const _constants  = require('../etc/constants');

// log4js
const _log4js     = require('log4js');

// Twitter操作用モデル
const _twAccessor = require('../models/twitterAPIAccessor');

// DB操作用
const _dbAccessor = require('../models/dbAccessor');


//======================================================
// 変数宣言
//======================================================

// ロギング用設定
_log4js.configure(_constants.LOG4JS_CONFIG_VALS_DICT);

// ロギング用
const _logger = _log4js.getLogger();


//======================================================
//
// 1-1. タイムライン上の一定数以上のツイートをRT
//
//======================================================

/**
 * タイムライン上の一定数以上のツイートをRT
 *   ・タイムライン上から一定以上のRTのツイートを取得
 *   ・RT数の多いツイートのうち、RT対象のツイートをセット（DB未保存、投稿日時が一定時間以内）
 *   ・RT実行
 *   ・RTしたツイートをDB登録
 *   ・RTしたツイートのうち、未フォローのユーザをDBに保存
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
module.exports.retweetFromHomeTimeLine = async function(req, res) {
  try {
    // ホームタイムライン上から一定数以上のRTのツイートを取得
    var manyRTTweets = await _twAccessor.getManyRTTweetsFromTimeLine();
    console.log('TL内のRT数の多いツイート：' + manyRTTweets.length);

    // RT対象のツイートをセット
    const rtTargetTweets = await getRTTargetTweets(manyRTTweets);
    console.log('RT対象のツイート：' + rtTargetTweets.length);

    // RT実行
    _twAccessor.retweetTargetTweets(rtTargetTweets);
    // RTしたツイートをDB登録
    _dbAccessor.saveTweetDatas(rtTargetTweets);    

    // RTしたツイートのうち、未フォローのユーザをDBに保存
    //saveNotFollowUserInRTTweetsToDB(newManyRTTweetModels);
  } catch (error) {
    _logger.error(error);
  }

  // 結果を描画
  res.send("done.");  
}

//======================================================
// RT対象のツイートを返す
//======================================================

/**
 * RT対象のツイートを配列で返す
 * 　・DB未保存（未RT）
 * 　・投稿日時が一定時間以内
 * 　・NGワードを含まない
 * 
 * @param {array} tws 
 * @returns {array}
 */
async function getRTTargetTweets(tws) {
  var rtTargetTweets = [];

  try {
    // ツイートを走査
    for (tw of tws) {
      // DB保存済ならスキップ
      const isDBSaved = await _dbAccessor.isTargetTweetAlreadySaved(tw);
      if (isDBSaved) {        
        continue;
      }
      // 投稿日時が一定時間以前ならスキップ
      if (!checkPostedDateWithInTargetHours(tw)) {
        continue;
      }
      // NGワードを含めばスキップ
      if (checkTargetTweetContainsNGWord(tw)) {
        continue;
      }

      // 配列に追加
      rtTargetTweets.push(tw);
    }
  } catch (error) {
    _logger.error(error);
  }

  return rtTargetTweets;
}

/**
 * 投稿日時が一定時間以内かを返す
 * 
 * @param {Object} tw 
 * @returns 
 */
function checkPostedDateWithInTargetHours(tw) {
  try {
    // 24時間前をセット    
    var tdt = new Date();
    tdt.setHours(tdt.getHours() - _constants.SKIP_PAST_HOUR);

    // それ以降ならTrue
    if (tdt <= tw.posted_date) {
      return true
    } 
  } catch (error) {
    _logger.error(error);
  }

  return false;
}

/**
 * 対象のツイートがNGワードを含むかを返す
 *  ・本文、またはクライアント名に含めばTrue
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
      if (tw.client_name.indexOf(ngWord) !== -1) {
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
 *   ・日本のトレンドのキーワードのうち、TLのツイート内に含まれるキーワードをピックアップ
 *   ・それぞれを検索し、RT数の多いツイートを取得
 *   ・RT数の多いツイートのうち、RT対象をピックアップ（DB未保存、投稿日時が一定時間以内）
 *   ・RTしたツイートをDB登録
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
      _logger.debug('トレンド内の対象ジャンル関連キーワード' + tWord);

      // 検索結果からRTの多いツイートを取得
      var manyRTTweets = await _twAccessor.getManyRTTweetsBySearch(tWord);
      // 投稿日時をセット
      manyRTTweets = await _twAccessor.setTweetPostedDates(manyRTTweets);
      // RT対象のツイートをセット
      const rtTargetTweets = await getRTTargetTweets(manyRTTweets);
      // 0件ならスキップ
      if (rtTargetTweets.length == 0) {
        continue;
      }

      // ロギング
      _logger.debug('[トレンドキーワード ' + tWord + ' から取得したRT対象のツイート] ' + rtTargetTweets.length + '件');
      // RT実行
      _twAccessor.retweetTargetTweets(rtTargetTweets);
      // RTしたツイートをDB登録
      _dbAccessor.saveTweetDatas(rtTargetTweets);          
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
 *   ・定数で設定されたキーワードを検索し、RT数の多いツイートをRT
 *  ・NGワードを含むツイートはRTしない
 *   ・RTしたツイートをDB登録
 *   ・RTしたツイートのうち、未フォローのユーザをDBに保存
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
module.exports.retweetFromTargetSearchWords = async function(req, res) {
  try {
    // 対象のキーワードを走査
    for (tWord of _constants.SEARCH_TARGET_KEYWORDS) {
      // 対象のキーワードで検索し、RT数の多いツイートをセット
      var manyRTTweets = await _twAccessor.getManyRTTweetsBySearch(tWord);
      // 投稿日時をセット
      manyRTTweets = await _twAccessor.setTweetPostedDates(manyRTTweets);
      // RT対象のツイートをセット
      const rtTargetTweets = await getRTTargetTweets(manyRTTweets);    
      // 0件ならスキップ
      if (rtTargetTweets.length == 0) {
        continue;
      }

      // ロギング
      _logger.debug('[検索キーワード' + tWord + 'から取得したRT対象のツイート] ' + rtTargetTweets.length + '件');

      // RT実行
      _twAccessor.retweetTargetTweets(rtTargetTweets);
      // RTしたツイートをDB登録
      _dbAccessor.saveTweetDatas(rtTargetTweets);     
    }         
  } catch (error) {
    _logger.error(error);
  }

  // 結果を描画
  res.send("done.");  
}






//======================================================
//
// 10. サンプル用処理
//
//======================================================

/**
 * サンプル用処理
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
 module.exports.sample = async function(req, res) {
  var rtTargetTweets = [];

  try {
    // 対象のキーワードを走査
    for (tWord of _constants.SEARCH_TARGET_KEYWORDS) {
      // 対象のキーワードで検索し、RT数の多いツイートをセット
      const searchedManyRTTweets = await _twAccessor.getManyRTTweetsBySearch(tWord);

      break;
    }

    /*
    // RT実行
    _twAccessor.retweetTargetTweets(rtTargetTweets);
    // RTしたツイートをDB登録
    _dbAccessor.saveTweetDatas(rtTargetTweets);              
    */
  } catch (error) {
    _logger.error(error);
  }

  // 結果を描画
  res.send("done.");  
}


/*
//======================================================
// RTしたツイートのうち、未フォローのユーザをDBに保存
//======================================================


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
 *
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
*/