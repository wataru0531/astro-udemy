
// microCMSのapi

// OT4OMLQHIX1UlgbtfsAwZzFTP1TICuNzFQHT
// https://blog-tanimako.microcms.io/settings
// →　serviceDomainは、blog-tanimako

import { createClient } from "microcms-js-sdk";
import type { MicroCMSQueries, MicroCMSListContent } from "microcms-js-sdk";

type MicroCMSImage = {
  url: string
  height: number
  width: number
}

export type BlogType = {
  // id: string
  // createdAt: string
  // updatedAt: string
  // publishedAt: string
  // revisedAt: string
  // → このプロパティは API のレスポンスに必ず含まれる → MicroCMSListContent を&で追加

  title: string
  slug: string
  category: string[]
  content: string
  thumbnail: MicroCMSImage
  date: string
} & MicroCMSListContent;
// ⭐️ & MicroCMSListContent を使う理由
// → BlogType型に microCMS のリストAPIが自動で返す共通のプロパティを追加する
// 　例えば、id、createdAtなど

const client = createClient({
  // import.meta.env → 環境変数へアクセスする
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY
});

// 全記事取得
export const getBlogs = async (queries?: MicroCMSQueries) => {
  // fields は、microCMS API から取得するプロパティを指定して、不要なデータの取得を省くためのオプション 
  const data = await client.getList<BlogType>({ 
    endpoint: "blogs", 
    queries: queries,
  });
  // console.log(data); // {contents: [{id: ..., createdAt: ..., }, {...}] }

  return data;
}

// 詳細ページ取得
export const getBlogDetail = async (contentId: string, queries?: MicroCMSQueries) => {
  const data = await client.getListDetail<BlogType>({
    endpoint: "blogs",
    contentId: contentId,
    queries: queries
  })

  return data;
}

