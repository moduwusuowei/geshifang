/* ===== 全局状态 ===== */
let currentTabIndex = 0
let undoStack = []
let redoStack = []

/* ===== DOM 引用 ===== */
const $ = id => document.getElementById(id)
const input = $('gs-input')
const preview = $('gs-preview')
const formatBtn = $('gs-format-btn')
const indentCheckbox = $('gs-indent-check')
const headerBgPicker = $('gs-header-bg')
const h1Color = $('gs-h1-color')
const h1Size = $('gs-h1-size')
const h2Color = $('gs-h2-color')
const h2Size = $('gs-h2-size')
const h3Color = $('gs-h3-color')
const h3Size = $('gs-h3-size')
const h4Color = $('gs-h4-color')
const h4Size = $('gs-h4-size')
const previewBox = preview.closest('.gs-preview-box')

/* ===== 字数/阅读时间更新 ===== */
function updateStats() {
  const text = input.value
  const charCount = text.replace(/\s/g, '').length
  const paraCount = text.split('\n').filter(l => l.trim()).length || 0
  const minutes = Math.max(1, Math.round(charCount / 300))
  const el = id => document.getElementById(id)
  if (el('gs-char-count')) el('gs-char-count').textContent = charCount
  if (el('gs-para-count')) el('gs-para-count').textContent = paraCount
  if (el('gs-read-time')) el('gs-read-time').textContent = minutes
}

function injectStatsAfterTitle(html) {
  const charCount = input.value.replace(/\s/g, '').length
  const paraCount = input.value.split('\n').filter(l => l.trim()).length || 0
  const minutes = Math.max(1, Math.round(charCount / 300))
  const statsHtml = `<p style="font-size:13px; color:#999; line-height:1.6; margin:0 0 1em 0;">字数：${charCount}  ·  段落：${paraCount}  ·  预计阅读约 ${minutes} 分钟</p>`
  return html.replace('</h1>', '</h1>' + statsHtml)
}

/* ===== 行号同步 ===== */
function syncLineNumbers() {
  const nums = $('#gs-line-nums')
  if (!nums) return
  const lines = input.value.split('\n')
  const count = Math.max(lines.length, 1)
  nums.innerHTML = Array.from({ length: count }, (_, i) => `<span>${i + 1}</span>`).join('')
  nums.scrollTop = input.scrollTop
}
input.addEventListener('scroll', syncLineNumbers)

/* ===== 多草稿管理 ===== */
const DRAFTS_KEY = 'geshifang_drafts'
function loadDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}') } catch (e) { return {} }
}
function saveDrafts(drafts) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)) } catch (e) { /* ignore */ }
}
function renderDraftList() {
  const list = $('#gs-draft-list')
  if (!list) return
  const drafts = loadDrafts()
  const entries = Object.entries(drafts)
  if (!entries.length) { list.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:13px;text-align:center;">暂无草稿</p>'; return }
  list.innerHTML = entries.map(([name, content]) => `
    <div class="gs-draft-item" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border);cursor:pointer;">
      <span style="font-size:13px;" onclick="document.getElementById('gs-input').value = this.parentElement.dataset.content; updateStats(); $('#gs-draft-modal').classList.add('gs-hidden');">${name}</span>
      <button class="gs-draft-delete" data-name="${name}" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;">&#x2716;</button>
    </div>
  `).join('')
  list.querySelectorAll('.gs-draft-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const name = btn.dataset.name
      const drafts = loadDrafts()
      delete drafts[name]
      saveDrafts(drafts)
      renderDraftList()
    })
  })
}

/* ===== 自动生成目录 ===== */
function generateTOC() {
  const headings = preview.querySelectorAll('h1, h2, h3, h4')
  if (!headings.length) { alert('预览区未检测到标题（H1~H4）'); return }
  let toc = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px 20px;margin-bottom:20px;">'
  toc += '<div style="font-weight:700;font-size:15px;margin-bottom:10px;color:var(--text);">&#x1F4CB; 文章目录</div>'
  headings.forEach(h => {
    const level = parseInt(h.tagName[1], 10)
    const text = h.textContent.trim()
    if (!text) return
    const padding = (level - 1) * 16
    const size = [16, 14, 13, 13][level - 1] || 12
    toc += `<div style="padding-left:${padding}px;font-size:${size}px;line-height:1.8;color:var(--primary-light);">${text}</div>`
  })
  toc += '</div>'
  saveSnapshot()
  preview.innerHTML = toc + preview.innerHTML
}

/* ===== 导出 PDF ===== */
function exportPDF() {
  const content = preview.innerHTML
  if (!content || !content.trim()) { alert('暂无排版结果可导出'); return }
  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>article</title><style>
    @page { margin: 20mm 25mm; }
    body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; font-size: 14px; line-height: 1.8; color: #333; padding: 0; margin: 0; }
    img { max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 4px; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 13px; border-radius: 6px; overflow: hidden; }
    th, td { border: 1px solid #D0D0D0; padding: 8px 12px; text-align: left; }
    th { background: #1A3C6D; color: #fff; font-weight: 600; }
    tr:nth-child(even) td { background: #F8F9FA; }
    pre { background: #F5F5F7; border-radius: 6px; padding: 14px 18px; overflow-x: auto; font-size: 13px; line-height: 1.6; }
    code { font-family: 'JetBrains Mono','Consolas',monospace; font-size: 0.9em; }
    blockquote { background: #F5F5F7; border-left: 4px solid #1A3C6D; margin: 16px 0; padding: 12px 16px; border-radius: 0 6px 6px 0; color: #555; }
    hr { border: none; border-top: 1px solid #E0E0E0; margin: 24px 0; }
    .gs-print-stats { font-size: 13px; color: #999; line-height: 1.6; margin: 0 0 1em 0; }
  </style></head><body>${content}</body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 500)
}

/* ===== 复制纯文本 ===== */
function copyPlainText() {
  const text = preview.textContent
  if (!text || !text.trim()) { alert('暂无排版结果可复制'); return }
  navigator.clipboard.writeText(text).then(() => {
    const btn = $('gs-text-copy-btn')
    const orig = btn.innerHTML
    btn.innerHTML = '&#x2705; 已复制'
    setTimeout(() => btn.innerHTML = orig, 1500)
  }).catch(() => alert('复制失败'))
}

/* ===== 模板导出/导入 ===== */
function exportTemplates() {
  const data = localStorage.getItem('gs_templates') || '{}'
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'geshifang-templates.json'; a.click()
  URL.revokeObjectURL(url)
}
function importTemplates() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = '.json'
  input.onchange = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const existing = JSON.parse(localStorage.getItem('gs_templates') || '{}')
        Object.assign(existing, data)
        localStorage.setItem('gs_templates', JSON.stringify(existing))
        loadTemplates()
        alert('模板导入成功')
      } catch (err) { alert('导入失败：无效的模板文件') }
    }
    reader.readAsText(file, 'utf-8')
  }
  input.click()
}

/* ===== AI 改写 ===== */
async function aiRewrite(text, action) {
  const actionPrompts = {
    polish: '请润色以下文字，优化表达、修正语病，保持原意不变：\n\n',
    expand: '请扩写以下文字，丰富内容、增加细节、保持风格一致：\n\n',
    shorten: '请缩写以下文字，提炼核心内容，保留关键信息：\n\n',
    'translate-en': '请将以下文字翻译为英文：\n\n',
    'translate-ja': '请将以下文字翻译为日文：\n\n',
    'translate-ko': '请将以下文字翻译为韩文：\n\n',
  }
  const prompt = (actionPrompts[action] || actionPrompts.polish) + text
  try {
    const { default: apiConfig } = await import('./config/apiConfig.js')
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.BACKEND_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的文字编辑助手。请根据用户要求处理文字，直接返回处理结果，不要添加解释或额外内容。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })
    if (!res.ok) throw new Error(`API 请求失败 (${res.status})`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (e) {
    throw new Error('AI 处理失败: ' + e.message)
  }
}

/* ===== 样式模板 ===== */
const TEMPLATES_KEY = 'gs_templates'
function loadTemplates() {
  try {
    const data = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}')
    const sel = $('gs-template')
    if (!sel) return
    sel.innerHTML = '<option value="">样式模板...</option>'
    Object.entries(data).forEach(([name, config]) => {
      const opt = document.createElement('option')
      opt.value = name
      opt.textContent = name
      sel.appendChild(opt)
    })
  } catch (e) { /* ignore */ }
}

function saveTemplate(name, config) {
  try {
    const data = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}')
    data[name] = config
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(data))
    loadTemplates()
  } catch (e) { /* ignore */ }
}

function applyTemplate(name) {
  try {
    const data = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}')
    const tpl = data[name]
    if (!tpl) return
    if (tpl.indent !== undefined) indentCheckbox.checked = tpl.indent
    if (tpl.headerBg) headerBgPicker.value = tpl.headerBg
    if (tpl.h1Color) h1Color.value = tpl.h1Color
    if (tpl.h1Size) h1Size.value = tpl.h1Size
    if (tpl.h2Color) h2Color.value = tpl.h2Color
    if (tpl.h2Size) h2Size.value = tpl.h2Size
    if (tpl.h3Color) h3Color.value = tpl.h3Color
    if (tpl.h3Size) h3Size.value = tpl.h3Size
    if (tpl.h4Color) h4Color.value = tpl.h4Color
    if (tpl.h4Size) h4Size.value = tpl.h4Size
    headerBgPicker.dispatchEvent(new Event('input'))
  } catch (e) { /* ignore */ }
}

function deleteTemplate(name) {
  try {
    const data = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}')
    delete data[name]
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(data))
    loadTemplates()
  } catch (e) { /* ignore */ }
}

/* ===== 草稿自动保存 ===== */
const DRAFT_KEY = 'geshifang_draft'
let saveDraftTimer = null
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, input.value)
  } catch (e) { /* ignore */ }
}
function loadDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft && !input.value) {
      input.value = draft
    }
    updateStats()
    syncLineNumbers()
  } catch (e) { /* ignore */ }
}

/* ===== 核心排版 ===== */
async function applyFormat() {
  try {
    let text = input.value
    if (!text.trim()) return

    const { preprocessText } = await import('./utils/textProcessor.js')
    text = preprocessText(text)

    const { hasApiKey } = await import('./utils/deepseekClient.js')
    const badge = $('gs-mode-badge')

    if (hasApiKey()) {
      badge.textContent = 'AI'
      badge.className = 'gs-tb-btn text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium'
      const { formatWithAI } = await import('./utils/deepseekClient.js')
      let result = await formatWithAI(text)
      if (!result || !result.trim()) result = '<p>AI 返回为空，请重试</p>'
      preview.innerHTML = injectStatsAfterTitle(result)
    } else {
      badge.innerHTML = '&#x1F4E1; 本地'
      badge.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(245,158,11,0.12);color:#B45309;font-weight:500;'
      const { formatLocally } = await import('./utils/localFormatter.js')
      const headerBg = headerBgPicker.value || '#1A3C6D'
      const h1c = h1Color.value
      const h1s = h1Size.value
      const h2c = h2Color.value
      const h2s = h2Size.value
      const h3c = h3Color.value
      const h3s = h3Size.value
      const h4c = h4Color.value
      const h4s = h4Size.value
      let result = formatLocally(text, headerBg, h1c, h1s, h2c, h2s, h3c, h3s, h4c, h4s)
      if (!result || !result.trim()) result = '<p>排版结果为空</p>'
      preview.innerHTML = injectStatsAfterTitle(result)
    }

    applyIndent()
    // 应用字体
    const fontSel = $('gs-font-select')
    if (fontSel && fontSel.value) preview.style.fontFamily = fontSel.value
    // 应用段间距
    const spacingSel = $('gs-p-spacing')
    if (spacingSel && spacingSel.value) {
      preview.querySelectorAll('p').forEach(p => p.style.marginBottom = spacingSel.value)
    }
    updateStats()
    saveDraft()
  } catch (e) {
    preview.innerHTML = `<p style="color:red;padding:12px;background:#FEE2E2;border-radius:6px;">排版出错：${e.message || e}</p>`
    console.error('排版错误', e)
  }
}

function applyIndent() {
  const enable = indentCheckbox.checked
  preview.querySelectorAll('p').forEach(p => {
    p.style.textIndent = enable ? '2em' : '0'
  })
}

/* ===== 撤销/重做（预览区） ===== */
function saveSnapshot() {
  undoStack.push(preview.innerHTML)
  redoStack = []
  if (undoStack.length > 50) undoStack.shift()
}

function undoRedoCmd(dir) {
  const src = dir === 'undo' ? undoStack : redoStack
  const dst = dir === 'undo' ? redoStack : undoStack
  if (!src.length) return
  dst.push(preview.innerHTML)
  preview.innerHTML = src.pop()
  applyIndent()
  preview.focus()
}

/* ===== Markdown 快捷插入 ===== */
function insertMarkdown(before, after) {
  const start = input.selectionStart, end = input.selectionEnd
  const selected = input.value.substring(start, end)
  const text = before + selected + after
  input.setRangeText(text, start, end, 'select')
  input.focus()
}

/* ===== 快捷键 ===== */
input.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = input.selectionStart, end = input.selectionEnd
    input.setRangeText('\t', start, end, 'end')
  }
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    applyFormat()
  }
})

const SENSITIVE_WORDS = [
  /fuck/gi, /shit/gi, /傻[逼B比]/g, /操你/g, /草你/g, /日你/g
]
const TYPO_MAP = {
  '吿': '告', '彳余': '行', '亻禺': '偶', '亻尔': '你',
  '丿': '', '丶': '', '扌足': '促',
}

function checkSensitive(text) {
  const found = []
  SENSITIVE_WORDS.forEach(re => {
    let m
    while ((m = re.exec(text)) !== null) {
      found.push(m[0])
    }
  })
  return found
}

function checkTypos(text) {
  let fixed = text
  let count = 0
  for (const [wrong, right] of Object.entries(TYPO_MAP)) {
    const re = new RegExp(wrong, 'g')
    if (re.test(fixed)) {
      fixed = fixed.replace(re, right)
      count++
    }
  }
  return { fixed, count }
}

async function applyFormatAndCheck() {
  await applyFormat()
  const text = input.value
  const sensitive = checkSensitive(text)
  const { fixed, count } = checkTypos(text)
  if (count > 0) {
    input.value = fixed
    const msg = document.createElement('div')
    msg.style.cssText = 'padding:8px 12px; margin:0 0 12px 0; background:#FEF3C7; border-left:4px solid #F59E0B; border-radius:4px; font-size:13px; color:#92400E;'
    msg.textContent = `已自动修正 ${count} 处常见错别字`
    preview.insertBefore(msg, preview.firstChild)
  }
  if (sensitive.length > 0) {
    const warn = document.createElement('div')
    warn.style.cssText = 'padding:8px 12px; margin:0 0 12px 0; background:#FEE2E2; border-left:4px solid #EF4444; border-radius:4px; font-size:13px; color:#991B1B;'
    warn.innerHTML = `<strong>⚠ 敏感词提醒：</strong>发现 ${sensitive.length} 处敏感词汇（${sensitive.join(', ')}），请检查后发布`
    preview.insertBefore(warn, preview.firstChild)
  }
}

/* ===== 导出 Markdown ===== */
function exportMarkdown() {
  let text = input.value
  const pasted = window.pastedImages || []
  for (let i = 0; i < pasted.length; i++) {
    if (pasted[i]) {
      text = text.replace(`![](pasted:${i})`, `![图片](${pasted[i]})`)
    }
  }
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'article.md'
  a.click()
  URL.revokeObjectURL(url)
}

/* ===== 导出长图 ===== */
function exportLongImage() {
  if (typeof html2canvas === 'undefined') {
    alert('html2canvas 尚未加载，请稍后重试')
    return
  }
  const clone = preview.cloneNode(true)
  clone.style.cssText = 'width:600px; padding:24px; background:#fff; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;'
  clone.style.position = 'absolute'
  clone.style.left = '-9999px'
  clone.style.top = '0'
  document.body.appendChild(clone)

  html2canvas(clone, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
  }).then(canvas => {
    const link = document.createElement('a')
    link.download = 'article.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    document.body.removeChild(clone)
  }).catch(err => {
    console.error(err)
    document.body.removeChild(clone)
    alert('导出失败: ' + err.message)
  })
}

/* ===== 历史版本 ===== */
const HISTORY_KEY = 'gs_history'
const CSS_KEY = 'gs_custom_css'
const MAX_HISTORY = 20
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch (e) { return [] }
}
function saveToHistory(html) {
  try {
    const hist = loadHistory()
    hist.unshift({ html, time: Date.now() })
    if (hist.length > MAX_HISTORY) hist.length = MAX_HISTORY
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist))
    renderHistoryPanel()
  } catch (e) { /* ignore */ }
}
function renderHistoryPanel() {
  const panel = $('gs-history-panel')
  if (!panel) return
  const hist = loadHistory()
  if (!hist.length) { panel.innerHTML = '<p style="padding:12px;color:#999;font-size:13px;">暂无历史</p>'; return }
  panel.innerHTML = hist.map((item, i) => {
    const time = new Date(item.time).toLocaleString('zh-CN')
    return `<div class="gs-history-item" data-idx="${i}" style="padding:8px 12px;border-bottom:1px solid #E5E6EB;cursor:pointer;font-size:13px;">${time}</div>`
  }).join('')
  panel.querySelectorAll('.gs-history-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx, 10)
      const hist = loadHistory()
      if (hist[idx]) {
        preview.innerHTML = hist[idx].html
        applyIndent()
      }
    })
  })
}

/* ===== 页面关闭前保存 ===== */
window.addEventListener('beforeunload', saveDraft)

/* ===== 事件绑定 ===== */
document.addEventListener('DOMContentLoaded', () => {
  loadDraft()
  loadTemplates()
  renderHistoryPanel()

  // 页脚
  const footer = $('gs-footer')
  const fc = window.GS_CONFIG?.footer
  if (fc && (fc.text || fc.creator || fc.license)) {
    const left = fc.text ? `<span>${fc.text}</span>` : ''
    let right = ''
    if (fc.creator) right += `${fc.creator.label} <a href="${fc.creator.url}" target="_blank" style="color:var(--primary-light);text-decoration:none;">${fc.creator.name}</a>`
    if (fc.creator && fc.license) right += ' · '
    if (fc.license) right += `<a href="${fc.license.url}" target="_blank" style="color:var(--primary-light);text-decoration:none;">${fc.license.name}</a>`
    const rightSpan = right ? `<span>${right}</span>` : ''
    footer.innerHTML = left + rightSpan
    footer.style.display = 'flex'
  } else {
    footer.style.display = 'none'
  }

  // 字数目标
  if ($('gs-target-input')) $('gs-target-input').addEventListener('input', updateStats)

  // 一键排版
  $('gs-format-btn').addEventListener('click', async () => {
    saveSnapshot()
    try {
      await applyFormatAndCheck()
    } catch (e) {
      preview.innerHTML = `<p style="color:red;padding:12px;background:#FEE2E2;border-radius:6px;">排版出错：${e.message || e}</p>`
      console.error(e)
    }
  })

  // 撤销
  $('gs-undo-btn').addEventListener('click', () => undoRedoCmd('undo'))
  $('gs-redo-btn').addEventListener('click', () => undoRedoCmd('redo'))

  // 首行缩进
  $('gs-indent-check').addEventListener('change', applyIndent)

  // 表头颜色（通过 formatLocally 传递）
  // (无需额外事件绑定)

  // 全屏
  $('gs-fullscreen-btn').addEventListener('click', () => {
    document.querySelector('main').classList.toggle('gs-fullscreen')
  })

  // 深色/浅色主题
  $('gs-theme-btn').addEventListener('click', () => {
    const html = document.documentElement
    html.classList.toggle('dark')
    localStorage.setItem('geshifang_theme', html.classList.contains('dark') ? 'dark' : 'light')
  })
  if (localStorage.getItem('geshifang_theme') === 'dark') {
    document.documentElement.classList.add('dark')
  }

  // 手机预览
  $('gs-mobile-btn').addEventListener('click', () => {
    previewBox.classList.toggle('gs-mobile-preview')
  })

  // 导出按钮
  $('gs-export-btn').addEventListener('click', exportMarkdown)
  $('gs-export-img-btn')?.addEventListener('click', exportLongImage)

  // 历史
  $('gs-history-btn')?.addEventListener('click', () => {
    $('gs-history-panel').classList.toggle('gs-hidden')
  })

  // 插入图片
  $('gs-insert-image').addEventListener('click', () => {
    const url = prompt('输入图片 URL：')
    if (url) {
      saveSnapshot()
      preview.innerHTML += `<img src="${url}" style="max-width:100%;height:auto;display:block;margin:16px auto;border-radius:4px;" />`
    }
  })

  // 插入公式
  $('gs-insert-formula')?.addEventListener('click', () => {
    const latex = prompt('输入 LaTeX 公式（不含 $$）：')
    if (latex) {
      saveSnapshot()
      const url = `https://latex.codecogs.com/svg.image?${encodeURIComponent(latex)}`
      preview.innerHTML += `<img src="${url}" style="display:inline-block;vertical-align:middle;margin:4px;max-width:100%;" />`
    }
  })

  // Markdown 快捷插入
  $('gs-md-bold')?.addEventListener('click', () => insertMarkdown('**', '**'))
  $('gs-md-italic')?.addEventListener('click', () => insertMarkdown('*', '*'))
  $('gs-md-link')?.addEventListener('click', () => insertMarkdown('[', '](url)'))
  $('gs-md-quote')?.addEventListener('click', () => {
    const start = input.selectionStart
    const sel = input.value.substring(input.selectionStart, input.selectionEnd)
    const lines = sel.split('\n').map(l => '> ' + l).join('\n')
    input.setRangeText(lines, start, input.selectionEnd, 'select')
    input.focus()
  })
  $('gs-md-img')?.addEventListener('click', () => {
    const url = prompt('输入图片 URL：')
    if (url) {
      insertMarkdown(`![`, `](${url})`)
    }
  })

  // 模板
  $('gs-template')?.addEventListener('change', function () {
    if (this.value) applyTemplate(this.value)
  })
  $('gs-save-template')?.addEventListener('click', () => {
    const name = prompt('样式模板名称：')
    if (name) {
      saveTemplate(name, {
        indent: indentCheckbox.checked,
        headerBg: headerBgPicker.value,
        h1Color: h1Color.value,
        h1Size: h1Size.value,
        h2Color: h2Color.value,
        h2Size: h2Size.value,
        h3Color: h3Color.value,
        h3Size: h3Size.value,
        h4Color: h4Color.value,
        h4Size: h4Size.value,
      })
    }
  })
  $('gs-template')?.addEventListener('contextmenu', function (e) {
    e.preventDefault()
    if (this.value) {
      if (confirm(`删除模板「${this.value}」？`)) {
        deleteTemplate(this.value)
        this.value = ''
      }
    }
  })

  // 复制排版结果
  $('gs-copy-btn')?.addEventListener('click', () => {
    const html = preview.innerHTML
    if (!html || !html.trim()) { alert('暂无排版结果可复制'); return }
    const text = preview.textContent
    const htmlBlob = new Blob([html], { type: 'text/html' })
    const textBlob = new Blob([text], { type: 'text/plain' })
    navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
    ]).then(() => {
      const btn = $('gs-copy-btn')
      const orig = btn.innerHTML
      btn.innerHTML = '&#x2705; 已复制'
      setTimeout(() => btn.innerHTML = orig, 1500)
    }).catch(() => {
      // fallback: 传统方式
      navigator.clipboard.writeText(html).then(() => {
        const btn = $('gs-copy-btn')
        const orig = btn.innerHTML
        btn.innerHTML = '&#x2705; 已复制'
        setTimeout(() => btn.innerHTML = orig, 1500)
      }).catch(() => alert('复制失败，请手动选择后 Ctrl+C'))
    })
  })

  // 字体选择
  $('gs-font-select')?.addEventListener('change', function () {
    preview.style.fontFamily = this.value
  })

  // 段间距
  $('gs-p-spacing')?.addEventListener('change', function () {
    preview.querySelectorAll('p').forEach(p => p.style.marginBottom = this.value)
  })

  // 拖入 .md 文件
  input.addEventListener('dragover', e => { e.preventDefault(); input.style.outline = '2px dashed var(--primary-light)' })
  input.addEventListener('dragleave', () => { input.style.outline = 'none' })
  input.addEventListener('drop', e => {
    e.preventDefault()
    input.style.outline = 'none'
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.md')) { alert('请拖入 .md 文件'); return }
    const reader = new FileReader()
    reader.onload = () => { input.value = reader.result; updateStats() }
    reader.readAsText(file, 'utf-8')
  })

  // 自定义 CSS
  const CSS_PRESETS = {
    simple: {
      label: '🌿 简约留白',
      css: `/* 简约留白 — 干净、透气、文字为主 */
p { font-size: 16px; line-height: 2; color: #333; }
h1 { font-size: 24px; font-weight: 700; color: #1A1A2E; border-left: none; padding-left: 0; border-bottom: 2px solid #1A1A2E; padding-bottom: 10px; margin-bottom: 20px; }
h2 { font-size: 20px; font-weight: 600; color: #1A1A2E; border-left: none; padding-left: 0; margin-top: 28px; }
h3 { font-size: 17px; font-weight: 600; color: #555; }
blockquote { background: #F9F9FB; border-left: 3px solid #CCC; border-radius: 0; color: #666; }
pre { border-radius: 8px; background: #F5F5F7; }
code { background: #F0F0F2; color: #D63384; }
table { font-size: 14px; }
th { background: #1A1A2E !important; }
hr { border-top: 1px solid #EEE; }`
    },
    warm: {
      label: '☀️ 暖阳橙调',
      css: `/* 暖阳橙调 — 温暖、亲和、活力 */
p { font-size: 15px; line-height: 1.9; color: #3D2E1E; }
h1 { font-size: 24px; font-weight: 700; color: #C75B12; border-left: 5px solid #E8831A; padding-left: 14px; border-bottom: none; }
h2 { font-size: 19px; font-weight: 600; color: #D4731E; border-left: 4px solid #F0A347; padding-left: 12px; }
h3 { font-size: 16px; font-weight: 600; color: #A65D1A; }
blockquote { background: #FEF7EE; border-left: 4px solid #E8831A; color: #7A5A3A; border-radius: 0 8px 8px 0; }
pre { background: #FDF6ED; border: 1px solid #F0DCC8; border-radius: 8px; }
code { background: #FDF0E0; color: #C75B12; }
th { background: #E8831A !important; }
td { border-color: #F0DCC8; }
tbody tr:nth-child(even) td { background: #FEF7EE; }
hr { border-top: 2px solid #F0A347; }`
    },
    forest: {
      label: '🌲 森林绿意',
      css: `/* 森林绿意 — 自然、沉稳、舒适 */
p { font-size: 15px; line-height: 1.9; color: #2D3A2D; }
h1 { font-size: 23px; font-weight: 700; color: #2D5A2D; border-left: 4px solid #4A8C5C; padding-left: 14px; border-bottom: 1px solid #C8DCC8; }
h2 { font-size: 19px; font-weight: 600; color: #3A7040; border-left: 3px solid #6BAF7A; padding-left: 10px; }
h3 { font-size: 16px; font-weight: 600; color: #4A7A50; }
blockquote { background: #F2F8F2; border-left: 4px solid #6BAF7A; color: #4A6A4A; border-radius: 0 8px 8px 0; }
pre { background: #F0F7F0; border: 1px solid #C8DCC8; border-radius: 8px; }
code { background: #E8F0E8; color: #2D6A3A; }
th { background: #4A8C5C !important; }
td { border-color: #C8DCC8; }
tbody tr:nth-child(even) td { background: #F5FAF5; }
hr { border-top: 1px solid #C8DCC8; }
a { color: #3A8C4A !important; }`
    },
    twilight: {
      label: '🌆 暮色紫调',
      css: `/* 暮色紫调 — 优雅、深邃、浪漫 */
p { font-size: 15px; line-height: 1.9; color: #2E2437; }
h1 { font-size: 23px; font-weight: 700; color: #5B3A7A; border-left: 4px solid #8B5CF6; padding-left: 14px; border-bottom: 1px solid #D8CCE8; }
h2 { font-size: 19px; font-weight: 600; color: #6B4A8A; border-left: 3px solid #A78BFA; padding-left: 10px; }
h3 { font-size: 16px; font-weight: 600; color: #7B5A9A; }
blockquote { background: #F6F2FA; border-left: 4px solid #A78BFA; color: #5A4A6A; border-radius: 0 8px 8px 0; }
pre { background: #F4F0F8; border: 1px solid #D8CCE8; border-radius: 8px; }
code { background: #EEE8F4; color: #7B3A9A; }
th { background: #7B4A9A !important; }
td { border-color: #D8CCE8; }
tbody tr:nth-child(even) td { background: #F8F4FC; }
hr { border-top: 1px solid #D8CCE8; }
a { color: #7B3A9A !important; }`
    },
    ocean: {
      label: '🌊 海洋蓝调',
      css: `/* 海洋蓝调 — 冷静、专业、信赖 */
p { font-size: 15px; line-height: 1.9; color: #1A2A3A; }
h1 { font-size: 23px; font-weight: 700; color: #1A5276; border-left: 4px solid #2E86C1; padding-left: 14px; border-bottom: 1px solid #AED6F1; }
h2 { font-size: 19px; font-weight: 600; color: #2E6A9A; border-left: 3px solid #5DADE2; padding-left: 10px; }
h3 { font-size: 16px; font-weight: 600; color: #3A7AAA; }
blockquote { background: #EBF5FB; border-left: 4px solid #5DADE2; color: #3A5A7A; border-radius: 0 8px 8px 0; }
pre { background: #F0F7FC; border: 1px solid #AED6F1; border-radius: 8px; }
code { background: #E8F0F8; color: #1A6AAA; }
th { background: #2E86C1 !important; }
td { border-color: #AED6F1; }
tbody tr:nth-child(even) td { background: #F2F8FD; }
hr { border-top: 1px solid #AED6F1; }
a { color: #1A6AAA !important; }`
    },
    chinese: {
      label: '🏮 国风典雅',
      css: `/* 国风典雅 — 朱红、墨色、宣纸质感 */
p { font-size: 16px; line-height: 2; color: #2A1A0A; font-family: 'KaiTi','STKaiti','Noto Serif SC',serif; }
h1 { font-size: 24px; font-weight: 700; color: #8B1A1A; border-left: 4px solid #C43A3A; padding-left: 14px; border-bottom: 1px solid #E8C8C0; }
h2 { font-size: 20px; font-weight: 600; color: #A52A2A; border-left: 3px solid #D46A4A; padding-left: 10px; }
h3 { font-size: 17px; font-weight: 600; color: #B54A3A; }
blockquote { background: #FCF5F0; border-left: 4px solid #C43A3A; color: #5A3A2A; border-radius: 0; }
pre { background: #F8F2EA; border: 1px solid #E0D0C0; border-radius: 4px; font-family: 'KaiTi','STKaiti',serif; }
code { background: #F5EDE4; color: #8B2A1A; font-family: 'KaiTi','STKaiti',serif; }
th { background: #8B1A1A !important; }
td { border-color: #E0D0C0; }
tbody tr:nth-child(even) td { background: #FAF5F0; }
hr { border-top: 1px solid #E0D0C0; }
a { color: #8B3A2A !important; }
table { font-family: 'KaiTi','STKaiti','Noto Serif SC',serif; }`
    },
    dark: {
      label: '🌙 极客暗色',
      css: `/* 极客暗色 — 深色背景、霓虹点亮、代码感 */
#gs-preview { background: #0D1117 !important; color: #C9D1D9 !important; }
p { font-size: 15px; line-height: 1.9; color: #C9D1D9; }
h1 { font-size: 23px; font-weight: 700; color: #58A6FF; border-left: 4px solid #58A6FF; padding-left: 14px; border-bottom: 1px solid #30363D; }
h2 { font-size: 19px; font-weight: 600; color: #79C0FF; border-left: 3px solid #79C0FF; padding-left: 10px; }
h3 { font-size: 16px; font-weight: 600; color: #8B949E; }
blockquote { background: #161B22; border-left: 4px solid #30363D; color: #8B949E; border-radius: 0 6px 6px 0; }
pre { background: #161B22; border: 1px solid #30363D; border-radius: 6px; }
code { background: #21262D; color: #F0883E; }
th { background: #21262D !important; color: #C9D1D9 !important; }
td { border-color: #30363D; color: #C9D1D9; }
tbody tr:nth-child(even) td { background: #161B22; }
table { border-color: #30363D; }
hr { border-top: 1px solid #30363D; }
a { color: #58A6FF !important; }`
    },
    morandi: {
      label: '🎨 柔和莫兰迪',
      css: `/* 柔和莫兰迪 — 低饱和度、克制、高级感 */
p { font-size: 15px; line-height: 2; color: #4A4A5A; }
h1 { font-size: 22px; font-weight: 600; color: #6B6B7B; border-left: 4px solid #B8B8C8; padding-left: 14px; border-bottom: 1px solid #D8D8E2; }
h2 { font-size: 18px; font-weight: 500; color: #7A7A8A; border-left: 3px solid #C8C8D8; padding-left: 10px; }
h3 { font-size: 16px; font-weight: 500; color: #8A8A9A; }
blockquote { background: #F0F0F5; border-left: 4px solid #C8C8D8; color: #6A6A7A; border-radius: 0 8px 8px 0; }
pre { background: #F2F2F7; border: 1px solid #DDDDE5; border-radius: 8px; }
code { background: #ECECF2; color: #8A6A8A; }
th { background: #8A8A9A !important; }
td { border-color: #DDDDE5; }
tbody tr:nth-child(even) td { background: #F5F5FA; }
hr { border-top: 1px solid #DDDDE5; }
a { color: #8A7A8A !important; }`
    },
    code: {
      label: '💻 代码舒适',
      css: `/* 代码舒适 — 代码块暖深灰白字、阅读友好 */
pre { background: #2B2D3E !important; border: 1px solid #3A3D52; border-radius: 8px; padding: 16px 20px !important; }
pre code { color: #E4E4E8 !important; background: transparent !important; font-size: 13px; line-height: 1.7; }
code { background: #EEEEF4; color: #C43E5A; padding: 2px 7px; border-radius: 4px; font-size: 0.9em; }
p code { background: #F0F0F6; color: #C43E5A; }
h1 code, h2 code, h3 code, h4 code { background: #EEEEF4; color: #C43E5A; }
li code { background: #EEEEF4; color: #C43E5A; }
td code { background: #EEEEF4; color: #C43E5A; }
p { font-size: 15px; line-height: 1.9; color: #2E2E3E; }
h1 { font-size: 22px; font-weight: 700; color: #3A3A4E; border-left: 4px solid #7C7CA8; padding-left: 14px; border-bottom: 1px solid #D8D8E4; }
h2 { font-size: 18px; font-weight: 600; color: #4A4A5E; border-left: 3px solid #9494BA; padding-left: 10px; }
h3 { font-size: 16px; font-weight: 600; color: #5A5A6E; }
blockquote { background: #F4F4F8; border-left: 4px solid #9494BA; color: #5A5A6A; border-radius: 0 8px 8px 0; }
th { background: #4A4A5E !important; color: #F0F0F6 !important; }
td { border-color: #D8D8E4; }
tbody tr:nth-child(even) td { background: #F6F6FA; }
hr { border-top: 1px solid #D8D8E4; }
a { color: #5A6AAA !important; }`
    }
  }

  function applyCustomCSS() {
    const existing = document.getElementById('gs-custom-style')
    if (existing) existing.remove()
    const css = localStorage.getItem(CSS_KEY)
    if (!css || !$('gs-css-toggle')?.checked) return
    const style = document.createElement('style')
    style.id = 'gs-custom-style'
    style.textContent = css
    document.head.appendChild(style)
  }

  function loadCSSEditor() {
    const saved = localStorage.getItem(CSS_KEY) || ''
    if ($('gs-css-editor')) $('gs-css-editor').value = saved
    applyCustomCSS()
  }

  function populateCSSPresets() {
    const sel = $('gs-css-preset')
    if (!sel) return
    sel.innerHTML = '<option value="">— 从预设模板开始 —</option>'
    for (const [key, preset] of Object.entries(CSS_PRESETS)) {
      const opt = document.createElement('option')
      opt.value = key
      opt.textContent = preset.label
      sel.appendChild(opt)
    }
  }

  // 预设选择 → 填充编辑器
  $('gs-css-preset')?.addEventListener('change', function () {
    const preset = CSS_PRESETS[this.value]
    if (preset && $('gs-css-editor')) {
      $('gs-css-editor').value = preset.css
    }
  })

  $('gs-css-btn')?.addEventListener('click', () => {
    $('gs-css-modal')?.classList.remove('gs-hidden')
    populateCSSPresets()
    loadCSSEditor()
  })
  $('gs-css-close')?.addEventListener('click', () => {
    $('gs-css-modal')?.classList.add('gs-hidden')
  })
  $('gs-css-save')?.addEventListener('click', () => {
    const css = $('gs-css-editor')?.value || ''
    localStorage.setItem(CSS_KEY, css)
    applyCustomCSS()
    $('gs-css-modal')?.classList.add('gs-hidden')
  })
  $('gs-css-reset')?.addEventListener('click', () => {
    localStorage.removeItem(CSS_KEY)
    if ($('gs-css-editor')) $('gs-css-editor').value = ''
    if ($('gs-css-preset')) $('gs-css-preset').value = ''
    applyCustomCSS()
    $('gs-css-status').textContent = '已恢复默认'
    setTimeout(() => $('gs-css-status').textContent = '', 2000)
  })
  $('gs-css-toggle')?.addEventListener('change', applyCustomCSS)

  // 预览内容变化时重新应用自定义 CSS
  new MutationObserver(() => applyCustomCSS()).observe(preview, { childList: true, subtree: true, attributes: false })

  loadCSSEditor()

  // Ctrl+F 搜索
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      const bar = $('gs-search-bar')
      if (bar) {
        e.preventDefault()
        bar.classList.toggle('gs-hidden')
        if (!bar.classList.contains('gs-hidden')) {
          $('gs-search-input')?.focus()
        }
      }
    }
    if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault()
      $('gs-shortcuts-modal')?.classList.toggle('gs-hidden')
    }
    if (e.key === 'Escape') {
      $('gs-shortcuts-modal')?.classList.add('gs-hidden')
      $('gs-css-modal')?.classList.add('gs-hidden')
      $('gs-history-panel')?.classList.add('gs-hidden')
      $('gs-draft-modal')?.classList.add('gs-hidden')
      $('gs-ai-modal')?.classList.add('gs-hidden')
      $('gs-shortcut-settings-modal')?.classList.add('gs-hidden')
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.target.id === 'gs-preview') {
      e.preventDefault()
      undoRedoCmd('undo')
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z')) && e.target.id === 'gs-preview') {
      e.preventDefault()
      undoRedoCmd('redo')
    }
  })

  // 搜索替换
  $('gs-search-input')?.addEventListener('input', function () {
    const q = this.value.toLowerCase()
    const text = preview.textContent.toLowerCase()
    let idx = text.indexOf(q)
    if (idx >= 0) {
      window._gsSearchIdx = idx
      window._gsSearchTerm = q
    }
  })
  $('gs-search-prev')?.addEventListener('click', () => {
    const q = window._gsSearchTerm
    if (!q) return
    const text = preview.textContent.toLowerCase()
    let idx = text.lastIndexOf(q, (window._gsSearchIdx || 0) - 1)
    if (idx < 0) idx = text.lastIndexOf(q)
    if (idx >= 0) {
      window._gsSearchIdx = idx
      preview.focus()
    }
  })
  $('gs-search-next')?.addEventListener('click', () => {
    const q = window._gsSearchTerm
    if (!q) return
    const text = preview.textContent.toLowerCase()
    let idx = text.indexOf(q, (window._gsSearchIdx || 0) + 1)
    if (idx < 0) idx = text.indexOf(q)
    if (idx >= 0) {
      window._gsSearchIdx = idx
      preview.focus()
    }
  })
  $('gs-search-replace')?.addEventListener('click', () => {
    const from = $('gs-search-input')?.value
    const to = $('gs-search-replace-input')?.value
    if (from && to && confirm(`将所有「${from}」替换为「${to}」？`)) {
      input.value = input.value.split(from).join(to)
    }
  })

  // 导入 .md 文件
  $('gs-import-btn')?.addEventListener('click', () => $('gs-file-input')?.click())
  $('gs-file-input')?.addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { input.value = reader.result; updateStats(); syncLineNumbers() }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  })

  // 生成目录
  $('gs-toc-btn')?.addEventListener('click', generateTOC)

  // 草稿管理
  $('gs-draft-btn')?.addEventListener('click', () => {
    renderDraftList()
    $('#gs-draft-modal')?.classList.toggle('gs-hidden')
  })
  $('gs-draft-save')?.addEventListener('click', () => {
    const name = $('#gs-draft-name')?.value?.trim()
    if (!name) { alert('请输入草稿名称'); return }
    const drafts = loadDrafts()
    drafts[name] = input.value
    saveDrafts(drafts)
    $('#gs-draft-name').value = ''
    renderDraftList()
    alert('草稿已保存')
  })
  $('gs-draft-close')?.addEventListener('click', () => $('#gs-draft-modal')?.classList.add('gs-hidden'))

  // AI 辅助
  $('gs-ai-btn')?.addEventListener('click', () => {
    const sel = window.getSelection()?.toString() || ''
    if ($('gs-ai-source')) $('gs-ai-source').value = sel
    $('#gs-ai-modal')?.classList.remove('gs-hidden')
  })
  $('gs-ai-go')?.addEventListener('click', async () => {
    const text = $('#gs-ai-source')?.value?.trim()
    if (!text) { alert('请输入待处理的文字'); return }
    const action = $('#gs-ai-action')?.value || 'polish'
    const btn = $('gs-ai-go')
    const orig = btn.textContent
    btn.textContent = '处理中...'
    btn.disabled = true
    try {
      const result = await aiRewrite(text, action)
      if ($('gs-ai-result')) $('gs-ai-result').value = result
    } catch (e) {
      if ($('gs-ai-result')) $('gs-ai-result').value = '错误：' + e.message
    } finally {
      btn.textContent = orig
      btn.disabled = false
    }
  })
  $('gs-ai-apply')?.addEventListener('click', () => {
    const result = $('#gs-ai-result')?.value
    if (result) { input.value = input.value + '\n\n' + result; updateStats(); saveDraft(); $('#gs-ai-modal')?.classList.add('gs-hidden') }
  })
  $('gs-ai-close')?.addEventListener('click', () => $('#gs-ai-modal')?.classList.add('gs-hidden'))

  // 导出 PDF
  $('gs-pdf-btn')?.addEventListener('click', exportPDF)

  // 复制纯文本
  $('gs-text-copy-btn')?.addEventListener('click', copyPlainText)

  // 模板导出/导入
  $('gs-template-export-btn')?.addEventListener('click', () => {
    const choice = confirm('确定 → 导出模板\n取消 → 导入模板')
    if (choice) exportTemplates()
    else importTemplates()
  })

  // 快捷键设置
  $('gs-shortcut-settings-btn')?.addEventListener('click', () => {
    const list = $('#gs-shortcut-list')
    if (!list) return
    const defaultShortcuts = [
      { id: 'format', label: '一键排版', key: 's', ctrl: true },
      { id: 'search', label: '搜索/替换', key: 'f', ctrl: true },
      { id: 'undo', label: '撤销（预览区）', key: 'z', ctrl: true },
      { id: 'redo', label: '重做（预览区）', key: 'y', ctrl: true },
      { id: 'shortcuts', label: '快捷键面板', key: '?', ctrl: false },
    ]
    const custom = JSON.parse(localStorage.getItem('gs_custom_shortcuts') || '{}')
    list.innerHTML = defaultShortcuts.map(sc => {
      const k = custom[sc.id] || sc.key
      const ctrl = sc.ctrl
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <span>${sc.label}</span>
        <span style="display:flex;align-items:center;gap:6px;">
          <kbd class="gs-kbd" data-id="${sc.id}" style="background:var(--surface-hover);border:1px solid var(--border);border-radius:4px;padding:2px 10px;font-size:12px;cursor:pointer;">${ctrl ? 'Ctrl+' : ''}${k.toUpperCase()}</kbd>
          <button class="gs-shortcut-reset" data-id="${sc.id}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:11px;">重置</button>
        </span>
      </div>`
    }).join('')
    list.querySelectorAll('.gs-kbd').forEach(el => {
      el.addEventListener('click', function () {
        const id = this.dataset.id
        this.textContent = '按键...'
        const handler = e => {
          e.preventDefault()
          const key = e.key === 'Escape' ? 'Esc' : e.key
          this.textContent = (e.ctrlKey || e.metaKey ? 'Ctrl+' : '') + key.toUpperCase()
          const custom = JSON.parse(localStorage.getItem('gs_custom_shortcuts') || '{}')
          custom[id] = key
          if (e.ctrlKey || e.metaKey) custom[id + '_ctrl'] = true
          localStorage.setItem('gs_custom_shortcuts', JSON.stringify(custom))
          document.removeEventListener('keydown', handler)
        }
        document.addEventListener('keydown', handler)
      })
    })
    list.querySelectorAll('.gs-shortcut-reset').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.dataset.id
        const custom = JSON.parse(localStorage.getItem('gs_custom_shortcuts') || '{}')
        delete custom[id]; delete custom[id + '_ctrl']
        localStorage.setItem('gs_custom_shortcuts', JSON.stringify(custom))
        $('gs-shortcut-settings-btn')?.click()
      })
    })
    $('#gs-shortcut-settings-modal')?.classList.remove('gs-hidden')
  })
  $('gs-shortcut-settings-close')?.addEventListener('click', () => $('#gs-shortcut-settings-modal')?.classList.add('gs-hidden'))

  // 输入监听
  input.addEventListener('input', () => {
    updateStats()
    syncLineNumbers()
    clearTimeout(saveDraftTimer)
    saveDraftTimer = setTimeout(saveDraft, 500)
  })
})

/* ===== 粘贴图片 / Excel 表格 ===== */
input.addEventListener('paste', function (e) {
  const items = e.clipboardData?.items
  if (!items) return

  const images = []
  const texts = []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      images.push(item)
    } else if (item.type === 'text/plain') {
      texts.push(item)
    }
  }

  // 图片粘贴
  if (images.length > 0) {
    let allImg = true
    for (const item of items) {
      if (!item.type.startsWith('image/')) { allImg = false; break }
    }
    if (!allImg) return

    e.preventDefault()
    if (!window.pastedImages) window.pastedImages = []
    images.forEach(item => {
      const blob = item.getAsFile()
      if (!blob) return
      const idx = window.pastedImages.length
      window.pastedImages.push(null)
      const placeholder = `\n![](pasted:${idx})\n`
      input.setRangeText(placeholder, input.selectionStart, input.selectionEnd, 'end')

      const reader = new FileReader()
      reader.onload = () => {
        window.pastedImages[idx] = reader.result
        preview.innerHTML += `<img src="${reader.result}" style="max-width:100%;height:auto;display:block;margin:16px auto;border-radius:4px;" />`
      }
      reader.readAsDataURL(blob)
    })
  }

  // Excel 表格粘贴
  for (const item of items) {
    if (item.type === 'text/plain') {
      item.getAsString(text => {
        if (text.includes('\t') && (text.includes('\r') || text.includes('\n'))) {
          e.preventDefault()
          const rows = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(r => r.trim())
          if (rows.length < 2) return
          const cols = rows[0].split('\t').length
          const markdown = rows.map((r, i) => {
            const cells = r.split('\t')
            if (cells.length < cols) cells.push(...Array(cols - cells.length).fill(''))
            const line = '| ' + cells.join(' | ') + ' |'
            return i === 1 ? line + '\n' + rows.map((_, j) => '|' + ' ---'.repeat(cols) + ' |').join('\n') : line
          }).join('\n')
          input.setRangeText(markdown, input.selectionStart, input.selectionEnd, 'end')
        }
      })
      break
    }
  }
})
