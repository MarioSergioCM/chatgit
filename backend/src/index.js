const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Message = require('./models/message');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Conectar ao banco de dados MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch((error) => console.error('Erro ao conectar ao MongoDB', error));

app.use(express.json());
app.use(express.static('../frontend/public'));

// Mapa para guardar os apelidos dos usuários conectados
const userNicknames = new Map();

// Rota básica
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../frontend/public/index.html');
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Um usuário conectou');

  // Evento para definir o apelido do usuário
  socket.on('nickname', (nickname, callback) => {
    if (!nickname) {
      return callback('Apelido não pode ser vazio');
    }

    // Verificar se o apelido já está em uso
    if (Array.from(userNicknames.values()).includes(nickname)) {
      return callback('Apelido já está em uso');
    }

    // Registrar o apelido do usuário
    userNicknames.set(socket.id, nickname);
    console.log(`Usuário ${nickname} conectado`);

    // Enviar sucesso para o cliente
    callback(null);

    // Enviar mensagens anteriores ao novo usuário
    Message.find().then((messages) => {
      socket.emit('previousMessages', messages);
    });

    // Redirecionar o usuário para a página do chat
    socket.emit('redirectChat');
  });

  // Receber nova mensagem
  socket.on('newMessage', (message) => {
    const nickname = userNicknames.get(socket.id);

    // Criar um novo objeto de mensagem
    const newMessage = new Message({
      nickname: nickname,
      message: message,
    });

    // Salvar a mensagem no banco de dados
    newMessage.save().then(() => {
      // Enviar a nova mensagem para todos os clientes
      io.emit('newMessage', {
        nickname: nickname,
        message: message,
      });
    });
  });

  socket.on('disconnect', () => {
    const nickname = userNicknames.get(socket.id);
    userNicknames.delete(socket.id);
    console.log(`Usuário ${nickname} desconectou`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});