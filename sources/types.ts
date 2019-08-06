export type Context = {
    labels: string[],
    repository: string,
    owner: string,
    issue: number,
    repro: string,
};

export type GithubEventFile = {
    action: string,
    issue: {
        body: string,
        labels: {name: string}[],
        number: number,
    },
    repository: {
        name: string,
        owner: {
            login: string,
        },
    },
};
