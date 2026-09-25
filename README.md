# Модуль «Заявка на отпуск» — Backend

## Стек

- Node.js + TypeScript
- Fastify
- PostgreSQL (поднимается через Docker Compose)
- Drizzle ORM + drizzle-kit — code-first схема и миграции

## Что реализовано сейчас

- Скелет Fastify-приложения на TypeScript (`src/index.ts`), один health-check роут `GET /` → `{ status: "ok" }`.
- `Dockerfile` — multi-stage сборка (build со `tsc`, затем лёгкий прод-образ только с `dist/`).
- `docker-compose.yml` — сервис `app` (порт `3000` наружу) и сервис `db` (`postgres:16-alpine`).
  БД не публикует порт наружу и не смотрит во внешнюю сеть — доступна только сервису `app`
  внутри внутренней docker-сети `internal`.
- Тип заявки `VacationRequest` (`src/types.ts`): `id`, `fullName`, `dateFrom`, `dateTo`, `reason`.
- Хранилище заявок в памяти процесса (`src/requests.store.ts`).
- `POST /requests` (`src/routes/requests.ts`) — создание заявки. Валидация: `fullName` и `reason`
  не могут быть пустыми, `dateFrom`/`dateTo` обязательны и должны быть корректными датами,
  `dateTo` не может быть раньше `dateFrom`. При ошибке — `400` с описанием, при успехе — `201`
  и созданная заявка с сгенерированным `id`.

- Code-first схема БД на Drizzle ORM (`src/db/schema.ts`) — таблица `vacation_requests` описана
  в TypeScript и является источником истины.
- `drizzle.config.ts` + `npm run db:generate` — генерация SQL-миграции из схемы
  (первая миграция уже сгенерирована в `drizzle/`).
- `npm run db:migrate` (`src/db/migrate.ts`) — применение миграций к БД, заданной через `DATABASE_URL`.
- `src/db/client.ts` — Drizzle-клиент для подключения к PostgreSQL.

Хранилище заявок в рантайме (`src/requests.store.ts`) пока не переключено на БД — оно по-прежнему
в памяти процесса. Список/фильтрация заявок и одобрение/отклонение пока не реализованы.

## Подход к БД: code-first

Схема базы данных не пишется вручную в виде `.sql`-файлов. Таблицы описаны в коде на TypeScript
(`src/db/schema.ts`, Drizzle ORM), а SQL-миграции для PostgreSQL генерируются из этого кода
командой `npm run db:generate` и применяются командой `npm run db:migrate`. Источник истины —
код приложения, а не отдельно поддерживаемая SQL-схема.
