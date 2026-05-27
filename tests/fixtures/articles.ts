export type TestArticle = {
    title: string;
    description: string;
    body: string;
    tags?: string;
};

export function createArticle(): TestArticle {
    const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    return {
        title: `Artigo Playwright ${id}`,
        description: `Descrição do artigo ${id}`,
        body: `Conteúdo do artigo criado pelo teste ${id}`,
        tags: "playwright e2e",
    };
}