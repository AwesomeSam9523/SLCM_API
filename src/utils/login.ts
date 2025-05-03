import { createHash } from 'crypto';

function hashPassword(password: string) {
  return Buffer.from(
    createHash('sha256')
      .update(password + process.env.PASSWORD_SALT)
      .digest('hex')
  ).toString('base64');
}

export default hashPassword;
