import { expect, type Page } from "@playwright/test";
import type { TestUser } from "../fixtures/users";

export async function goToLogin(page: Page) {
    await page.goto("/#/login");
}

export async function goToRegister(page: Page) {
    await page.goto("/#/register");
}

export async function submitRegister(page: Page, user: TestUser) {
    await goToRegister(page);

    await page.getByRole("textbox", { name: "Your Name" }).fill(user.username);
    await page.getByRole("textbox", { name: "Email" }).fill(user.email);
    await page.getByRole("textbox", { name: "Password" }).fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();
}

export async function registerUser(page: Page, user: TestUser) {
    await submitRegister(page, user);

    await expect(page.locator(".navbar")).toContainText(user.username);
}

export async function login(page: Page, email: string, password: string) {
    await goToLogin(page);

    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Login" }).click();
}

export async function logout(page: Page, username: string) {
    await page
        .getByRole("navigation")
        .getByRole("img", { name: username })
        .click();

    await page.getByRole("link", { name: /Logout/ }).click();
}