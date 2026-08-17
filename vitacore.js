function getSessionId() {
  let sessionId = sessionStorage.getItem('vitacore_session');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('vitacore_session', sessionId);
  }
  return sessionId;
}


let uploadedDocumentText = '';
let uploadedFileName = '';

function toggleChat() {
  const box = document.getElementById('chat-box');
  const isOpen = box.style.display === 'flex';
  box.style.display = isOpen ? 'none' : 'flex';
}

function typeWriter(element, text, speed = 18) {
  let i = 0;
  element.textContent = '';
  return new Promise(resolve => {
    const interval = setInterval(() => {
      element.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const messages = document.getElementById('messages');

  const noticeDiv = document.createElement('div');
  noticeDiv.className = 'msg-user';
  noticeDiv.textContent = `📎 Uploading: ${file.name}`;
  messages.appendChild(noticeDiv);
  messages.scrollTop = messages.scrollHeight;

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();

  if (data.error) {
    noticeDiv.textContent = `❌ Couldn't read ${file.name}`;
    return;
  }

  uploadedDocumentText = data.text;
  uploadedFileName = file.name;
  noticeDiv.textContent = `✅ ${file.name} loaded — ask me anything about it`;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('messages');
  const avatar = document.getElementById('avatarFace');
  const chatStatus = document.getElementById('chatStatus');
  const message = input.value.trim();
  if (!message) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'msg-user';
  userDiv.textContent = message;
  messages.appendChild(userDiv);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  avatar.classList.add('thinking');
  chatStatus.textContent = 'PROCESSING...';

  const thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'thinking-dots';
  thinkingDiv.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(thinkingDiv);
  messages.scrollTop = messages.scrollHeight;

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      documentText: uploadedDocumentText,
      documentName: uploadedFileName,
      sessionId: getSessionId()
    })
  });
  const data = await res.json();

  thinkingDiv.remove();
  avatar.classList.remove('thinking');
  chatStatus.textContent = 'ONLINE // READY';

  const aiDiv = document.createElement('div');
  aiDiv.className = 'msg-ai';
  messages.appendChild(aiDiv);
  messages.scrollTop = messages.scrollHeight;

  await typeWriter(aiDiv, data.reply);
  messages.scrollTop = messages.scrollHeight;
}

document.addEventListener('keypress', function(e) {
  const input = document.getElementById('chat-input');
  if (input && e.key === 'Enter' && document.activeElement === input) {
    sendMessage();
  }
}); 

function createChatLauncher() {
  const launcher = document.createElement('div');
  launcher.id = 'vitacore-launcher';
  launcher.innerHTML = `
    <div id="vitacore-prompt" style="display:none;">
      <div class="prompt-avatar">⚡</div>
      <div class="prompt-content">
        <div class="prompt-name">VitaCore AI</div>
        <div class="prompt-message">Need to know more about Victor? I can help.</div>
      </div>
      <button id="close-prompt" onclick="dismissPrompt()">✕</button>
    </div>
    <button id="vitacore-btn" onclick="toggleChat()">
      💬
      <span class="btn-dot"></span>
    </button>
  `;
  document.body.appendChild(launcher);

  setTimeout(() => {
    const prompt = document.getElementById('vitacore-prompt');
    if (prompt) prompt.style.display = 'flex';
  }, 3000);
}

function dismissPrompt() {
  const prompt = document.getElementById('vitacore-prompt');
  if (prompt) prompt.style.display = 'none';
}

// Initialize launcher when page loads
document.addEventListener('DOMContentLoaded', () => {
  createChatLauncher();
});