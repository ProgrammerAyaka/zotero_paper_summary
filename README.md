# Zotero Paper Summary 

**让 AI 助你一秒读懂论文 —— 为 Zotero 7 量身定制的智能摘要插件。**

[![Version](https://img.shields.io/badge/Version-v1.1.2-blue.svg)](https://github.com/ProgrammerAyaka/zotero_paper_summary/releases)
[![Zotero](https://img.shields.io/badge/Zotero-7%2B-red.svg)](https://www.zotero.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 功能亮点

- **一键总结**：右键点击文献条目即可触发，无需手动复制粘贴。
- **智能提取**：深度集成 Zotero 7 内置 PDF 解析引擎，精准提取全文核心文本。
- **双模驱动**：支持 **DeepSeek** 与 **Google Gemini**，自由切换顶尖大模型。
- **自动归档**：生成的中文摘要将以「子便签」形式自动附加在文献下方，方便检索与回顾。
- **纯净安全**：API Key 本地存储，代码完全开源，不经过任何中转服务器。

---

## 技术实现

本插件基于 **Zotero 7 Bootstrapped** 架构开发，具备原生级别的响应速度与稳定性：

- **核心架构**：纯 JavaScript 开发，遵循 Zotero 7 无需构建工具的插件规范。
- **PDF 文本提取**：
  - 首选：`Zotero.PDFWorker.getFullText(itemID)` (内置单例 Worker)
  - 降级链：`Zotero.PDF.getText()` → `Zotero.Fulltext.getIndexableContentAsync()` → 命令行 `pdftotext`
- **UI 交互**：通过 `addMenuItem` 动态注入 `zotero-itemmenu` 菜单，符合 XUL 规范。
- **网络层**：利用浏览器原生 `fetch` API，异步调用大模型接口，不阻塞主界面。
- **持久化**：使用 `new Zotero.Item('note')` 实现结果的结构化存储。

---

## 🤖 支持模型

| 模型名称 | 提供商 | 获取 API Key |
| :--- | :--- | :--- |
| **DeepSeek** | 深度求索 (DeepSeek) | [platform.deepseek.com](https://platform.deepseek.com) |
| **Gemini** | Google AI | [aistudio.google.com](https://aistudio.google.com) |

---

## 🚀 安装与使用

### 1. 安装插件
1. 前往 [Releases](https://github.com/ProgrammerAyaka/zotero_paper_summary/releases) 下载最新的 `.xpi` 文件。
2. 打开 Zotero 7，点击菜单栏 `工具` -> `插件`。
3. 点击右上角齿轮图标，选择 `Install Add-on From File...`，选择下载的 `.xpi` 文件。

### 2. 配置 AI
1. 进入 `工具` -> `插件设置` -> `AI Summary` 面板。
2. 填入您的 **DeepSeek API Key** 或 **Gemini API Key**。
3. 选择您偏好的默认模型并保存。

### 3. 开始总结
1. 在 Zotero 文献列表中，右键点击一篇带有 PDF 附件的文献。
2. 在弹出菜单中选择 **「🤖 AI 总结论文」**。
3. 等待约 10-30 秒，一个包含论文核心要点的子便签将出现在该条目下方。

---

## 项目结构

```text
├── manifest.json          # 插件元数据（Zotero 7 规范）
├── bootstrap.js           # 插件主逻辑（启动/关闭/菜单/PDF提取/LLM调用）
├── prefs.js               # 默认偏好项配置
└── prefs/
    └── preferences.xhtml  # 插件设置面板 UI 界面
```

---

## ⚠️ 注意事项

- **版本限制**：仅支持 Zotero 7，不兼容 Zotero 6 及旧版本。
- **文本限制**：由于 API 上下文及提取效率考虑，目前默认提取 PDF 前 10000 个字符。
- **本地要求**：PDF 附件必须已下载到本地。如果附件仅为网络链接（Link），将无法提取文本。
- **首次使用**：对于新导入的 PDF，建议先双击打开一次，确保 Zotero 已完成基础索引后再使用总结功能。

---

## 贡献指南

我们欢迎任何形式的贡献！
- **提交 Bug**：请通过 GitHub Issues 反馈遇到的问题。
- **功能建议**：如果您有更好的 Prompt 或功能想法，请开启 Discussion。
- **代码贡献**：欢迎提交 Pull Request，请确保代码符合现有的 JS 编写规范。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议开源。

Copyright (c) 2026 **ProgrammerAyaka**


