

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
      documentName: uploadedFileName
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