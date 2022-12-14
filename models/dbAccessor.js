//======================================================
//
// DB操作用モジュール
//
// [必要ライブラリ]
//  ・prisma
//  ・log4js
//
// [索引]
//  □ 1-1. TwitterAPIから取得したTweetObjectをDB保存用のTweetモデルに変換
//  □ 1-2. TwitterAPIから取得したTweet検索結果オブジェクトをDB保存用のTweetモデルに変換
//  □ 2.   対象ツイートがDB保存済かを返す
//  □ 3.   対象ツイートデータをDBに保存
//
//======================================================

//======================================================
// require設定
//======================================================

// 定数
const _constants = require('../etc/constants');

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
 * 　・RTの場合、RT数以外はretweeted_statusの値で各種値を上書き
 * 
 * @param {Object} twObj
 * @return {Object} 
 */
module.exports.getTweetModelFromTweetObj = function(twObj) {
  var d = {}

  try {
    // ツイートをセット
    var st = twObj;
    // RTの場合、retweeted_statusをセット
    if (twObj.retweeted_status) {
      st = twObj.retweeted_status;
    }

    d = {
      'id_str_in_twitter': st.id_str,
      'user_name':         st.user.name,
      'user_screen_name':  st.user.screen_name,
      'tweet_text':        st.full_text,
      'rt_count':          twObj.retweet_count,      
      'client_name':       st.source,
      'posted_date':       new Date(st.created_at)
    }
  } catch (error) {
    _logger.error(error);
  }    

  return d;
}

//======================================================
//
// 1-2. TwitterAPIから取得したTweet検索結果オブジェクトをDB保存用のTweetモデルに変換
//
//======================================================

/**
 * APIのTweet検索結果オブジェクトをDB保存用のTweetモデルに変換
 * 　・RTの場合、IDをRT対象に書き換える
 * 
 * @param {Object} sObj
 * @return {Object} 
 */
 module.exports.getTweetModelFromTweetSearchObj = function(sObj) {
  var d = {}

  try {
    d = {
      'id_str_in_twitter':  sObj.id,
      'user_name':          '',
      'user_screen_name':   '',
      'tweet_text':         sObj.text,
      'client_name':        sObj.source,      
      'rt_count':           sObj.public_metrics.retweet_count,
      'posted_date':        new Date(sObj.created_at)
    }

    // RTはID書き換え
    if (sObj['referenced_tweets']) {
      d.id_str_in_twitter = sObj['referenced_tweets'][0]['id'];
    }    
  } catch (error) {
    _logger.error(error);
  }    

  return d;
}

//======================================================
//
// 2. 対象ツイートがDB保存済かを返す
//
//======================================================

/**
 * 対象ツイートがDB保存済かを返す
 * 
 * @param {Object} tw 
 * @return {array}
 */
 module.exports.isTargetTweetAlreadySaved = async function(tw) { 
  try {
    // DBのデータを取得
    const res = await _prismaClient.tweet.findFirst({
      where: {
        id_str_in_twitter: tw.id_str_in_twitter,
      },
    });    
    
    // 結果があればtrue;
    if (res) {
      return true;
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
 * @param {array} tModels 
 */
 module.exports.saveTweetDatas = async function(tws) {
  try {
    for (d of tws) {
      await _prismaClient.tweet.create({
        data: {
          'id_str_in_twitter':     d.id_str_in_twitter,
          'user_name':             d.user_name,
          'user_screen_name':      d.user_screen_name,
          'tweet_text':            d.tweet_text,
          'rt_count':              d.rt_count,      
          'client_name':           d.client_name,               
          'posted_date':           d.posted_date,          
        }
      })
    }
  } catch (error) {
    _logger.error(error);
  }    
}




/*
//======================================================
//
// 10. テスト用
//
//======================================================

/**
 * テスト用
 * 
 * @param {array} tUModels 
 *
 module.exports.sample = async function() {
  try {
    const MAX_FETCH_COUNT = 1000
    // DBのデータを取得
    const savedUModels = await _prismaClient.followCandidateUser.findMany();    
    const tws = await _prismaClient.tweet.findMany();    
    //console.log('DB保存済のフォロー候補データを取得: ' + ds.length + '件');
  } catch (error) {
    _logger.error(error);
  }    
}
//======================================================
//
// 1-2. TwitterAPIから取得したUserObjectをDB保存用のFollowCandidateUserモデルに変換
//
//======================================================

/**
 * TwitterAPIから取得したUserObjectをDB保存用のFollowCandidateUserモデルに変換
 * 
 * @param {Object} uObj
 * @return {Object} 
 *
 module.exports.getFollowCandidateUserModelFromUserObj = function(uObj) {
  var d = {}

  try {
    d = {
      'user_name': uObj.name,
      'user_screen_name':  uObj.username,
    }
  } catch (error) {
    _logger.error(error);
  }    

  return d;
}


//======================================================
//
// 1-4. TweetモデルをDB保存用のUserモデルに変換
//
//======================================================

/**
 * TweetモデルをDB保存用のUserモデルに変換
 * 
 * @param {Object} tObj
 * @return {Object} 
 *
 module.exports.getUserModelFromTweetModel = function(tObj) {
  var d = {}

  try {
    d = {
      'user_name': tObj.user_name,
      'user_screen_name':  tObj.user_screen_name,
    }
  } catch (error) {
    _logger.error(error);
  }    

  return d;
}

//======================================================
//
// 2-2. 対象ユーザデータのうち、DB未保存のユーザデータを返す
//
//======================================================

/**
 * 対象ユーザデータのうち、DB未保存のユーザデータを返す
 * 
 * @param {array} tUModels 
 * @return {array}
 *
 module.exports.getNotDBSavedUserModels = async function(targetUModels) {
  var notDBSavedUserModels = [];

  try {
    const MAX_FETCH_COUNT = 1000
    // DBのデータを取得
    const savedUModels = await _prismaClient.user.findMany({'orderBy': {'id': 'desc'}, 'take': MAX_FETCH_COUNT});    
    console.log('DB保存済のデータを取得: ' + savedUModels.length + '件');

    // 対象ツイートを走査
    for (um of targetUModels) {
      // DB未保存なら配列に追加
      if (!checkTargetUserAlreadyDBSaved(savedUModels, um)) {
        notDBSavedUserModels.push(um);
      }
    }
  } catch (error) {
    _logger.error(error);
  }    

  return notDBSavedUserModels;
}

//======================================================
// 対象ユーザがDB保存済かを返す
//======================================================

/**
 * 対象ユーザがDB保存済かを返す
 * 
 * @param {array}  savedUModels 
 * @param {Object} tuModel 
 * @returns 
 *
 function checkTargetUserAlreadyDBSaved(savedUModels, tuModel) {
  try {
    for (um of savedUModels) {
      if (um.user_screen_name == tuModel.user_screen_name) {
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
// 3-2. 対象フォロー候補ユーザデータをDBに保存
//
//======================================================

/**
 * 対象フォロー候補ユーザデータをDBに保存
 * 
 * @param {array} targetFCModels 
 *
 module.exports.saveFollowCandidateModels = async function(targetFCModels) {
  try {
    // DB保存済のフォロー候補をセット
    const savedFCModels = await _prismaClient.followCandidate.findMany({});

    // 今回のフォロー候補を走査
    for (fm of targetFCModels) {
      // DB保存済ならスキップ
      if (checkTargetFCAlreadyDBSaved(savedFCModels, tfm)) {
        continue;
      }

      // DB保存
      await _prismaClient.followCandidate.create({
        data: {
          'user_name':        fm.user_name,
          'user_screen_name': fm.user_screen_name,
        }
      })
    }
  } catch (error) {
    _logger.error(error);
  }    
}

/**
 * 対象のフォロー候補をDBに保存済みかを返す
 * 
 * @param {*} savedFCModels 
 * @param {*} tfm 
 *
function checkTargetFCAlreadyDBSaved(savedFCModels, tfm) {
  try {
    for (fm of savedFCModels) {
      if (fm.user_screen_name == tfm.user_screen_name) {
        return true;
      }
    }
  } catch (error) {
    _logger.error(error);
  }    

  return false;
}

*/