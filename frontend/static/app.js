// 前端运行状态
let currentExpertMode = 'expert';

// 切换底部Tab
function switchTab(pageId, tabEl) {
    document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
}

// 输入框自动调整高度
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// 首页输入框事件
const homeChatInput = document.getElementById('homeChatInput');
homeChatInput.addEventListener('input', function() {
    autoResizeTextarea(this);
});
homeChatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendHomeChat();
    }
});

// 添加聊天消息到首页
function addChatMessage(text, role) {
    const chatMessages = document.getElementById('chatMessages');
    const welcomeTitle = document.getElementById('welcomeTitle');
    
    // 隐藏欢迎标题（有用户消息后才隐藏）
    if (welcomeTitle && role === 'student') {
        welcomeTitle.style.display = 'none';
    }
    
    const div = document.createElement('div');
    div.className = 'message ' + role;
    
    if (role === 'ai') {
        const avatarImg = document.createElement('img');
        avatarImg.src = 'https://p11-flow-imagex-download-sign.byteimg.com/tos-cn-i-a9rns2rl98/f5c6021033f8495fb60c95e93da5eab5.jpg~tplv-a9rns2rl98-24:720:720.jpg?lk3s=8e244e95&rcl=202604052202016AFAAD5BFE94CA1CC841&rrcfp=8a172a1a&x-expires=1776002528&x-signature=E8ER%2B16tEgEcMGyWDMi55cjxsec%3D';
        avatarImg.className = 'message-ai-avatar';
        avatarImg.alt = '智小象头像';
        
        const textNode = document.createTextNode(text);
        div.appendChild(avatarImg);
        div.appendChild(textNode);
    } else {
        div.textContent = text;
    }
    
    chatMessages.appendChild(div);
    
    // 滚动到底部
    const chatMainContent = document.querySelector('.chat-main-content');
    chatMainContent.scrollTop = chatMainContent.scrollHeight;
}

// 首页发送消息
async function sendHomeChat() {
    const text = homeChatInput.value.trim();
    if (!text) return;

    // 添加用户消息
    addChatMessage(text, 'student');
    homeChatInput.value = '';
    autoResizeTextarea(homeChatInput);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                mode: currentExpertMode
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const answer = data.answer || '你好，我不太懂你的意思，你可以换个方式问我哦~';
        addChatMessage(answer, 'ai');
    } catch (error) {
        console.error('聊天接口调用失败：', error);
        addChatMessage('抱歉，当前服务暂时不可用，请稍后再试。', 'ai');
    }
}

// 提示框功能
function showToast(text) {
    const toast = document.getElementById('toast');
    if (toast.timer) clearTimeout(toast.timer);
    
    toast.textContent = text;
    toast.style.display = 'block';
    
    toast.timer = setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

// ===================== 核心：展开面板控制逻辑 =====================
// 关闭所有面板
function closeAllPanels() {
    document.querySelectorAll('.popup-panel').forEach(panel => {
        panel.classList.remove('show');
    });
}

// 1. 附件按钮展开/收起
function initAttachmentBtn() {
    const attachmentBtn = document.querySelector('.attachment-btn');
    const attachmentPanel = document.getElementById('attachmentPanel');
    
    attachmentBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isShow = attachmentPanel.classList.contains('show');
        closeAllPanels();
        if (!isShow) {
            attachmentPanel.classList.add('show');
        }
    });
}

// 2. 专家模式按钮展开/收起 + 模式切换
function initExpertBtn() {
    const expertBtn = document.querySelector('.expert-btn');
    const expertPanel = document.getElementById('expertPanel');
    const expertOptions = document.querySelectorAll('.expert-option');
    
    // 展开/收起
    expertBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isShow = expertPanel.classList.contains('show');
        closeAllPanels();
        if (!isShow) {
            expertPanel.classList.add('show');
        }
    });

    // 模式切换
    expertOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            // 更新选中状态
            expertOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            // 更新按钮文字
            currentExpertMode = this.dataset.mode;
            expertBtn.innerHTML = `🔹 ${this.textContent}`;
            expertBtn.classList.add('active');
            // 收起面板
            closeAllPanels();
            showToast(`已切换到「${this.textContent}」模式`);
        });
    });
}

// 3. 更多按钮展开/收起
function initMoreBtn() {
    const moreBtn = document.querySelector('.more-btn');
    const morePanel = document.getElementById('morePanel');
    const moreItems = document.querySelectorAll('.more-item');
    
    // 展开/收起
    moreBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isShow = morePanel.classList.contains('show');
        closeAllPanels();
        if (!isShow) {
            morePanel.classList.add('show');
        }
    });

    // 更多功能项点击
    moreItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const funcName = this.querySelector('span:last-child').textContent;
            showToast(`已打开「${funcName}」功能`);
            closeAllPanels();
        });
    });
}

// 文件选择功能
function selectFile(type) {
    const fileInput = document.getElementById('fileInput');
    
    // 设置文件类型过滤
    switch(type) {
        case 'image':
            fileInput.accept = 'image/*';
            break;
        case 'document':
            fileInput.accept = '.doc,.docx,.pdf,.txt,.xls,.xlsx';
            break;
        case 'video':
            fileInput.accept = 'video/*';
            break;
        case 'audio':
            fileInput.accept = 'audio/*';
            break;
        default:
            fileInput.accept = '*';
    }
    
    // 触发文件选择对话框
    fileInput.click();
    closeAllPanels();
}

// 处理文件选择
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        const fileName = files[0].name;
        showToast(`已选择文件：${fileName}`);
        // 清空文件选择器
        event.target.value = '';
    }
}

// 页面加载完成初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有展开按钮
    initAttachmentBtn();
    initExpertBtn();
    initMoreBtn();

    // 点击页面空白处关闭所有面板
    document.addEventListener('click', closeAllPanels);

    // 点击面板内部不关闭
    document.querySelectorAll('.popup-panel').forEach(panel => {
        panel.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // 普通工具按钮点击事件
    document.querySelectorAll('.tool-btn').forEach(btn => {
        if (!btn.classList.contains('attachment-btn') && !btn.classList.contains('expert-btn') && !btn.classList.contains('more-btn')) {
            btn.addEventListener('click', function() {
                closeAllPanels();
                if (!this.classList.contains('active')) {
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    showToast(`已切换到「${this.innerText.trim()}」模式`);
                }
            });
        }
    });

    // 主题活动报名点击事件
    const activityEntry = document.getElementById('activityEntry');
    activityEntry.addEventListener('click', function() {
        showToast('进入"青春向党"主题演讲比赛报名详情页');
    });
    
    const activityBtn = document.getElementById('activityBtn');
    activityBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showToast('"青春向党"主题演讲比赛报名成功！');
    });
});