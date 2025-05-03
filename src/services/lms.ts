import { URLSearchParams } from 'url';
import { fetchWithCookies } from './fetchClient';
import { initialHeaders } from './headers';
import { CookieJar } from 'tough-cookie';

async function getCookie(cookieJar: CookieJar) {
  const fetch = await fetchWithCookies(cookieJar);
  try {
    const response = await fetch(
      'https://mujslcm.jaipur.manipal.edu/Home/Index',
      {
        headers: initialHeaders,
        redirect: 'manual',
        // agent: proxyAgent,
      },
    );
    const siteHtml: string = await response.text();

    const match = siteHtml.match(
      /<input name="__RequestVerificationToken" type="hidden" value="(.*?)" \/>/,
    );
    if (!match) {
      console.log('Token not found');
      return null;
    }

    return { websiteCookie: match[1] };
  } catch (err) {
    console.log('Error in getCookie:', err);
    return null;
  }
}

async function login(username: string, password: string, cookieJar: CookieJar) {
  const cookie = await getCookie(cookieJar);
  if (!cookie) return null;

  const bodyFormData = new URLSearchParams();
  bodyFormData.append('__RequestVerificationToken', cookie.websiteCookie);
  bodyFormData.append('EmailFor', '@muj.manipal.edu');
  bodyFormData.append('LoginFor', '2');
  bodyFormData.append('UserName', username);
  bodyFormData.append('Password', password);

  try {
    const fetch = await fetchWithCookies(cookieJar);
    const response = await fetch('https://mujslcm.jaipur.manipal.edu/', {
      method: 'POST',
      body: bodyFormData,
      headers: {
        ...initialHeaders,
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://mujslcm.jaipur.manipal.edu',
        referer: 'https://mujslcm.jaipur.manipal.edu/Home/Index',
        connection: 'keep-alive',
        'sec-fetch-site': 'same-origin',
      },
      // agent: proxyAgent,
      redirect: 'manual',
    });

    console.log(response.status);
    return response.status === 302;
  } catch (err) {
    console.log('Error in login:', err);
    return null;
  }
}

async function getAttendance(cookieJar: CookieJar) {
  const bodyFormData = new URLSearchParams();
  bodyFormData.append('StudentCode', '');

  try {
    const fetch = await fetchWithCookies(cookieJar);
    const response = await fetch(
      'https://mujslcm.jaipur.manipal.edu/Student/Academic/GetAttendanceSummaryList',
      {
        method: 'POST',
        body: bodyFormData,
        headers: {
          ...initialHeaders,
          'content-type': 'application/x-www-form-urlencoded',
        },
        // agent: proxyAgent,
      },
    );

    return await response.json();
  } catch (err) {
    console.log('Error in getting attendance:', err);
    return null;
  }
}

export { getCookie, login, getAttendance };
