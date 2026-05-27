import { expect, type Page } from "@playwright/test";
import type { TestArticle } from "../fixtures/articles";

export async function goToEditor(page: Page) {
    await page.goto("/#/editor");
}

export async function fillArticleForm(page: Page, article: Partial<TestArticle>) {
    if (article.title !== undefined) {
        await page.getByPlaceholder("Article Title").fill(article.title);
    }

    if (article.description !== undefined) {
        await page
            .getByPlaceholder("What's this article about?")
            .fill(article.description);
    }

    if (article.body !== undefined) {
        await page
            .getByPlaceholder("Write your article (in markdown)")
            .fill(article.body);
    }

    if (article.tags !== undefined) {
        await page.getByPlaceholder("Enter tags").fill(article.tags);
    }
}

export async function publishArticle(page: Page, article: TestArticle) {
    await goToEditor(page);

    await expect(page.getByPlaceholder("Article Title")).toBeVisible();

    await fillArticleForm(page, article);

    await page.getByRole("button", { name: "Publish Article" }).click();

    await expect(page).toHaveURL(/#\/article\//);
}