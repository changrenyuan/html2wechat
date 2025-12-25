# Web2WeChat

Convert web articles into WeChat Official Account compatible rich text.

## ✨ What is this?

Web2WeChat is a tool that converts a web article URL into **WeChat Official Account editor compatible HTML**, allowing you to copy and paste the content directly into the WeChat editor without losing styles.

## 🚀 Features

- Input a web page URL
- Automatically extract main article content
- Convert content into WeChat-safe HTML
- Preview rendered result
- One-click copy for WeChat editor

## 🧠 How it works

1. Fetch the HTML content from the given URL
2. Extract main article content
3. Remove unsupported tags and styles
4. Rebuild layout using WeChat-compatible inline styles
5. Return sanitized HTML for copying

## 🛠 Tech Stack

### Frontend

- Next.js
- React
- Cloudflare Pages

### Backend

- Next.js API Routes (Serverless)
- Fetch + DOM parsing
- HTML sanitization

## 📦 Project Structure
```
├─ app/
│ ├─ page.tsx # Main UI
│ └─ api/
│ └─ convert/
│ └─ route.ts # Conversion API
├─ lib/
│ ├─ extract.ts # Article extraction
│ ├─ sanitize.ts # HTML sanitization
│ └─ template.ts # WeChat HTML templates
├─ public/
└─ README.md
```
## ⚠️ Limitations

- Complex layouts (grid, flex, cards) are not supported
- JavaScript and animations are removed
- Only WeChat-supported HTML tags are preserved

## 📌 Roadmap

- [ ] Basic URL to WeChat HTML conversion
- [ ] Preview panel
- [ ] Theme templates
- [ ] Browser extension
- [ ] Batch processing

## 📄 License

MIT
