# smarthome.js

Nature Remo の家電操作を Web 画面から実施するツールです。

## 起動方法

```bash
npm install
node index.js
```

起動後、`http://localhost:3000` を開いて利用できます。

## ポート変更

`serverConfig.jsonc` の `port` を変更してください。

このプロジェクトでは `jsonc-require.js` で `.jsonc` の `require` フックを登録しているため、`index.js` から `require("./serverConfig.jsonc")` で設定を読み込んでいます。
