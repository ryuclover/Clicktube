const jwt = require('jsonwebtoken');
const env = require('./env');

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

const isProd = () => process.env.NODE_ENV === 'production';

const cookieOpts = (maxAge) => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'none' : 'lax',
  path: '/',
  maxAge,
});

const signAccess = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TTL });
const signRefresh = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: REFRESH_TTL });

const setAuthCookies = (res, { id, role }) => {
  const access = signAccess({ id, role });
  const refresh = signRefresh({ id, role, typ: 'refresh' });
  res.cookie('ct_access', access, cookieOpts(15 * 60 * 1000));
  res.cookie('ct_refresh', refresh, cookieOpts(7 * 24 * 60 * 60 * 1000));
  return { access, refresh };
};

const clearAuthCookies = (res) => {
  const opts = {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie('ct_access', opts);
  res.clearCookie('ct_refresh', opts);
};

module.exports = { signAccess, signRefresh, setAuthCookies, clearAuthCookies, ACCESS_TTL, REFRESH_TTL };
