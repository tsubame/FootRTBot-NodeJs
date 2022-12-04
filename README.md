# FootRTBot-NotJs
TwitterBot in Node.js.
100RT以上のサッカー関係のツイートを自動的にRTするBotです。

<h4>Twitterアカウント</h4>
https://twitter.com/foot_rt_bot

<h4>フォルダ構成</h4>
<pre>
etc/
  constants.js 　…　 定数定義用（複数Twitterアカウントで使い回せる値）
  appConfig.js 　…　　　各Twitterアカウント固有の設定定義用
models/
  dbAccessor.js 　…　　　DB操作用のビジネスロジック
  twitterAPIAccessor.js　 … 　TwitterAPI操作用のビジネスロジック
routes/
  tweetController.js　 … 　コントローラ
</pre>
