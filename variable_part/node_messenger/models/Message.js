const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize;
const User = require('./User');

const Message = sequelize.define('Message', {
    content: { type: DataTypes.TEXT, allowNull: false },
    sender_id: { type: DataTypes.INTEGER, allowNull: false },
    recipient_id: { type: DataTypes.INTEGER, allowNull: false }
});

Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });

module.exports = Message;