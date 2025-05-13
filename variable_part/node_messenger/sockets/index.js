const Message = require('../models/Message');
const User = require('../models/User');

module.exports = (io, socket) => {
  // Подключение к комнате
  socket.on('join', (data) => {
    const room = [data.userId, data.recipientId].sort().join('_');
    socket.join(room);
  });

  // Сохранение имени пользователя для статусов
  socket.on('save_username', (username) => {
    socket.username = username;
  });

  // Отправка приватного сообщения
  socket.on('send_private_message', async (data) => {
    const { userId, recipientId, message } = data;
    if (!message.trim()) return;

    const msg = await Message.create({
      sender_id: userId,
      recipient_id: recipientId,
      content: message
    });

    const sender = await User.findByPk(userId);
    const recipient = await User.findByPk(recipientId);

    const room = [userId, recipientId].sort().join('_');

    // Отправляем сообщение в комнату
    io.to(room).emit('receive_private_message', {
      username: sender.username,
      content: msg.content,
      user_id: sender.id
    });

    // Отправление обновлений последнего сообщения всем пользователям
    io.emit('update_last_message', {
      senderUsername: sender.username,
      recipientUsername: recipient.username,
      message: msg.content
    });
  });
};
