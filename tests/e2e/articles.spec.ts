import { expect, test, type Locator } from "@playwright/test";
import { createArticle } from "../fixtures/articles";
import { createUser } from "../fixtures/users";
import { logout, registerUser } from "../helpers/auth.helpers";
import {
    fillArticleForm,
    goToEditor,
    publishArticle,
} from "../helpers/article.helpers";

async function expectRequired(input: Locator) {
    const valueMissing = await input.evaluate(
        (element) =>
            (element as HTMLInputElement | HTMLTextAreaElement).validity.valueMissing,
    );

    expect(valueMissing).toBe(true);
}

test.describe("Artigos", () => {
    test("ART-001 - deve criar artigo com dados válidos", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await expect(page).toHaveURL(/#\/article\//);
        await expect(page.getByRole("heading", { name: article.title })).toBeVisible();
        await expect(page.locator(".article-content")).toContainText(article.body);
        await expect(page.locator(".tag-list")).toContainText("playwright");
    });

    test("ART-002 - deve exigir título ao criar artigo", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await goToEditor(page);

        await fillArticleForm(page, {
            description: article.description,
            body: article.body,
            tags: article.tags,
        });

        await page.getByRole("button", { name: "Publish Article" }).click();

        await expectRequired(page.getByPlaceholder("Article Title"));
        await expect(page).toHaveURL(/#\/editor/);
    });

    test("ART-003 - deve exigir descrição ao criar artigo", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await goToEditor(page);

        await fillArticleForm(page, {
            title: article.title,
            body: article.body,
            tags: article.tags,
        });

        await page.getByRole("button", { name: "Publish Article" }).click();

        await expectRequired(page.getByPlaceholder("What's this article about?"));
        await expect(page).toHaveURL(/#\/editor/);
    });

    test("ART-004 - deve exigir corpo ao criar artigo", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await goToEditor(page);

        await fillArticleForm(page, {
            title: article.title,
            description: article.description,
            tags: article.tags,
        });

        await page.getByRole("button", { name: "Publish Article" }).click();

        await expectRequired(page.getByPlaceholder("Write your article (in markdown)"));
        await expect(page).toHaveURL(/#\/editor/);
    });

    test("ART-005 - deve permitir criar artigo sem tags", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);

        await publishArticle(page, {
            title: article.title,
            description: article.description,
            body: article.body,
        });

        await expect(page).toHaveURL(/#\/article\//);
        await expect(page.getByRole("heading", { name: article.title })).toBeVisible();
    });

    test("ART-006 - não deve criar artigo com título já utilizado", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByRole("link", { name: /New Article/ }).click();
        await fillArticleForm(page, article);
        await page.getByRole("button", { name: "Publish Article" }).click();

        await expect(page).toHaveURL(/#\/editor/);
        await expect(page.locator(".error-messages")).toContainText(
            "Title already exists",
        );
    });

    test("ART-007 - deve editar artigo do próprio usuário", async ({ page }) => {
        const user = createUser();
        const article = createArticle();
        const updatedTitle = `${article.title} Editado`;
        const updatedDescription = `${article.description} editada`;
        const updatedBody = `${article.body} editado`;

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByRole("link", { name: /Edit Article/ }).first().click();

        await page.getByPlaceholder("Article Title").fill(updatedTitle);
        await page
            .getByPlaceholder("What's this article about?")
            .fill(updatedDescription);
        await page
            .getByPlaceholder("Write your article (in markdown)")
            .fill(updatedBody);

        await page.getByRole("button", { name: "Update Article" }).click();

        await expect(page).toHaveURL(/#\/article\//);
        await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible();
        await expect(page.locator(".article-content")).toContainText(updatedBody);
    });

    test("ART-008 - deve excluir artigo do próprio usuário", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        page.once("dialog", async (dialog) => {
            await dialog.accept();
        });

        await page.getByRole("button", { name: /Delete Article/ }).first().click();

        await expect(page).toHaveURL(/#\/?$/);
    });

    test("ART-009 - usuário deslogado não deve acessar editor", async ({ page }) => {
        await goToEditor(page);

        await expect(page).toHaveURL(/#\/?$/);
        await expect(page.getByPlaceholder("Article Title")).toBeHidden();
    });

    test("ART-010 - deve exibir artigo criado na listagem global", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();
        await expect(articlePreview).toContainText(article.description);
    });

    test("ART-011 - deve acessar artigo pela listagem global", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();
        await articlePreview.getByRole("heading", { name: article.title }).click();

        await expect(page).toHaveURL(/#\/article\//);
        await expect(page.getByRole("heading", { name: article.title })).toBeVisible();
        await expect(page.locator(".article-content")).toContainText(article.body);
    });

    test("ART-012 - usuário não autor não deve ver ações de edição e exclusão", async ({ page }) => {
        const author = createUser();
        const otherUser = createUser();
        const article = createArticle();

        await registerUser(page, author);
        await publishArticle(page, article);
        await logout(page, author.username);
        await registerUser(page, otherUser);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();
        await articlePreview.getByRole("heading", { name: article.title }).click();

        await expect(page).toHaveURL(/#\/article\//);
        await expect(page.getByRole("link", { name: /Edit Article/ })).toBeHidden();
        await expect(page.getByRole("button", { name: /Delete Article/ })).toBeHidden();
    });

    test("ART-013 - deve exibir tags no artigo publicado", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await expect(page).toHaveURL(/#\/article\//);
        await expect(page.locator(".tag-list")).toContainText("playwright");
        await expect(page.locator(".tag-list")).toContainText("e2e");
    });

    test("ART-014 - usuário logado deve comentar em artigo", async ({ page }) => {
        const user = createUser();
        const article = createArticle();
        const comment = `Comentário Playwright ${Date.now()}`;

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByPlaceholder("Write a comment...").fill(comment);
        await page.getByRole("button", { name: "Post Comment" }).click();

        const commentCard = page.locator(".card").filter({ hasText: comment });

        await expect(commentCard).toContainText(comment);
        await expect(commentCard).toContainText(user.username);
    });

    test("ART-015 - usuário logado deve excluir próprio comentário", async ({ page }) => {
        const user = createUser();
        const article = createArticle();
        const comment = `Comentário para excluir ${Date.now()}`;

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByPlaceholder("Write a comment...").fill(comment);
        await page.getByRole("button", { name: "Post Comment" }).click();

        const commentCard = page.locator(".card").filter({ hasText: comment });

        await expect(commentCard).toContainText(comment);

        page.once("dialog", async (dialog) => {
            await dialog.accept();
        });

        await commentCard.getByRole("button").click();

        await expect(commentCard).not.toBeVisible();
    });

    test("ART-016 - não deve criar comentário vazio", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page
            .locator(".comment-form")
            .getByRole("button", { name: "Post Comment" })
            .click();

        await expect(page.getByText("There are no comments yet...")).toBeVisible();
    });

    test("ART-017 - usuário deslogado não deve ver campo de comentário", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);
        await logout(page, user.username);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();
        await articlePreview.getByRole("heading", { name: article.title }).click();

        await expect(page.getByPlaceholder("Write a comment...")).toBeHidden();
        await expect(
            page.getByText("Sign in or sign up to add comments on this article."),
        ).toBeVisible();
    });

    test("ART-018 - usuário logado deve favoritar artigo pelo Global Feed", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();

        const favoriteButton = articlePreview
            .locator("button.btn-sm.btn-outline-primary")
            .first();

        await favoriteButton.click();

        await expect(favoriteButton).toContainText("( 1 )");
    });

    test("ART-019 - usuário logado deve desfavoritar artigo pelo Global Feed", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();

        const favoriteButton = articlePreview
            .locator("button.btn-sm.btn-outline-primary")
            .first();

        await favoriteButton.click();
        await expect(favoriteButton).toContainText("( 1 )");

        await favoriteButton.click();
        await expect(favoriteButton).toContainText("( 0 )");
    });

    test("ART-020 - usuário logado deve favoritar artigo pelo próprio perfil", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page
            .getByRole("navigation")
            .getByRole("img", { name: user.username })
            .click();

        await page.getByRole("link", { name: /Profile/ }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();

        const favoriteButton = articlePreview
            .locator("button.btn-sm.btn-outline-primary")
            .first();

        await favoriteButton.click();

        await expect(favoriteButton).toContainText("( 1 )");
    });

    test("ART-021 - usuário logado deve desfavoritar artigo pelo próprio perfil", async ({ page }) => {
        const user = createUser();
        const article = createArticle();

        await registerUser(page, user);
        await publishArticle(page, article);

        await page
            .getByRole("navigation")
            .getByRole("img", { name: user.username })
            .click();

        await page.getByRole("link", { name: /Profile/ }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await expect(articlePreview).toBeVisible();

        const favoriteButton = articlePreview
            .locator("button.btn-sm.btn-outline-primary")
            .first();

        await favoriteButton.click();
        await expect(favoriteButton).toContainText("( 1 )");

        await favoriteButton.click();
        await expect(favoriteButton).toContainText("( 0 )");
    });

    test("ART-022 - usuário logado deve seguir autor de artigo", async ({ page }) => {
        const author = createUser();
        const reader = createUser();
        const article = createArticle();

        await registerUser(page, author);
        await publishArticle(page, article);
        await logout(page, author.username);
        await registerUser(page, reader);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await articlePreview.getByText(author.username).click();

        const followButton = page.getByRole("button", { name: /Follow/ });

        await expect(followButton).toBeVisible();
        await followButton.click();

        await expect(page.getByRole("button", { name: /Unfollow/ })).toBeVisible();
    });

    test("ART-023 - usuário logado deve deixar de seguir autor de artigo", async ({ page }) => {
        const author = createUser();
        const reader = createUser();
        const article = createArticle();

        await registerUser(page, author);
        await publishArticle(page, article);
        await logout(page, author.username);
        await registerUser(page, reader);

        await page.getByRole("link", { name: "Home" }).click();
        await page.getByRole("button", { name: "Global Feed" }).click();

        const articlePreview = page
            .locator(".article-preview")
            .filter({ hasText: article.title });

        await articlePreview.getByText(author.username).click();

        const followButton = page.getByRole("button", { name: /Follow/ });

        await followButton.click();

        const unfollowButton = page.getByRole("button", { name: /Unfollow/ });

        await expect(unfollowButton).toBeVisible();
        await unfollowButton.click();

        await expect(page.getByRole("button", { name: /Follow/ })).toBeVisible();
    });
});