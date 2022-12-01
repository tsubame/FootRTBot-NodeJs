//======================================================
//
// Express設定記述用モジュール
//
//======================================================

//======================================================
// Express必須設定
//======================================================

var createError   = require('http-errors');
var express       = require('express');
var path          = require('path');
var cookieParser  = require('cookie-parser');
var logger        = require('morgan');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//======================================================
// require設定
//======================================================

// ツイート処理用コントローラ
var _twController = require('./routes/tweetController');

//======================================================
// エクスポート
//======================================================

// エクスポート
module.exports = app;


//======================================================
//
// 1. ルーティング設定
//
//======================================================

//　タイムラインからのRT処理
app.get('/timeline', _twController.retweetFromHomeTimeLine);

//　トレンドからのRT処理
app.get('/trend', _twController.retweetFromTrendWord);

//　検索からのRT処理
app.get('/search', _twController.retweetFromTargetSearchWords);

//　サンプル処理
app.get('/sample', _twController.sample);



