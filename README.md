# GitHub Batch Cloner CLI

O **GitHub Batch Cloner CLI** é um script de linha de comando em Node.js projetado para facilitar o processo de clonar múltiplos repositórios do GitHub de uma só vez. Ele utiliza a API do GitHub para listar todos os seus repositórios e realiza o clone de forma paralela, economizando bastante tempo.

## 🚀 Funcionalidades

- Lista automaticamente todos os seus repositórios (incluindo privados, dependendo das permissões do token).
- Clona repositórios em paralelo (máximo de 10 simultâneos) para maior velocidade.
- Suporta métodos de clonagem via **SSH** ou **HTTPS**.
- Barra de progresso visual no terminal.
- Ignora repositórios que já foram clonados (não sobrescreve diretórios existentes).
- Relatório de erros no final do processo.

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada).
- [Git](https://git-scm.com/) instalado e configurado na máquina.
- Um **Personal Access Token (PAT)** do GitHub com a permissão `repo` (Full control of private repositories).

## 🛠️ Como usar

1. Clone ou baixe este projeto.
2. Acesse o diretório do projeto no terminal.
3. Execute o script com o Node.js:

```bash
node clone-repos.mjs
```

4. O CLI fará algumas perguntas interativas:
   - **Usuário do GitHub:** Seu nome de usuário.
   - **Personal Access Token (PAT):** Seu token gerado no GitHub.
   - **Diretório raiz:** Onde os repositórios serão salvos (ex: `~/Projetos`).
   - **Método de clone:** Escolha entre `ssh` ou `https`.

## 🐧 Como gerar um executável no Linux

Se você deseja rodar esta ferramenta de qualquer lugar do sistema sem precisar chamar o `node` explicitamente, existem duas abordagens principais no Linux:

### Método 1: Tornar o script executável (Recomendado e mais simples)

Como o arquivo já possui a shebang `#!/usr/bin/env node` na primeira linha, você pode simplesmente dar permissão de execução a ele e movê-lo para um diretório que esteja no seu `$PATH`.

1. Dê permissão de execução ao arquivo:
   ```bash
   chmod +x clone-repos.mjs
   ```

2. (Opcional) Renomeie e mova para uma pasta binária do sistema para usar como um comando global:
   ```bash
   sudo mv clone-repos.mjs /usr/local/bin/github-cloner
   ```

3. Agora você pode executar a ferramenta de qualquer lugar digitando apenas:
   ```bash
   github-cloner
   ```

### Método 2: Criar um binário standalone compilado (Sem dependência do Node.js)

Se você quiser criar um arquivo binário verdadeiro (que embute o Node.js e o script em um único arquivo executável), você pode usar ferramentas como o [pkg](https://github.com/vercel/pkg) ou o [Bun](https://bun.sh/).

**Usando o Bun (Mais rápido e moderno):**
1. Instale o Bun, caso não tenha: `curl -fsSL https://bun.sh/install | bash`
2. Compile o script:
   ```bash
   bun build ./clone-repos.mjs --compile --outfile github-cloner
   ```
3. O comando acima gerará um arquivo executável chamado `github-cloner`. Você pode movê-lo para `/usr/local/bin/` ou executá-lo diretamente:
   ```bash
   ./github-cloner
   ```

**Usando o Node.js v21+ (Single Executable Applications - SEA):**
O Node.js agora possui suporte nativo para gerar executáveis. Para projetos simples, é uma excelente opção, embora exija alguns passos extras de configuração de um blob. Para scripts interativos como este, o Método 1 ou o compilador do Bun são as abordagens mais práticas.
