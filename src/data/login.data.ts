import { Messages } from './messages';
import type { User } from './factories';

export interface LoginCase {
  id: string;
  title: string;
  username: string;
  password: string;
  expected: string;
}

export const invalidLogins: LoginCase[] = [
  {
    id: 'LOGIN-05',
    title: 'wrong password',
    username: '{user}',
    password: 'WrongPass#123',
    expected: Messages.login.wrongPassword,
  },
  {
    id: 'LOGIN-06',
    title: 'unknown user',
    username: 'no_such_user_{random}',
    password: 'Any#123',
    expected: Messages.login.userNotExist,
  },
  {
    id: 'LOGIN-07',
    title: 'empty username and password',
    username: '',
    password: '',
    expected: Messages.login.emptyFields,
  },
  {
    id: 'LOGIN-08',
    title: 'empty password',
    username: '{user}',
    password: '',
    expected: Messages.login.emptyFields,
  },
  {
    id: 'LOGIN-09',
    title: 'password in upper case',
    username: '{user}',
    password: '{PASSWORD}',
    expected: Messages.login.wrongPassword,
  },
];

export function fillPlaceholders(value: string, user: User): string {
  return value
    .replace('{user}', user.username)
    .replace('{PASSWORD}', user.password.toUpperCase())
    .replace('{random}', Date.now().toString(36));
}
