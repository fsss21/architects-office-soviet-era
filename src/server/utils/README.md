# ServerSetup - Переиспользуемый модуль для настройки сервера

Модуль `ServerSetup` предоставляет переиспользуемую логику для запуска Express сервера с поддержкой:

- Определения путей для разработки и сборки через pkg
- Автоматического открытия браузера в kiosk режиме (Windows)
- Настройки статических файлов для SPA приложений

## Установка

Скопируйте файл `serverSetup.js` в ваш проект:

```bash
cp server/utils/serverSetup.js <ваш-проект>/server/utils/serverSetup.js
```

Убедитесь, что у вас установлены зависимости:

- `express`
- `fs-extra`
- `cors` (опционально, для вашего приложения)

## Переменные окружения

Модуль поддерживает управление настройками через переменные окружения:

- `PORT` - порт сервера (по умолчанию: 3001)
- `KIOSK_MODE` - включить/выключить kiosk режим (по умолчанию: true)
  - `KIOSK_MODE=true` - полноэкранный kiosk режим (DevTools недоступны)
  - `KIOSK_MODE=false` - обычный режим (DevTools доступны и автоматически открываются)
- `KIOSK_OPEN_BROWSER` - автоматически открывать браузер (по умолчанию: true)
- `KIOSK_BROWSER_DELAY` - задержка перед открытием браузера в миллисекундах (по умолчанию: 1000)

**Пример использования:**

```bash
# При разработке через node - переменные окружения
KIOSK_MODE=false node server/index.js

# При запуске exe файла (собранного через pkg) - аргументы командной строки
launch.exe --no-kiosk-mode
launch.exe --kiosk-mode=false

# Или через config.json файл (создать рядом с exe)
{
  "kioskMode": false,
  "port": 3001
}
```

**Приоритет конфигурации** (от высшего к низшему):

1. **Аргументы командной строки** (`--kiosk-mode=false`, `--no-kiosk-mode`)
2. **Переменные окружения** (`KIOSK_MODE=false`) - работают только при запуске через node
3. **Файл config.json** (рядом с exe или в корне проекта)
4. **Опции конструктора**
5. **Значения по умолчанию**

**Аргументы командной строки:**

- `--kiosk-mode=false` или `--no-kiosk-mode` - отключить kiosk режим
- `--kiosk-mode=true` - включить kiosk режим
- `--open-browser=false` или `--no-open-browser` - не открывать браузер автоматически
- `--port=3002` - изменить порт

**Файл config.json** (создается рядом с exe файлом или в корне проекта):

```json
{
  "kioskMode": false,
  "openBrowser": true,
  "port": 3001,
  "browserDelay": 1000
}
```

## Использование

### Базовый пример

```javascript
const express = require('express');
const ServerSetup = require('./utils/serverSetup');

const app = express();

// Инициализация ServerSetup
const serverSetup = new ServerSetup({
  port: 3001,
  dataFileName: 'data.json',
});

// Получаем путь к файлу данных
const DATA_FILE = serverSetup.getDataFile();

// Настройка API маршрутов
app.get('/api/data', (req, res) => {
  // ваша логика
});

// Настройка статических файлов (должно быть после API маршрутов)
serverSetup.setupStaticFiles(app, express);

// Запуск сервера
async function start() {
  await serverSetup.initializeDataDir();
  await serverSetup.startServer(app);
}

start().catch(console.error);
```

### Полный пример с кастомными настройками

```javascript
const express = require('express');
const ServerSetup = require('./utils/serverSetup');

const app = express();

const serverSetup = new ServerSetup({
  // Порт сервера
  port: process.env.PORT || 3001,

  // Путь к директории со статическими файлами (относительно baseDir)
  // Если не указан, используется автоматическое определение:
  // - при разработке: 'build'
  // - при pkg: '.' (текущая директория exe)
  buildDirPath: null,

  // Путь к директории данных (относительно baseDir)
  // Если не указан, используется автоматическое определение:
  // - при разработке: 'public/data'
  // - при pkg: 'data'
  dataPath: null,

  // Имя файла данных
  dataFileName: 'my-data.json',

  // Автоматически открывать браузер
  openBrowser: true,

  // Задержка перед открытием браузера (мс)
  browserDelay: 1000,

  // Kiosk режим (полноэкранный режим браузера)
  kioskMode: true,

  // Путь к index.html (для SPA fallback)
  indexHtmlPath: 'index.html',
});

// Получение путей
const DATA_FILE = serverSetup.getDataFile();
const BUILD_DIR = serverSetup.getBuildDir();
const BASE_DIR = serverSetup.getBaseDir();

// Получение URL
const appUrl = serverSetup.getAppUrl(); // http://localhost:3001
const apiUrl = serverSetup.getApiUrl(); // http://localhost:3001/api

// Проверка режима запуска
if (serverSetup.isPkgMode()) {
  console.log('Запущено через pkg');
} else {
  console.log('Запущено через node');
}

// Middleware
app.use(express.json());

// API маршруты
app.get('/api/data', async (req, res) => {
  // ваша логика
});

// Настройка статических файлов
serverSetup.setupStaticFiles(app, express);

// Запуск с дополнительной логикой
async function start() {
  // Инициализация директории данных
  await serverSetup.initializeDataDir();

  // Запуск сервера с callback после старта
  await serverSetup.startServer(app, async () => {
    console.log('Сервер готов!');
    // дополнительная логика после запуска
  });
}

start().catch(console.error);
```

## API

### Конструктор `new ServerSetup(options)`

Создает экземпляр ServerSetup с указанными опциями.

**Параметры:**

- `options.port` - порт сервера (переопределяется через `process.env.PORT`)
- `options.buildDirPath` - путь к директории со статическими файлами (автоопределение если null)
- `options.dataPath` - путь к директории данных (автоопределение если null)
- `options.dataFileName` - имя файла данных (по умолчанию: 'data.json')
- `options.openBrowser` - автоматически открывать браузер (переопределяется через `process.env.KIOSK_OPEN_BROWSER`, по умолчанию: true)
- `options.browserDelay` - задержка перед открытием браузера в мс (переопределяется через `process.env.KIOSK_BROWSER_DELAY`, по умолчанию: 1000)
- `options.kioskMode` - kiosk режим браузера (переопределяется через `process.env.KIOSK_MODE`, по умолчанию: true)
- `options.indexHtmlPath` - путь к index.html (по умолчанию: 'index.html')

**Важно:** Переменные окружения имеют приоритет над опциями конструктора!

### Методы

#### `getBaseDir()`

Возвращает базовую директорию проекта.

#### `getBuildDir()`

Возвращает директорию со статическими файлами (build).

#### `getDataFile()`

Возвращает полный путь к файлу данных.

#### `isPkgMode()`

Возвращает `true`, если приложение запущено через pkg.

#### `getAppUrl()`

Возвращает URL приложения (например, `http://localhost:3001`).

#### `getApiUrl()`

Возвращает URL API (например, `http://localhost:3001/api`).

#### `checkIndexHtml()`

Асинхронно проверяет существование index.html. Возвращает `Promise<boolean>`.

#### `openBrowser()`

Асинхронно открывает браузер в kiosk режиме (только Windows). Возвращает `Promise<void>`.

#### `initializeDataDir()`

Асинхронно создает директорию для данных, если она не существует. Возвращает `Promise<boolean>`.

#### `logServerInfo()`

Выводит информацию о конфигурации сервера в консоль.

#### `setupStaticFiles(app, express)`

Настраивает Express для раздачи статических файлов и SPA роутинга.

**Параметры:**

- `app` - Express приложение
- `express` - модуль Express (для `express.static`)

#### `startServer(app, onReady)`

Асинхронно запускает сервер и открывает браузер. Возвращает `Promise<void>`.

**Параметры:**

- `app` - Express приложение
- `onReady` - опциональная callback функция, вызываемая после запуска сервера

## Структура проекта

Рекомендуемая структура проекта:

```
проект/
├── server/
│   ├── utils/
│   │   └── serverSetup.js  # этот модуль
│   └── index.js            # ваш сервер
├── public/
│   └── data/
│       └── data.json       # файл данных (при разработке)
├── build/
│   ├── data/
│   │   └── data.json       # файл данных (при сборке)
│   └── index.html          # статические файлы
└── package.json
```

При сборке через pkg файл `build/data/data.json` будет включен в exe (настраивается в `package.json` секции `pkg.assets`).

## Особенности

- **Автоматическое определение путей**: модуль автоматически определяет правильные пути для разработки и сборки
- **Поддержка pkg**: полная поддержка сборки через `pkg` с правильным определением путей
- **Kiosk режим**: автоматическое открытие браузера в полноэкранном режиме (Windows)
- **SPA роутинг**: автоматическая настройка fallback для SPA приложений
