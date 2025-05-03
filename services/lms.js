import fs from 'fs';
import {URLSearchParams} from 'url';
import {fetchWithCookies, cookieJar, proxyAgent} from './fetchClient.js';
import {initialHeaders} from './headers.js';

export async function getCookie() {
  try {
    const response = await fetchWithCookies('https://mujslcm.jaipur.manipal.edu/Home/Index', {
      headers: initialHeaders,
      redirect: 'manual',
      agent: proxyAgent
    });

    const siteHtml = await response.text();
    fs.writeFileSync('site.html', siteHtml);

    const match = siteHtml.match(/<input name="__RequestVerificationToken" type="hidden" value="(.*?)" \/>/);
    if (!match) {
      console.log('Token not found');
      return null;
    }

    return {websiteCookie: match[1]};
  } catch (err) {
    console.log('Error in getCookie:', err);
    return null;
  }
}

export async function login(username, password) {
  const cookie = await getCookie();

  const bodyFormData = new URLSearchParams();
  bodyFormData.append('__RequestVerificationToken', cookie.websiteCookie);
  bodyFormData.append('EmailFor', '@muj.manipal.edu');
  bodyFormData.append('LoginFor', '2');
  bodyFormData.append('UserName', username);
  bodyFormData.append('Password', password);

  try {
    const response = await fetchWithCookies('https://mujslcm.jaipur.manipal.edu/', {
      method: 'POST',
      body: bodyFormData,
      headers: {
        ...initialHeaders,
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://mujslcm.jaipur.manipal.edu',
        'referer': 'https://mujslcm.jaipur.manipal.edu/Home/Index',
        'connection': 'keep-alive',
        'sec-fetch-site': 'same-origin'
      },
      agent: proxyAgent,
      redirect: 'manual',
    });

    if (response.headers.get('location') === '/Home/Index') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return await login(username, password);
    }
    console.log("Status:", response.status)
    return response.status === 302 || response.status === 200;
  } catch (err) {
    console.log('Error in login:', err);
    return null;
  }
}

export async function getAttendance() {
  const bodyFormData = new URLSearchParams();
  bodyFormData.append('StudentCode', '');

  try {
    console.log(await cookieJar.getCookies('https://mujslcm.jaipur.manipal.edu'));

    const response = await fetchWithCookies('https://mujslcm.jaipur.manipal.edu/Student/Academic/GetAttendanceSummaryList', {
      method: 'POST',
      body: bodyFormData,
      headers: {
        ...initialHeaders,
        'content-type': 'application/x-www-form-urlencoded'
      },
      agent: proxyAgent
    });

    return await response.json();
  } catch (err) {
    console.log('Error in getting attendance:', err);
    return null;
  }
}
