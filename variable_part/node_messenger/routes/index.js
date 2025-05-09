const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Message = require('../models/Message');
const router = express.Router();
const { Op } = require("sequelize");

// Middleware проверки авторизации
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// Главная (чат)
router.get('/', requireLogin, async (req, res) => {
    const user = await User.findByPk(req.session.userId);
    
    if (!user) {
        return res.redirect('/login');  // Если пользователь не найден, перенаправляем на страницу входа
    }

    const users = await User.findAll({ where: { id: { [Op.ne]: user.id } } });
    res.render('index', { user, users });
});

// Регистрация
router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.send('Пользователь с таким именем уже существует');

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
});

// Вход
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.id;
        res.redirect('/');
    } else {
        res.send('Неверные данные');
    }
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// Личный чат
router.get('/chat/:id', requireLogin, async (req, res) => {
    const user = await User.findByPk(req.session.userId);
    const recipient = await User.findByPk(req.params.id);

    if (!recipient) {
        return res.status(404).send('Получатель не найден');
    }

    const messages = await Message.findAll({
        where: {
            [Op.or]: [
                { sender_id: user.id, recipient_id: recipient.id },
                { sender_id: recipient.id, recipient_id: user.id }
            ]
        },
        order: [['createdAt', 'ASC']],
        include: [
            { model: User, as: 'sender' },
            { model: User, as: 'recipient' }
        ]
    });

    res.render('chat', { user, recipient, messages });
});

module.exports = router;
