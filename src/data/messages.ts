export const Messages = {
  login: {
    emptyFields: 'Please fill out Username and Password.',
    wrongPassword: 'Wrong password.',
    userNotExist: 'User does not exist.',
    welcome: (username: string) => `Welcome ${username}`,
  },
  cart: {
    productAdded: 'Product added.',
  },
  order: {
    missingFields: 'Please fill out Name and Creditcard.',
    thankYou: 'Thank you for your purchase!',
  },
  api: {
    badToken: 'Bad parameter, token malformed.',
  },
} as const;
