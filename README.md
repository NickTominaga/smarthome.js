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


## Playwrightで家電操作の疑似E2Eテスト

Nature APIをPlaywrightの`route`でモックして、TV・照明・エアコンを含む操作フローを疑似的に検証できます。

```bash
npm install
npx playwright install
npm run test:e2e
```

テストファイル: `tests/e2e/mock-all-appliances.spec.js`


## デモモード（疑似API + 画面キャプチャ）

実APIを使わず、疑似レスポンスで家電一覧を表示するデモモードを追加しています。

- `/demo` にアクセスする（または互換として `?demo=1` でも可）
- デモ画面のキャプチャは、開発時にブラウザや自動化ツール側で取得してください
