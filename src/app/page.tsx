"use client";
import { useState } from "react";

export default function Page() {
  const [urls, setUrls] = useState("");
  const [template, setTemplate] = useState("simple");
  const [results, setResults] = useState<{url:string, html?:string, error?:string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!urls) return alert("请输入至少一个 URL");
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urls.split("\n").map(u => u.trim()).filter(u=>u), template }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err:any) {
      alert(err.message || "转换失败");
    } finally { setLoading(false); }
  };

  const handleCopyHtml = async (html: string) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }),
        }),
      ]);
      alert("已复制到剪贴板，可直接粘贴到公众号！");
    } catch (err) { alert("复制失败：" + err); }
  };

  const handleCopyCode = async (id: string) => {
    const codeEl = document.querySelector<HTMLPreElement>(`#${id}`);
    if (!codeEl) return;
    await navigator.clipboard.writeText(codeEl.innerText);
    alert("代码已复制！");
  };

  return (
    <div style={{ padding:20 }}>
      <h1>批量 HTML → 公众号富文本转换</h1>

      <textarea
        value={urls}
        onChange={e=>setUrls(e.target.value)}
        placeholder="每行一个网页 URL"
        rows={6}
        style={{ width:"100%", marginBottom:10 }}
      />

      <div style={{ marginBottom:10 }}>
        <select value={template} onChange={e=>setTemplate(e.target.value)}>
          <option value="simple">简约</option>
          <option value="clean">清爽</option>
          <option value="code">代码高亮</option>
        </select>
        <button onClick={handleConvert} disabled={loading} style={{ marginLeft:10 }}>
          {loading?"转换中...":"转换"}
        </button>
      </div>

      {results.map((r,i)=>(
        <div key={r.url} style={{ border:"1px solid #ccc", marginBottom:10, padding:10 }}>
          <div style={{ fontWeight:"bold", marginBottom:5 }}>{r.url}</div>
          {r.error ? <div style={{ color:"red" }}>{r.error}</div> : (
            <>
              <div style={{ position:"relative" }}>
                <div style={{ maxHeight:400, overflow:"auto", border:"1px solid #eee", padding:5, background:"#fff" }}
                  dangerouslySetInnerHTML={{ __html: r.html! }}
                />
              </div>
              <button onClick={()=>handleCopyHtml(r.html!)} style={{ marginTop:5 }}>复制整篇</button>

              {/* 扫描所有 pre id 并生成复制按钮 */}
              {Array.from({length:50}).map((_,j)=>(
                <button key={j} onClick={()=>handleCopyCode(`pre-${i}-${j}`)} style={{marginLeft:5,marginTop:5}}>
                  复制代码块 {j+1}
                </button>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
