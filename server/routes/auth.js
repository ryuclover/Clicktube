const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../db');

const router = express.Router();
const JWT_SECRET = 'clicktube_secret_key';

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const db = readDB();

  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    email,
    password: hashedPassword,
    avatar: `https://i.pravatar.cc/150?u=${username}`,
    bio: '',
    subscribers: 0
  };

  db.users.push(newUser);
  writeDB(db);

  const token = jwt.sign({ id: newUser.id }, JWT_SECRET);
  res.json({ token, user: { id: newUser.id, username, email, avatar: newUser.avatar } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  const db = readDB();
  const query = q.toLowerCase();
  const users = db.users
    .filter(u => u.username.toLowerCase().includes(query))
    .map(u => ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio, subscribers: u.subscribers }));
  res.json(users);
});

module.exports = router;
