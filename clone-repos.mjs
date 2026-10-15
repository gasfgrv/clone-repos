#!/usr/bin/env node

import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync, link, mkdirSync, read } from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

const execAsync = promisify(exec);

export function expandPath(filePath) {
    if (filePath.startsWith("~/") || filePath === "~") {
        return path.join(os.homedir(), filePath.slice(1));
    }

    return path.resolve(filePath);
}

export function getNextPage(linkHeader) {
    if (!linkHeader) {
        return null;
    }

    const nextlink = linkHeader.split(',').find(link => link.includes('rel="next"'));

    if (!nextlink) {
        return null;
    }

    const match = nextlink.match(/<([^>]+)>/);
    return match?.[1] ?? null;
}

export async function getRepositories(token, fetchImpl = fetch) {
    let url = 'https://api.github.com/user/repos?per_page=100&affiliation=owner';
    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NodeJS-Clone-CLI'
    };

    const repos = [];

    while (url) {
        const response = await fetchImpl(url, { headers });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        repos.push(...data);

        const linkHeader = response.headers.get('link');
        url = getNextPage(linkHeader);
    }

    return repos;
}

export async function cloneInParallel(repos, concurrencyLimit, method, username, token, rootDir, deps = {}) {
    let currentIndex = 0;

    let processed = 0;
    let cloned = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];
    const existsFn = deps.existsFn || existsSync;
    const execFn = deps.execFn || execAsync;
    const output = deps.stdout || process.stdout;

    function renderProgress() {
        const total = repos.length || 1;
        const width = 30;
        const percent = Math.floor((processed / total) * 100);

        const filledLength = Math.floor((width * processed) / total);
        const bar = '█'.repeat(filledLength) + '░'.repeat(width - filledLength);

        if (typeof output.clearLine === 'function') {
            output.clearLine(0);
            output.cursorTo(0);
        }

        if (typeof output.write === 'function') {
            output.write(`Progresso: [${bar}] ${percent}% | ⬇️  Clonados: ${cloned} | ⏭️  Pulados: ${skipped} | ❌ Erros: ${failed}`);
        }
    }

    async function worker() {
        while (currentIndex < repos.length) {
            const index = currentIndex++;
            const repo = repos[index];
            const targetPath = path.join(rootDir, repo.name);

            if (existsFn(targetPath)) {
                skipped++;
                processed++;
                renderProgress();
                continue;
            }

            const cloneUrl = method === 'ssh'
                ? repo.ssh_url
                : repo.clone_url.replace('https://', `https://${username}:${token}@`);

            try {
                await execFn(`git clone ${cloneUrl} "${targetPath}"`);
                cloned++;
            } catch (error) {
                failed++;
                errors.push({ repo: repo.name, message: error.message });
            } finally {
                processed++;
                renderProgress();
            }
        }
    }

    renderProgress();

    const workers = [];

    for (let i = 1; i <= Math.min(concurrencyLimit, repos.length); i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    if (typeof output.write === 'function') {
        output.write('\n');
    }

    return errors;
}

async function main() {
    const rl = readline.createInterface({ input, output });

    console.clear();
    console.log("==================================================");
    console.log("🚀 GitHub Batch Cloner CLI");
    console.log("==================================================\n");

    console.log("📌 INSTRUÇÕES PARA O TOKEN (PAT):");
    console.log("1. Acesse o GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)");
    console.log("2. Clique em 'Generate new token (classic)'");
    console.log("3. Dê um nome e marque a caixa 'repo' (Full control of private repositories)");
    console.log("4. Gere e copie o token (ele começa com 'ghp_').\n");

    try {
        const username = await rl.question("👤 Digite seu usuário do GitHub: ");

        if (!username) {
            throw new Error("Usuário não pode ser vazio.");
        }

        const token = await rl.question("🔑 Digite seu Personal Access Token (PAT): ");

        if (!token) {
            throw new Error("Token não pode ser vazio.");
        }

        let rootDirInput = await rl.question("📁 Digite o diretório raiz para os clones (ex: ~/Workspace): ");

        if (!rootDirInput) {
            rootDirInput = "./";
        }

        const rootDir = expandPath(rootDirInput);

        if (!existsSync(rootDir)) {
            console.log(`\nCriando diretório raiz: ${rootDir}...`);
            mkdirSync(rootDir, { recursive: true });
        }

        let method = await rl.question("🔗 Escolha o método de clone [ssh/https] (padrão: ssh): ");
        method = method.trim().toLowerCase() === 'https' ? 'https' : 'ssh';

        console.log("\n==================================================");
        console.log(`Resumo: Clonando repositórios de '${username}' via ${method.toUpperCase()} para '${rootDir}'`);
        console.log("==================================================\n");
        console.log("Buscando repositórios na API...");

        const repos = await getRepositories(token);
        console.log(`Foram encontrados ${repos.length} repositórios. Iniciando threads (Max 10)...\n`);

        const errors = await cloneInParallel(repos, 10, method, username, token, rootDir);

        console.log("\n🎉 Processamento concluído!");

        if (errors.length > 0) {
            console.log("\n⚠️  Relatório de Erros:");
            errors.forEach(err => {
                console.log(`- ${err.repo}: ${err.message.split('\n')[0]}`);
            });
        }
    } catch (error) {
        console.error("\n❌ Operação cancelada ou falhou:", error.message);
    } finally {
        rl.close();
    }

}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
    await main();
}
