import axios from 'axios';
import express from 'express';
import session from 'express-session';
import 'dotenv/config';
import fs from 'fs';
import {CookieJar} from 'tough-cookie';
import {wrapper} from 'axios-cookiejar-support';
import { HttpsProxyAgent } from 'https-proxy-agent';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(session({
  secret: process.env.APP_SECRET,
  resave: false,
  saveUninitialized: true
}));

const initialHeaders = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'cache-control': 'no-cache',
  'dnt': '1',
  'pragma': 'no-cache',
  'priority': 'u=0, i',
  'sec-ch-ua': '"Chromium";v="135", "Not-A.Brand";v="8"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
};

const httpsAgent = new HttpsProxyAgent('http://127.0.0.1:5559');
const cookieJar = new CookieJar();
const client = wrapper(axios.create({
  jar: cookieJar,
  withCredentials: true
}));

// client.interceptors.request.use(config => {
//   console.log('Request made with axios:', config.data);
//   console.log('Outgoing headers:', config.headers);
//   return config;
// }, error => {
//   return Promise.reject(error);
// });

client.interceptors.request.use(async config => {
  console.log('Request made with axios:', config.data, config.url);
  const cookieHeader = await cookieJar.getCookieString(config.url);
  console.log('Cookies that will be sent:', cookieHeader);
  return config;
});

async function getCookie() {
  const response = await client.get('https://mujslcm.jaipur.manipal.edu', {
    headers: initialHeaders,
    maxRedirects: 0,
  }).catch(err => {
    console.log('Error in getCookie:', err);
  });

  if (response) {
    console.log('getCookie response:', response.status);
    console.log('getCookie headers:', response.headers);
    const siteHtml = response.data;
    fs.writeFileSync('site.html', siteHtml);
    const regex = /<input name="__RequestVerificationToken" type="hidden" value="(.*?)" \/>/;
    const match = siteHtml.match(regex);
    if (!match) {
      console.log('Token not found');
      return null;
    }
    const websiteCookie = match[1];
    return { websiteCookie };
  } else {
    console.log('No data received from getCookie');
    return null;
  }
}

async function login(username, password) {
  const cookie = await getCookie();
  if (!cookie) return null;

  const bodyFormData = new URLSearchParams();
  bodyFormData.append('__RequestVerificationToken', cookie.websiteCookie);
  bodyFormData.append('EmailFor', '@muj.manipal.edu');
  bodyFormData.append('LoginFor', '2');
  bodyFormData.append('UserName', username);
  bodyFormData.append('Password', password);

  const response = await client.post('https://mujslcm.jaipur.manipal.edu/Home/Login', bodyFormData, {
    headers: {
      ...initialHeaders,
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://mujslcm.jaipur.manipal.edu',
      'referer': 'https://mujslcm.jaipur.manipal.edu/Home/Index',
      'connection': 'keep-alive',
      'sec-fetch-site': 'same-origin'
    },
  }).catch(err => {
    console.log('Error in login:', err);
  });

  if (response) {
    console.log('Login successful:', response.status);
    console.log(response.headers);
    return true;
  } else {
    console.log('Login failed');
    return null;
  }
}

async function getAttendance() {
  const bodyFormData = new URLSearchParams();
  bodyFormData.append('StudentCode', '');
  console.log(cookieJar.getCookiesSync('https://mujslcm.jaipur.manipal.edu'));
  const response = await client.post('https://mujslcm.jaipur.manipal.edu/Student/Academic/GetAttendanceSummaryList', bodyFormData, {
    headers: {
      ...initialHeaders,
      'content-type': 'application/x-www-form-urlencoded'
    }
  }).catch(err => {
    console.log('Error in getting attendance:', err);
  });

  if (response) {
    // console.log('Attendance data:', response.data);
    return response.data;
  } else {
    console.log('Failed to get attendance');
    return null;
  }
}

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
