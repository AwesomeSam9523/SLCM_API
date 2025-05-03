import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import { HttpsProxyAgent } from 'https-proxy-agent';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const cookieJar = new CookieJar();
export const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:5559');
export const fetchWithCookies = fetchCookie(fetch, cookieJar);
