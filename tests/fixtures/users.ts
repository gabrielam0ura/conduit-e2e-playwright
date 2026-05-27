export type TestUser = {
    username: string;
    email: string;
    password: string;
};

export function createUser(password = "gaba123"): TestUser {
    const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    return {
        username: `gabriela_${id}`,
        email: `gabriela_${id}@mail.com`,
        password,
    };
}