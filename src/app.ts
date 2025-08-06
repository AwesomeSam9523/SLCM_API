import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import { CookieJar } from 'tough-cookie';
import { eq } from 'drizzle-orm';

import db from './db/index';
import { login, getAttendance } from './services/lms';
import { successJson, errorJson } from './utils/response';
import { usersTable } from './db/schema';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionSecret = process.env.APP_SECRET;
if (!sessionSecret) {
  throw new Error('APP_SECRET is not defined in the environment variables.');
}
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
  }),
);

app.post('/register', async (req: express.Request, res: express.Response) => {
  try {
    console.log(req.body);
    let { phno }: { phno: string } = req.body;
    const { username, password }: { username: string; password: string } = req.body;
    phno = phno.replace(/[^0-9]/g, '');
    const user: typeof usersTable.$inferInsert = {
      email: username.toUpperCase(),
      password,
      phno,
    };

    if (!username || !password || !phno) {
      return errorJson(
        res,
        400,
        'Username, password and phone number are required',
      );
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phno, phno))
      .execute();

    if (existingUser.length > 0) {
      return errorJson(res, 400, 'User already exists');
    }

    const cookieJar = new CookieJar();
    console.log('Logging in with username and password', username, password);
    const loginSuccess = await login(username, password, cookieJar);
    if (!loginSuccess) {
      return errorJson(res, 403, 'Invalid username or password');
    }

    await db.insert(usersTable).values(user);
    console.log('New user created!');
    successJson(res);
  } catch (error) {
    console.error(error);
    errorJson(res, 500, 'Internal server error');
  }
});

app.post('/attendance', async (req: express.Request, res: express.Response) => {
  try {
    const { phno }: { phno: string } = req.body;
    if (!phno) {
      return errorJson(res, 400, 'Phone number is required');
    }
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phno, phno))
      .execute();

    if (user.length === 0) {
      return errorJson(res, 404, 'User not found');
    }

    const { email, password } = user[0];

    const cookieJar = new CookieJar();
    const loggedIn = await login(email, password, cookieJar);
    if (!loggedIn) {
      errorJson(res, 403, 'Invalid username or password');
      await db.delete(usersTable).where(eq(usersTable.phno, phno)).execute();
      return;
    }

    const attendance = await getAttendance(cookieJar);
    if (!attendance) {
      return errorJson(res, 500, 'Failed to fetch attendance');
    }
    console.log(JSON.stringify(attendance['AttendanceSummaryList'], null, 2));
    const data = attendance['AttendanceSummaryList'].map(
      ({ CourseID, Present, Absent, Total, Percentage }) => {
        return { CourseID, Present, Absent, Total, Percentage };
      },
    );
    successJson(res, data);
  } catch (e) {
    console.error(e);
    errorJson(res, 500, 'Internal server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
