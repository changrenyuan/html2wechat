"use client";
import { useState } from "react";

export default function Page() {
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 转换按钮
  const handleConvert = async () => {
    if (!url) return alert("请输入 URL");
    setLoading(true);
    setError("");
    setHtml("");

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (res.ok) {
        setHtml(data.html);
      } else {
        setError(data.error || "转换失败");
      }
    } catch (err: any) {
      setError(err.message || "转换失败");
    } finally {
      setLoading(false);
    }
  };

  // 复制按钮
  const handleCopy = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }),
        }),
      ]);
      alert("已复制到剪贴板，可直接粘贴到公众号！");
    } catch (err) {
      alert("复制失败：" + err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>HTML → 公众号富文本转换</h1>

      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="请输入网页链接"
          style={{ width: 400, padding: 5, marginRight: 10 }}
        />
        <button onClick={handleConvert} disabled={loading}>
          {loading ? "转换中..." : "转换"}
        </button>
        <button onClick={handleCopy} style={{ marginLeft: 10 }}>
          复制
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

      <div
        style={{
          border: "1px solid #ccc",
          padding: 10,
          width: "80%",
          height: 600,
          overflow: "auto",
        }}
      >
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p style={{ color: "#888" }}>预览内容将显示在这里</p>
        )}
      </div>
    </div>
  );
}
