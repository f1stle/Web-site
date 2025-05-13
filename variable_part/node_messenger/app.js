const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const routes = require('./routes');
const { sequelize } = require('./models');
const socketHandler = require('./sockets');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Хранилище онлайн-пользователей
const onlineUsers = new Set();

// Настройки
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Маршруты
app.use('/', routes);

// Сокеты
io.on('connection', (socket) => {
  console.log('Пользователь подключился');

  // Сохраняем имя пользователя в сокете
  socket.on('save_username', (username) => {
    if (!username) return;

    socket.username = username;
    onlineUsers.add(username);

    console.log(`Пользователь вошёл: ${username}`);
    io.emit('update_user_status', Array.from(onlineUsers));
  });

  // При отключении удаляем из списка
  socket.on('disconnect', () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      console.log(`Пользователь вышел: ${socket.username}`);
      io.emit('update_user_status', Array.from(onlineUsers));
    } else {
      console.log('Аноним отключился');
    }
  });

  // Проброс обработчика
  socketHandler(io, socket);
});

// Запуск
sequelize.sync().then(() => {
  server.listen(3000, () => console.log('Server running on http://localhost:3000'));
});
