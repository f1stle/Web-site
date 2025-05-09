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
io.on('connection', (socket) => socketHandler(io, socket));

// Запуск
sequelize.sync().then(() => {
    server.listen(3000, () => console.log('Server running on http://localhost:3000'));
});
