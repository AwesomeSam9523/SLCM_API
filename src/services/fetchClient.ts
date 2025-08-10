import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import { HttpsProxyAgent } from 'https-proxy-agent';

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const proxyAgent = new HttpsProxyAgent('http://host.docker.internal:5559');
export async function fetchWithCookies(cookieJar: CookieJar) {
  return fetchCookie(fetch, cookieJar);
}
