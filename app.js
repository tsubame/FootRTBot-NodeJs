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
var indexRouter   = require('./routes/index');
var usersRouter   = require('./routes/users');

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

/*
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
*/

/*
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
*/

module.exports = app;
