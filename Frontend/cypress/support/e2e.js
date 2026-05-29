// Cypress Support File
// https://docs.cypress.io/guides/core-concepts/support-files

// Custom commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="identifier"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-btn"], button:contains("Logout"), button:contains("Đăng xuất")').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('clearAuth', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit('/login');
});

// API helpers
Cypress.Commands.add('apiRequest', (method, url, body, token) => {
  const options = {
    method,
    url: `${Cypress.env('apiUrl')}${url}`,
    ...(body && { body }),
  };

  if (token) {
    options.headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  return cy.request(options);
});

// Login via API and set token
Cypress.Commands.add('loginViaApi', (identifier, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { identifier, password },
  }).then((response) => {
    window.localStorage.setItem('accessToken', response.body.accessToken);
    window.localStorage.setItem('refreshToken', response.body.refreshToken);
    return response.body;
  });
});
