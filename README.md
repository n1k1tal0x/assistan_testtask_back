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
  и созданная заявка с сгенерированным `id` и статусом `pending`.
- `GET /requests` (`src/routes/requests.ts`) — список заявок с опциональным фильтром `?status=`
  (`pending`/`approved`/`rejected`) и пагинацией `?page=`/`?limit=` (по умолчанию `page=1`,
  `limit=10`, максимум `100`). Требует заголовок `x-list-password` со значением из `LIST_PASSWORD`
  (переменная окружения, читается из `.env` через `dotenv`; см. `.env.example`) — без заголовка
  или с неверным значением возвращает `401`.

- Code-first схема БД на Drizzle ORM (`src/db/schema.ts`) — таблица `vacation_requests` и
  таблица `request_statuses` (FK на `vacation_requests.id`, enum-статус, по умолчанию `pending`)
  описаны в TypeScript и являются источником истины.
- `drizzle.config.ts` + `npm run db:generate` — генерация SQL-миграций из схемы
  (миграции уже сгенерированы в `drizzle/`).
- `npm run db:migrate` (`src/db/migrate.ts`) — применение миграций к БД, заданной через `DATABASE_URL`.
- `src/db/client.ts` — Drizzle-клиент для подключения к PostgreSQL.

Хранилище заявок в рантайме (`src/requests.store.ts`) пока не переключено на БД — оно по-прежнему
в памяти процесса, статус там хранится прямо на объекте заявки. Одобрение/отклонение заявки
пока не реализованы.

## Подход к БД: code-first

Схема базы данных не пишется вручную в виде `.sql`-файлов. Таблицы описаны в коде на TypeScript
(`src/db/schema.ts`, Drizzle ORM), а SQL-миграции для PostgreSQL генерируются из этого кода
командой `npm run db:generate` и применяются командой `npm run db:migrate`. Источник истины —
код приложения, а не отдельно поддерживаемая SQL-схема.
