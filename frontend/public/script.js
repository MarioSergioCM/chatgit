const socket = io();

const messages = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

// Receber mensagens anteriores
socket.on('previousMessages', (msgs) => {
  msgs.forEach((msg) => {
    addMessage(msg);
  });
});

// Receber nova mensagem
socket.on('newMessage', (msg) => {
  addMessage(msg);
});

// Enviar nova mensagem
messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = messageInput.value;
  const user = 'User'; 
  socket.emit('newMessage', { user, message });
  messageInput.value = '';
});

function addMessage(msg) {
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<strong>${msg.user}:</strong> ${msg.message}`;
  messages.appendChild(messageElement);
}