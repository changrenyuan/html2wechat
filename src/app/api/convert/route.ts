export const runtime = "edge";

import { load } from "cheerio";
import sanitizeHtml from "sanitize-html";

const templates: Record<string, Record<string, string>> = {
  simple: {
    body: "font-family:Arial,sans-serif;color:#333;line-height:1.8;",
    code: "font-family:Consolas, monospace;background:#f5f5f5;padding:2px 4px;border-radius:3px;",
    pre: "background:#f5f5f5;padding:8px;border-radius:4px;overflow:auto;margin:6px 0;",
    img: "max-width:100%;height:auto;margin:10px 0;"
  },
  clean: {
    body: "font-family:'PingFang SC',Helvetica,Arial,sans-serif;color:#444;line-height:2;background:#fff;",
    code: "font-family:Consolas, monospace;background:#eee;padding:2px 4px;border-radius:3px;",
    pre: "background:#f5f5f5;padding:10px;border-radius:5px;overflow:auto;margin:6px 0;",
    img: "display:block;margin:10px auto;max-width:100%;"
  },
  code: {
    body: "font-family:Arial, sans-serif;color:#333;line-height:1.8;",
    code: "font-family:Consolas, monospace;background:#eee;padding:2px 4px;border-radius:3px;color:#2d2d2d;",
    pre: "background:#2d2d2d;color:#f8f8f2;padding:10px;border-radius:5px;overflow:auto;margin:6px 0;",
    img: "max-width:100%;height:auto;margin:10px 0;"
  }
};

const tagStyles: Record<string, string> = {
  h1: "font-size:24px;font-weight:bold;margin:16px 0;color:#333;",
  h2: "font-size:22px;font-weight:bold;margin:14px 0;color:#333;",
  h3: "font-size:20px;font-weight:bold;margin:12px 0;color:#333;",
  p: "font-size:16px;margin:6px 0;color:#333;line-height:1.8;",
  ul: "padding-left:20px;margin:6px 0;",
  ol: "padding-left:20px;margin:6px 0;",
  li: "margin:4px 0;",
  blockquote: "border-left:4px solid #0078d7;padding-left:12px;color:#555;font-style:italic;margin:10px 0;background:#f3f7fb;"
};

async function convertSingle(url: string, template: string, index: number) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = load(html);
  $("script, iframe, noscript").remove();

  let content = $("article").html() || $("main").html() || $("body").html() || "";
  const $content = load(content);

  const tpl = templates[template] || templates.simple;

  // 内联标签样式
  Object.keys(tagStyles).forEach(tag => {
    $content(tag).each((_, el) => {
      const oldStyle = $content(el).attr("style") || "";
      $content(el).attr("style", oldStyle + tagStyles[tag]);
    });
  });

  // 图片居中
  $content("img").each((_, el) => {
    let src = $content(el).attr("src") || "";
    if (src && !/^https?:\/\//i.test(src)) {
      try { $content(el).attr("src", new URL(src, url).href); } catch {}
    }
    const old = $content(el).attr("style") || "";
    $content(el).attr("style", old + tpl.img);
  });

  // 代码块
  $content("pre").each((i, el) => {
    const old = $content(el).attr("style") || "";
    $content(el).attr("style", old + tpl.pre);
    $content(el).attr("id", `pre-${index}-${i}`);
  });
  $content("code").each((_, el) => {
    const old = $content(el).attr("style") || "";
    $content(el).attr("style", old + tpl.code);
  });

  // 表格优化 + 斑马线
  $content("table").each((_, el) => {
    const old = $content(el).attr("style") || "";
    $content(el).attr("style", old + "border-collapse:collapse;width:100%;margin:10px 0;overflow-x:auto;");
    $content(el)
      .find("th, td")
      .each((_, cell) => {
        const oldCell = $content(cell).attr("style") || "";
        $content(cell).attr("style", oldCell + "border:1px solid #ccc;padding:6px;text-align:left;");
      });
    $content(el)
      .find("tr:nth-child(even)")
      .each((_, tr) => {
        const oldTr = $content(tr).attr("style") || "";
        $content(tr).attr("style", oldTr + "background:#f9f9f9;");
      });
  });

  const cleanHtml = sanitizeHtml($content.html() || "", {
    allowedTags: [
      "p","img","h1","h2","h3","h4","h5","h6",
      "blockquote","strong","em","ul","ol","li","pre","code","section","span","table","thead","tbody","tr","th","td"
    ],
    allowedAttributes: { "*": ["style","colspan","rowspan","src","alt","id"] }
  });

  return `<section style="${tpl.body}">${cleanHtml}</section>`;
}

export async function POST(req: Request) {
  try {
    const { urls, template } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0)
      return new Response("Missing URLs", { status: 400 });

    const results = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const html = await convertSingle(url, template || "simple", i);
        results.push({ url, html });
      } catch (err:any) {
        results.push({ url, error: err.message });
      }
    }

    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
  } catch (err:any) {
    return new Response(JSON.stringify({ error: "转换失败：" + err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
