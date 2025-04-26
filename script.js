const input = document.getElementById('mensagem');
const chat = document.getElementById('chat-box');

function sendMessage() {
  let msg = input.value.trim();
  if (msg !== '') {
    chat.innerHTML += `<p><strong>Você:</strong> ${msg}</p>`;
    chat.scrollTop = chat.scrollHeight;
    input.value = '';
  }
}

// Envia ao clicar no botão
function handleButtonClick() {
  sendMessage();
}

// Envia ao pressionar Enter
input.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
});
