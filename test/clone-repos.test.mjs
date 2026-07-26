import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
    cloneInParallel,
    expandPath,
    getNextPage,
    getRepositories,
} from '../clone-repos.mjs';

test('expandPath converte ~ para o diretório home', () => {
    assert.equal(expandPath('~/Workspace'), path.join(os.homedir(), 'Workspace'));
    assert.equal(expandPath('./tmp'), path.resolve('./tmp'));
});

test('getNextPage extrai a URL do próximo link', () => {
    const header = '<https://api.github.com/user/repos?page=2>; rel="next", <https://api.github.com/user/repos?page=3>; rel="last"';

    assert.equal(getNextPage(header), 'https://api.github.com/user/repos?page=2');
    assert.equal(getNextPage('<https://api.github.com/user/repos?page=2>; rel="last"'), null);
});

test('getRepositories usa o fetch fornecido e retorna os repositórios', async () => {
    const fakeRepos = [{ name: 'repo-a' }, { name: 'repo-b' }];

    const fakeFetch = async (_url, _options) => ({
        ok: true,
        json: async () => fakeRepos,
        headers: {
            get: () => null,
        },
    });

    const repos = await getRepositories('token-123', fakeFetch);

    assert.deepEqual(repos, fakeRepos);
});

test('cloneInParallel pula diretórios existentes e registra falhas', async () => {
    const calls = [];
    const repos = [{ name: 'repo-a' }, { name: 'repo-b' }];

    const errors = await cloneInParallel(repos, 2, 'ssh', 'octocat', 'abc', '/tmp/clone-test', {
        existsFn: (targetPath) => targetPath.endsWith('repo-b'),
        execFn: async (command) => {
            calls.push(command);
            return { stdout: '', stderr: '' };
        },
    });

    assert.equal(calls.length, 1);
    assert.equal(errors.length, 0);
});
