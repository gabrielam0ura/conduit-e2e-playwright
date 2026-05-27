import { expect, test, type Locator, type Page } from "@playwright/test";
import { createUser } from "../fixtures/users";
import {
  goToLogin,
  goToRegister,
  login,
  logout,
  registerUser,
  submitRegister
} from "../helpers/auth.helpers";

async function expectLoggedIn(page: Page, username: string) {
  await expect(page.locator(".navbar")).toContainText(username);
  await expect(page.getByRole("link", { name: "New Article" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Login" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Sign up" })).toBeHidden();
}

async function expectLoggedOut(page: Page) {
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New Article" })).toBeHidden();
}

async function expectRequired(input: Locator) {
  const valueMissing = await input.evaluate(
    (element) => (element as HTMLInputElement).validity.valueMissing,
  );

  expect(valueMissing).toBe(true);
}

async function expectInvalidEmail(input: Locator) {
  const typeMismatch = await input.evaluate(
    (element) => (element as HTMLInputElement).validity.typeMismatch,
  );

  expect(typeMismatch).toBe(true);
}

async function expectTooShort(input: Locator) {
  const tooShort = await input.evaluate(
    (element) => (element as HTMLInputElement).validity.tooShort,
  );

  expect(tooShort).toBe(true);
}

test.describe("Autenticação", () => {
  test("AUTH-001 - deve cadastrar usuário com dados válidos", async ({ page }) => {
    const user = createUser();

    await registerUser(page, user);

    await expectLoggedIn(page, user.username);
  });

  test("AUTH-002 - deve realizar login com credenciais válidas", async ({ page }) => {
    const user = createUser();

    await registerUser(page, user);
    await logout(page, user.username);
    await login(page, user.email, user.password);

    await expectLoggedIn(page, user.username);
  });

  test("AUTH-003 - não deve realizar login com senha incorreta", async ({ page }) => {
    const user = createUser();

    await registerUser(page, user);
    await logout(page, user.username);
    await login(page, user.email, "senhaerrada");

    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator(".error-messages")).toContainText(
      "Wrong email/password combination",
    );
  });

  test("AUTH-004 - não deve realizar login com e-mail inexistente", async ({ page }) => {
    const user = createUser();

    await login(page, user.email, user.password);

    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator(".error-messages")).toContainText(
      "Email not found sign in first",
    );
  });

  test("AUTH-005 - deve exigir e-mail no login", async ({ page }) => {
    await goToLogin(page);
    await page.getByRole("textbox", { name: "Password" }).fill("gaba123");
    await page.getByRole("button", { name: "Login" }).click();

    await expectRequired(page.getByRole("textbox", { name: "Email" }));
    await expect(page).toHaveURL(/#\/login/);
  });

  test("AUTH-006 - deve exigir senha no login", async ({ page }) => {
    await goToLogin(page);
    await page.getByRole("textbox", { name: "Email" }).fill("gabriela@mail.com");
    await page.getByRole("button", { name: "Login" }).click();

    await expectRequired(page.getByRole("textbox", { name: "Password" }));
    await expect(page).toHaveURL(/#\/login/);
  });

  test("AUTH-007 - deve validar e-mail inválido no login", async ({ page }) => {
    await goToLogin(page);
    await page.getByRole("textbox", { name: "Email" }).fill("gabriela.com");
    await page.getByRole("textbox", { name: "Password" }).fill("gaba123");
    await page.getByRole("button", { name: "Login" }).click();

    await expectInvalidEmail(page.getByRole("textbox", { name: "Email" }));
    await expect(page).toHaveURL(/#\/login/);
  });

  test("AUTH-008 - deve validar senha abaixo do mínimo no login", async ({ page }) => {
    await goToLogin(page);
    await page.getByRole("textbox", { name: "Email" }).fill("gabriela@mail.com");
    await page.getByRole("textbox", { name: "Password" }).fill("1234");
    await page.getByRole("button", { name: "Login" }).click();

    await expectTooShort(page.getByRole("textbox", { name: "Password" }));
    await expect(page).toHaveURL(/#\/login/);
  });

  test("AUTH-009 - deve aceitar senha no limite mínimo no login", async ({ page }) => {
    const user = createUser("12345");

    await registerUser(page, user);
    await logout(page, user.username);
    await login(page, user.email, user.password);

    await expectLoggedIn(page, user.username);
  });

  test("AUTH-010 - deve exigir nome no cadastro", async ({ page }) => {
    await goToRegister(page);
    await page.getByRole("textbox", { name: "Email" }).fill("gabriela@mail.com");
    await page.getByRole("textbox", { name: "Password" }).fill("gaba123");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expectRequired(page.getByRole("textbox", { name: "Your Name" }));
    await expect(page).toHaveURL(/#\/register/);
  });

  test("AUTH-011 - deve exigir e-mail no cadastro", async ({ page }) => {
    await goToRegister(page);
    await page.getByRole("textbox", { name: "Your Name" }).fill("Gabriela");
    await page.getByRole("textbox", { name: "Password" }).fill("gaba123");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expectRequired(page.getByRole("textbox", { name: "Email" }));
    await expect(page).toHaveURL(/#\/register/);
  });

  test("AUTH-012 - deve exigir senha no cadastro", async ({ page }) => {
    await goToRegister(page);
    await page.getByRole("textbox", { name: "Your Name" }).fill("Gabriela");
    await page.getByRole("textbox", { name: "Email" }).fill("gabriela@mail.com");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expectRequired(page.getByRole("textbox", { name: "Password" }));
    await expect(page).toHaveURL(/#\/register/);
  });

  test("AUTH-013 - deve validar e-mail inválido no cadastro", async ({ page }) => {
    await goToRegister(page);
    await page.getByRole("textbox", { name: "Your Name" }).fill("Gabriela");
    await page.getByRole("textbox", { name: "Email" }).fill("gabriela.com");
    await page.getByRole("textbox", { name: "Password" }).fill("gaba123");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expectInvalidEmail(page.getByRole("textbox", { name: "Email" }));
    await expect(page).toHaveURL(/#\/register/);
  });

  test("AUTH-014 - não deve cadastrar usuário com e-mail já utilizado", async ({ page }) => {
    const user = createUser();

    await registerUser(page, user);
    await logout(page, user.username);
    await submitRegister(page, user);

    await expect(page).toHaveURL(/#\/register/);
    await expect(page.locator(".error-messages")).toContainText(
      "Email already exists.. try logging in",
    );
  });

  test("AUTH-015 - deve realizar logout com sucesso", async ({ page }) => {
    const user = createUser();

    await registerUser(page, user);
    await logout(page, user.username);

    await expectLoggedOut(page);
  });

  test("AUTH-016 - deve manter usuário logado após recarregar a página", async ({ page }) => {
    const user = createUser();

    await registerUser(page, user);

    await expectLoggedIn(page, user.username);

    await page.reload();

    await expectLoggedIn(page, user.username);
  });

  test("AUTH-017 - usuário deslogado não deve ver opções autenticadas no menu", async ({ page }) => {
    await page.goto("/");

    await expectLoggedOut(page);
  });

  test("AUTH-018 - usuário logado deve atualizar configurações do perfil", async ({ page }) => {
    const user = createUser();
    const bio = `Bio atualizada ${Date.now()}`;

    await registerUser(page, user);

    await page.getByRole("img", { name: user.username }).click();
    await page.getByRole("link", { name: /Settings/ }).click();

    await page.getByRole("textbox", { name: "Short bio about you" }).fill(bio);
    await page.getByRole("button", { name: "Update Settings" }).click();

    await expect(
      page.getByRole("textbox", { name: "Short bio about you" }),
    ).toHaveValue(bio);
  });
});