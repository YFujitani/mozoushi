デプロイメモ

ポート番号を変える場合　app.js 20行目あたり
app.set('port', process.env.PORT || 3001);　<- ココの数値を書きかえます。


