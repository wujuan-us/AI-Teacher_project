# AI—Teacher_project

## 智小象AI辅导员（前后端分离版）

本项目基于原始单文件网页拆分而成，保留了原页面的全部可见内容与原有交互风格，并将聊天回复逻辑迁移到了 Python 后端。

## 项目结构

```text
AI-Teacher_project/
├─ backend/
│  ├─ app.py
│  └─ requirements.txt
├─ frontend/
│  ├─ index.html
│  └─ static/
│     ├─ style.css
│     └─ app.js
├─ original/
│  └─ original_single_file.html
└─ README.md
```

## 运行方式

### 1. 启动后端

```bash
python app.py
```

### 2. 打开网页

浏览器访问：

```text
http://127.0.0.1:5000
```

## 已完成的前后端分离内容

1. 将原始 HTML 页面拆分为：
   - `frontend/index.html`
   - `frontend/static/style.css`
   - `frontend/static/app.js`

2. 将聊天回复逻辑迁移至 Python 后端：
   - 前端通过 `POST /api/chat` 请求聊天接口
   - 后端返回回复文本
   - 目前仍使用你原先的关键词回答库，未接入豆包 API
   - 后端使用 Python 标准库实现，无需额外安装 Flask 等依赖

3. 保留原页面的所有主要内容：
   - 首页
   - 服务大厅
   - 我的成长
   - 社区
   - 所有按钮文案
   - 所有提示文案
   - 原有外链图片资源
   - 原有大部分交互表现

## 后续接入豆包 API 的推荐位置

将 `backend/app.py` 中的 `build_answer()` 替换为真实大模型调用逻辑即可，前端无需大改。
