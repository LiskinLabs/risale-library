# Self-Hosting с Docker/Podman Compose

## Стек

| Сервис | Образ | Описание |
|---|---|---|
| **client** | `ghcr.io/LiskinLabs/risale-ai-studio` | Risale Digital Library фронтенд |
| **db** | `supabase/postgres` | psql база данных с расширениями supabase |
| **kong** | `kong:2.8.1` | API gateway для маршрутизации запросов к сервисам supabase |
| **auth** | `supabase/gotrue:v2.185.0` | Сервис авторизации (email, JWT) |
| **rest** | `postgrest/postgrest:v14.3` | psql REST API |
| **minio** | `minio/minio` | S3-совместимое хранилище |
| **minio-setup** | `minio/mc` | Вспомогательный контейнер для создания S3 buckets |

### Порты

| Порт | Сервис |
|---|---|
| `3000` | Risale AI Studio |
| `8000` | Kong API gateway |
| `9000` | MinIO S3 API |
| `9001` | MinIO консоль |

---

## Запуск с Docker/Podman Compose

### 1. Настройка .env

```bash
cp docker/.env.example docker/.env
```

Обновите `docker/.env`:

- Задайте `POSTGRES_PASSWORD` — надёжный пароль (32+ символов)
- Задайте `JWT_SECRET` — случайный секрет (32+ символов)
- Сгенерируйте `ANON_KEY` и `SERVICE_ROLE_KEY` как HS256 JWT, подписанные вашим `JWT_SECRET` (используйте [jwt.io](https://jwt.io/)):
  - `ANON_KEY` payload: `{"role": "anon"}`
  - `SERVICE_ROLE_KEY` payload: `{"role": "service_role"}`
- Задайте `MINIO_ROOT_PASSWORD` — надёжный пароль

### 2. Запуск стека (готовый образ)

Из директории `docker/`:

```bash
cd docker
docker compose up -d
```

Это загрузит `${RISALE_IMAGE}` (по умолчанию: `ghcr.io/LiskinLabs/risale-ai-studio:latest`) вместо локальной сборки.
Веб-клиент читает `SUPABASE_PUBLIC_URL`, `SUPABASE_ANON_KEY`, `API_BASE_URL`, `OBJECT_STORAGE_TYPE`, `STORAGE_FIXED_QUOTA` и `TRANSLATION_FIXED_QUOTA` из переменных окружения контейнера.

Если вы предпочитаете Docker Hub, задайте `RISALE_IMAGE` в `docker/.env`:

```env
RISALE_IMAGE=docker.io/your-dockerhub-username/risale-ai-studio:latest
```

Доступные теги:
- `latest`: rolling образ из основной ветки и релизов
- `<release-tag>` (например `v1.2.3`): публикуется при релизах
- `main`: rolling образ из основной ветки
- `sha-<commit>`: иммутабельный тег коммита

### Локальная сборка

> **Требования для локальной сборки**: git submodule `packages/foliate-js` и `packages/simplecc-wasm` должны быть инициализированы:
> ```bash
> git submodule update --init packages/foliate-js packages/simplecc-wasm
> ```

```bash
cd docker
docker compose -f compose.yaml -f compose.build.yaml up --build -d
```

### 3. Доступ

- Risale AI Studio: `http://localhost:3000`
- MinIO консоль: `http://localhost:9001` (логин: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)

### Hot Reload (разработка)

> **Требования**: submodule должны быть инициализированы (см. выше).

Для разработки используйте `compose.dev.yaml`, который устанавливает цель сборки `development-stage` (Next.js dev server) и монтирует локальный репозиторий для hot reload:

```bash
cd docker
docker compose -f compose.yaml -f compose.dev.yaml up --build -d
```

### Остановка стека

```bash
cd docker
docker compose down
```

Для удаления также и томов (данные БД и хранилища):

```bash
cd docker
docker compose down -v
```

---

## Самостоятельная сборка Dockerfile

```bash
docker build \
  --target production-stage \
  --build-arg NEXT_PUBLIC_APP_PLATFORM=web \
  -t risale-ai-studio-client \
  .
```

Запуск собранного образа:

```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=http://host.docker.internal:8000 \
  -e SUPABASE_PUBLIC_URL=http://localhost:8000 \
  -e SUPABASE_ANON_KEY=<anon-key> \
  -e SUPABASE_ADMIN_KEY=<service-role-key> \
  -e API_BASE_URL=http://localhost:3000 \
  -e OBJECT_STORAGE_TYPE=s3 \
  -e S3_ENDPOINT=http://host.docker.internal:9000 \
  -e S3_PUBLIC_ENDPOINT=http://localhost:9000 \
  -e S3_REGION=us-east-1 \
  -e S3_BUCKET_NAME=risale-ai-studio-files \
  -e S3_ACCESS_KEY_ID=<minio-user> \
  -e S3_SECRET_ACCESS_KEY=<minio-password> \
  -e STORAGE_FIXED_QUOTA=1073741824 \
  -e TRANSLATION_FIXED_QUOTA=50000 \
  risale-ai-studio-client
```

На Linux, если Docker не разрешает `host.docker.internal`, замените его на IP хоста или запустите с:
`--add-host=host.docker.internal:host-gateway`.
