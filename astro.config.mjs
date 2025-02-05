// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from "sitemap";

import glsl from "vite-plugin-glsl";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [glsl()],
    css: {
      preprocessorOptions: {
        scss: {
          // ここで読み込んだscssのファイル内の変数や関数がastroファイルで使用可能となる
          // →　as * とすることで名前空間なしで呼び出しできる
          additionalData: `
            @use "src/styles/sass/foundation/_index.scss" as *; 
            @use "src/styles/sass/global/_index.scss" as *;
          `,

        }
      }
    }
  },

  // XMLサイトマップの生成
  // site: "https://example.jp",
  // integrations: [sitemap()],
});


// ⭐️「 tsconfig.jsonについて 」
// プロジェクト全体の TypeScript の動作を制御するファイル
// ⭐️モジュール解決(importのパス補完)、ビルド時の設定、JSの動作変更を行う

// {
//   "extends": "astro/tsconfigs/strict",
//   "include": [".astro/types.d.ts", "**/*"], // ファイルのみ型チェックの対象とする
//   "exclude": ["dist"], // このファイルは型チェックの対象外
  
//   "compilerOptions": {
//     // プロジェクトのルート (./) を基準にファイルパスを解決する
//     // →　"src/styles/sass/..." この指定ではastroがsrcを正しく認識できないのでエラーが出る
//     "baseUrl": "."
//   }
// }

