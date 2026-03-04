function log(msg) {
    Zotero.debug("Zotero AI Summary: " + msg);
}

function install() {
    log("Installed");
}

function uninstall() {
    log("Uninstalled");
}

function startup({ id, version, rootURI }) {
    log("Starting up");
    Zotero.PreferencePanes.register({
        pluginID: 'zotero-ai-summary@ProgrammerAyaka.github.io',
        src: rootURI + 'prefs/preferences.xhtml'
    });
    
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
        if (!win.ZoteroPane) continue;
        addMenuItem(win);
    }
}

function shutdown() {
    log("Shutting down");
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
        if (!win.ZoteroPane) continue;
        removeMenuItem(win);
    }
}

function onMainWindowLoad({ window }) {
    log("Main window loaded");
    addMenuItem(window);
}

function onMainWindowUnload({ window }) {
    log("Main window unloaded");
    removeMenuItem(window);
}

function addMenuItem(window) {
    const doc = window.document;
    const itemMenu = doc.getElementById('zotero-itemmenu');
    if (!itemMenu) return;

    if (doc.getElementById('zotero-ai-summary-menuitem')) {
        return;
    }

    let menuItem;
    if (doc.createXULElement) {
        menuItem = doc.createXULElement('menuitem');
    } else {
        menuItem = doc.createElement('menuitem');
    }
    
    menuItem.setAttribute('id', 'zotero-ai-summary-menuitem');
    menuItem.setAttribute('label', '🤖 AI 总结论文');
    menuItem.addEventListener('command', () => handleMenuClick(window), false);
    
    itemMenu.appendChild(menuItem);
}

function removeMenuItem(window) {
    const doc = window.document;
    const menuItem = doc.getElementById('zotero-ai-summary-menuitem');
    if (menuItem) {
        menuItem.remove();
    }
}

async function handleMenuClick(window) {
    const items = window.ZoteroPane.getSelectedItems();
    if (items.length === 0) {
        window.alert("请先选择一篇文献！");
        return;
    }

    const item = items[0];
    if (!item.isRegularItem()) {
        window.alert("请选择常规文献条目！");
        return;
    }

    const attachmentIDs = item.getAttachments();
    let pdfItem = null;
    for (let id of attachmentIDs) {
        let attachment = Zotero.Items.get(id);
        if (attachment.attachmentContentType === 'application/pdf') {
            pdfItem = attachment;
            break;
        }
    }

    if (!pdfItem) {
        window.alert("该文献没有 PDF 附件！");
        return;
    }

    window.alert("正在提取 PDF 文本并请求大模型，这可能需要一点时间...");

    let textContent = "";
    try {
        let file = await pdfItem.getFilePathAsync();
        
        if (Zotero.PDFWorker) {
            try {
                let { text } = await Zotero.PDFWorker.getFullText(pdfItem.id);
                if (text) textContent = text;
            } catch (e) {
                log("PDFWorker extraction failed: " + e.message);
            }
        }
        
        if (!textContent && Zotero.PDF) {
            try {
                textContent = await Zotero.PDF.getText(file);
            } catch (e) {}
        }
        
        if (!textContent && Zotero.Fulltext && typeof Zotero.Fulltext.getIndexableContentAsync === 'function') {
            try {
                let content = await Zotero.Fulltext.getIndexableContentAsync(pdfItem);
                if (content && content.text) {
                    textContent = content.text;
                }
            } catch(e) {}
        }
        
        if (!textContent && Zotero.Fulltext && Zotero.Fulltext.pdfToTextPath) {
            try {
                let pdftotextParams = ["-enc", "UTF-8", "-nopgbrk", file, "-"];
                let out = await Zotero.Utilities.Internal.exec(Zotero.Fulltext.pdfToTextPath, pdftotextParams);
                if (out) textContent = out;
            } catch (e) {}
        }

    } catch (e) {
        log("Error extracting text: " + e.message);
    }

    if (!textContent || textContent.trim().length === 0) {
        window.alert("未能提取到 PDF 文本！\n可能是尚未为该PDF建立索引。如果这是新导入的PDF，请尝试双击打开一次它，再进行总结。");
        return;
    }

    textContent = textContent.substring(0, 10000);

    const prefPrefix = "extensions.ai-summary.";
    const model = Zotero.Prefs.get(prefPrefix + "model", true) || "deepseek";
    const deepseekKey = Zotero.Prefs.get(prefPrefix + "deepseekKey", true) || "";
    const geminiKey = Zotero.Prefs.get(prefPrefix + "geminiKey", true) || "";

    if (model === "deepseek" && !deepseekKey) {
        window.alert("未配置 DeepSeek API Key，请前往设置中配置！");
        return;
    }
    if (model === "gemini" && !geminiKey) {
        window.alert("未配置 Gemini API Key，请前往设置中配置！");
        return;
    }

    try {
        let summary = await callLLM(model, deepseekKey, geminiKey, textContent);
        
        let note = new Zotero.Item('note');
        let formattedSummary = summary.replace(/\n/g, '<br/>');
        note.setNote(`<h2>🤖 AI 论文总结</h2><p>${formattedSummary}</p>`);
        note.parentID = item.id;
        await note.saveTx();

        window.alert("总结完成！已生成子便签。");
    } catch (e) {
        window.alert("请求大模型失败：" + e.message);
        log("LLM Error: " + e.message);
    }
}

async function callLLM(model, deepseekKey, geminiKey, text) {
    const prompt = "你是一个专业的学术助手，请用纯中文详细总结这篇论文的研究背景、核心方法、主要结论和创新点。以下是论文正文的前10000字：\n\n" + text;
    
    if (model === "deepseek") {
        let response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + deepseekKey
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一个专业的学术助手，请用纯中文输出，不要使用Markdown加粗等影响排版的格式。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });
        let data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    } else {
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        let data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
    }
}
