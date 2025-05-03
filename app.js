import express from 'express';
import session from 'express-session';
import 'dotenv/config';
import { login, getAttendance } from './services/lms.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.APP_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.get('/', async (req, res) => {
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  const loggedIn = await login(username, password);
  if (!loggedIn) {
    return res.status(500).send('Login failed');
  }

  const attendance = await getAttendance();
  if (!attendance) {
    return res.status(500).send('Failed to get attendance');
  }

  res.send(attendance);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
