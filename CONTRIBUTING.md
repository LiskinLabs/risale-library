# Руководство по внесению вклада

При участии в разработке Risale AI Studio:

- Будьте уважительны, вежливы и открыты к диалогу.
- Перед созданием нового pull request проверьте [существующие issues](https://github.com/LiskinLabs/risale-ai-studio/issues) на наличие известных проблем или исправлений.
- Если вы хотите внести изменения на основе личных предпочтений, сначала откройте issue с описанием предлагаемых изменений и создавайте pull request только после одобрения мейнтейнерами.

## Как внести вклад

### Начало работы

Чтобы не тратить время на реализацию изменений, которые уже были отклонены или не требуются, начните с [создания issue](https://github.com/LiskinLabs/risale-ai-studio/issues/new/choose) с описанием проблемы, которую вы хотите решить.

Для сборки Risale AI Studio вам понадобятся последние версии Node.js и Rust. Подробные инструкции по настройке окружения для разных платформ доступны в [документации Tauri](https://v2.tauri.app/start/prerequisites/).

Необходимые инструменты разработки:

- **Node.js** и **pnpm** для разработки Next.js
- **Rust** и **Cargo** для разработки Tauri

```bash
nvm install v24
nvm use v24
npm install -g pnpm
rustup update
```

### Быстрый старт

#### 1. Клонирование репозитория

```bash
git clone https://github.com/LiskinLabs/risale-ai-studio.git
cd risale-library
git submodule update --init --recursive
```

#### 2. Установка зависимостей

```bash
pnpm install
pnpm --filter @LiskinLabs/app setup-vendors
```

#### 3. Проверка установки

```bash
pnpm tauri info
```

Для Windows требуется "Build Tools for Visual Studio 2022" (или старшая редакция Visual Studio) с компонентом "Desktop development with C++". Для ARM64 дополнительно нужны "VS 2022 C++ ARM64 build tools" и "C++ Clang Compiler for Windows".

#### 4. Сборка для разработки

```bash
pnpm tauri dev
```

#### 5. Production сборка

```bash
pnpm tauri build
```

### Внесение изменений

Этот проект — монорепозиторий. Код основного приложения находится в `apps/readest-app/`. Полезные команды для разработки только фронтенда:

| Команда | Описание |
|---|---|
| `pnpm dev-web` | Запуск dev-сервера для Web версии |
| `pnpm build-web` | Сборка Web версии |

Рекомендуемые расширения VS Code:

- JavaScript and TypeScript Nightly (ms-vscode.vscode-typescript-next)
- Biome — Code formatter and linter (biomejs.biome)
- rust-analyzer (rust-lang.rust-analyzer) (только для Tauri)

### Перед отправкой изменений

Проверьте, что ваш код соответствует стилю проекта:

```bash
pnpm format:check
pnpm lint
pnpm test
```

Также выполните ручное функциональное тестирование ваших изменений. После этого создайте pull request с информативным заголовком и описанием.

---

*Этот документ вдохновлён руководством [cloudflare/wrangler2](https://github.com/cloudflare/wrangler2/blob/main/CONTRIBUTING.md).*
