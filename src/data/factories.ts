import { faker } from '@faker-js/faker';

export interface User {
  username: string;
  password: string;
}

export interface Order {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

export function randomUser(prefix = 'qa'): User {
  const suffix = `${process.env.TEST_PARALLEL_INDEX ?? 0}${Date.now().toString(36)}${faker.string.alphanumeric(5)}`;
  return {
    username: `${prefix}_${suffix}`.toLowerCase(),
    password: `${faker.internet.password({ length: 12 })}A1!`,
  };
}

export function randomOrder(overrides: Partial<Order> = {}): Order {
  return {
    name: faker.person.fullName(),
    country: faker.location.country(),
    city: faker.location.city(),
    card: faker.finance.creditCardNumber({ issuer: 'visa' }).replace(/-/g, ''),
    month: String(faker.number.int({ min: 1, max: 12 })),
    year: String(new Date().getFullYear() + 2),
    ...overrides,
  };
}
