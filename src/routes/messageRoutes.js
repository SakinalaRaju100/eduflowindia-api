const express = require('express');
const r = express.Router();
const { getMessages, sendMessage, markMessageRead } = require('../controllers/miscController');
const { protect } = require('../middleware/authMiddleware');
r.use(protect);
r.get('/', getMessages);
r.post('/', sendMessage);
r.patch('/:id/read', markMessageRead);
module.exports = r;
