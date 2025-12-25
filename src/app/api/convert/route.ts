export const runtime = "nodejs";

import { load } from "cheerio";
import sanitizeHtml from "sanitize-html";

// 内联样式映射（公众号安全）
const styleMap: Record<string, string> = {
  h1: "font-size:24px;font-weight:bold;margin:16px 0;color:#333;",
  h2: "font-size:22px;font-weight:bold;margin:14px 0;color:#333;",
  h3: "font-size:20px;font-weight:bold;margin:12px 0;color:#333;",
  h4: "font-size:18px;font-weight:bold;margin:10px 0;color:#333;",
  h5: "font-size:16px;font-weight:bold;margin:8px 0;color:#333;",
  h6: "font-size:14px;font-weight:bold;margin:6px 0;color:#333;",
  p: "font-size:16px;line-height:1.8;margin:6px 0;color:#333;",
  img: "max-width:100%;height:auto;margin:10px 0;",
  blockquote: "border-left:4px solid #ccc;padding-left:10px;color:#666;margin:10px 0;font-style:italic;",
  ul: "padding-left:20px;margin:6px 0;",
  ol: "padding-left:20px;margin:6px 0;",
  li: "margin:4px 0;",
  pre: "background:#f5f5f5;padding:8px;border-radius:4px;overflow:auto;margin:6px 0;",
  code: "font-family:Consolas, monospace;background:#f5f5f5;padding:2px 4px;border-radius:3px;"
};

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return new Response("Missing URL", { status: 400 });

    // 获取网页 HTML
    const res = await fetch(url);
    const html = await res.text();

    const $ = load(html);

    // 删除不安全标签
    $("script, iframe, noscript, style, link").remove();

    // 获取正文区域
    let content = $("article").html() || $("main").html() || $("body").html() || "";

    const $content = load(content);

    // 遍历常用标签，添加内联样式
    Object.keys(styleMap).forEach(tag => {
      $content(tag).each((_, el) => {
        const oldStyle = $content(el).attr("style") || "";
        $content(el).attr("style", oldStyle + styleMap[tag]);
      });
    });

    // 图片绝对路径处理
    $content("img").each((_, el) => {
      let src = $content(el).attr("src") || "";
      if (src && !/^https?:\/\//i.test(src)) {
        try {
          const absolute = new URL(src, url).href;
          $content(el).attr("src", absolute);
        } catch {}
      }
    });

    // sanitize 保证公众号安全
    const cleanHtml = sanitizeHtml($content.html() || "", {
      allowedTags: [
        "p","img","h1","h2","h3","h4","h5","h6",
        "blockquote","strong","em","ul","ol","li","pre","code","section"
      ],
      allowedAttributes: {
        img: ["src","alt","style"],
        "*": ["style"]
      }
    });

    // 返回完整 HTML
    return new Response(
      JSON.stringify({
        html: `<section style="font-family:Arial, sans-serif;">${cleanHtml}</section>`
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "转换失败：" + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
