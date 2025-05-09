const Message = require('../models/Message');
const User = require('../models/User');

module.exports = (io, socket) => {
    socket.on('join', (data) => {
        const room = [data.userId, data.recipientId].sort().join('_');
        socket.join(room);
    });

    socket.on('send_private_message', async (data) => {
        const { userId, recipientId, message } = data;
        if (!message.trim()) return;

        const msg = await Message.create({
            sender_id: userId,
            recipient_id: recipientId,
            content: message
        });
        socket.on('join', ({ userId }) => {
            socket.join(userId.toString());
          });

        const sender = await User.findByPk(userId);

        const room = [userId, recipientId].sort().join('_');
        io.to(room).emit('receive_private_message', {
            username: sender.username,
            content: msg.content,
            user_id: sender.id
        });
    });
};
