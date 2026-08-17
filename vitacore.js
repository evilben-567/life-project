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

let chatOpenedBefore = false;

function toggleChat() {
  const box = document.getElementById('chat-box');
  const isOpen = box.style.display === 'flex';
  box.style.display = isOpen ? 'none' : 'flex';

  if (!isOpen && !chatOpenedBefore) {
    chatOpenedBefore = true;
    const messages = document.getElementById('messages');
    const greeting = document.createElement('div');
    greeting.className = 'msg-ai';
    greeting.textContent = "Hi there 👋 Need to know more about Victor? I can help.";
    messages.appendChild(greeting);
  }
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
    <button id="vitacore-btn" onclick="toggleChat()">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#0a0e14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="btn-dot"></span>
    </button>
  `;
  document.body.appendChild(launcher);
}



// Initialize launcher when page loads
document.addEventListener('DOMContentLoaded', () => {
  createChatLauncher();
});