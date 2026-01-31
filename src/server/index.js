// Диагностическая информация при запуске
console.log('🚀 Инициализация сервера...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('Exec path:', process.execPath);
console.log('Is PKG:', typeof process.pkg !== 'undefined');

// Загрузка модулей
let express, cors, fs, path, ServerSetup;

try {
  express = require('express');
  cors = require('cors');
  fs = require('fs-extra');
  path = require('path');
  ServerSetup = require('./utils/serverSetup');
  console.log('✅ Все модули загружены успешно');
} catch (error) {
  console.error('❌ Ошибка загрузки модулей:', error.message);
  console.error('Stack:', error.stack);
  console.log('\n⚠️  Окно закроется через 30 секунд...');
  setTimeout(() => process.exit(1), 30000);
  // Блокируем дальнейшее выполнение
  while(true) {
    // Ждем закрытия
  }
}

// Обработка необработанных ошибок для предотвращения немедленного закрытия
process.on('uncaughtException', (error) => {
  console.error('\n❌ Необработанная ошибка:', error.message);
  console.error('Stack trace:', error.stack);
  console.error('\nПодробности ошибки:', error);
  
  // Пауза перед закрытием (особенно важно для Windows exe)
  console.log('\n⚠️  Окно закроется через 30 секунд...');
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Необработанное отклонение промиса:', reason);
  if (reason && reason.stack) {
    console.error('Stack trace:', reason.stack);
  }
  console.log('\n⚠️  Окно закроется через 30 секунд...');
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

const app = express();

// Инициализация ServerSetup для управления путями, запуском сервера и браузера
let serverSetup;
try {
  serverSetup = new ServerSetup();
  console.log('✅ ServerSetup инициализирован');
} catch (error) {
  console.error('❌ Ошибка инициализации ServerSetup:', error);
  console.error('Stack:', error.stack);
  console.log('\n⚠️  Окно закроется через 30 секунд...');
  setTimeout(() => process.exit(1), 30000);
  while(true) {}
}

// Переменные для хранения путей к файлам данных
let GAME_ITEMS_FILE = null;
let STATISTICS_FILE = null;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация файлов данных
async function initializeData() {
  try {
    // Проверяем, что методы доступны
    if (!serverSetup || typeof serverSetup.getGameItemsFile !== 'function') {
      throw new Error(`serverSetup.getGameItemsFile is not a function. Type: ${typeof serverSetup?.getGameItemsFile}`);
    }
    if (typeof serverSetup.getStatisticsFile !== 'function') {
      throw new Error(`serverSetup.getStatisticsFile is not a function. Type: ${typeof serverSetup?.getStatisticsFile}`);
    }
    
    console.log('🔍 Вызов getGameItemsFile...');
    // Получаем пути к файлам данных (с проверкой существования)
    GAME_ITEMS_FILE = await serverSetup.getGameItemsFile();
    console.log('🔍 Вызов getStatisticsFile...');
    STATISTICS_FILE = await serverSetup.getStatisticsFile();
    
    // Проверяем, что пути получены
    if (!GAME_ITEMS_FILE || !STATISTICS_FILE) {
      throw new Error(`Не удалось получить пути к файлам данных. GAME_ITEMS_FILE: ${GAME_ITEMS_FILE}, STATISTICS_FILE: ${STATISTICS_FILE}`);
    }
    
    // Инициализируем директории данных через ServerSetup
    await serverSetup.initializeDataDir();

    // Проверяем существование файлов и создаем, если их нет
    const gameItemsExists = await fs.pathExists(GAME_ITEMS_FILE);
    if (!gameItemsExists) {
      // Создаем файл с начальными данными
      const defaultItems = [
        {
          id: 1,
          name: 'Рубель',
          image: 'https://via.placeholder.com/400x400?text=Рубель',
          options: [
            'Для глажения белья',
            'Для приготовления пищи',
            'Для музицирования'
          ],
          correctAnswer: 0,
          historicalInfo: 'Рубель использовался для глажения белья до появления утюгов. Мокрое белье наматывали на валик и прокатывали рубелем.',
          additionalInfo: 'В Уткиной даче прачечная располагалась в служебном корпусе',
          catalogId: 'rubel-001',
          enabled: true
        }
      ];
      await fs.writeJson(GAME_ITEMS_FILE, defaultItems, { spaces: 2 });
      console.log('✅ Создан файл gameItems.json с начальными данными');
    }

    const statisticsExists = await fs.pathExists(STATISTICS_FILE);
    if (!statisticsExists) {
      // Создаем пустой файл статистики
      await fs.writeJson(STATISTICS_FILE, [], { spaces: 2 });
      console.log('✅ Создан файл statistics.json');
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации данных:', error);
  }
}

// ==================== API для игровых предметов ====================

// GET /api/items - получить все включенные предметы
app.get('/api/items', async (req, res) => {
  try {
    if (!GAME_ITEMS_FILE) {
      GAME_ITEMS_FILE = await serverSetup.getGameItemsFile();
    }
    
    const exists = await fs.pathExists(GAME_ITEMS_FILE);
    if (exists) {
      const items = await fs.readJson(GAME_ITEMS_FILE);
      // Возвращаем только включенные предметы
      const enabledItems = Array.isArray(items) ? items.filter(item => item.enabled !== false) : [];
      res.json(enabledItems);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка чтения gameItems:', error);
    res.status(500).json({ error: 'Не удалось загрузить предметы' });
  }
});

// GET /api/items/all - получить все предметы (включая отключенные) для админки
app.get('/api/items/all', async (req, res) => {
  try {
    if (!GAME_ITEMS_FILE) {
      GAME_ITEMS_FILE = await serverSetup.getGameItemsFile();
    }
    
    const exists = await fs.pathExists(GAME_ITEMS_FILE);
    if (exists) {
      const items = await fs.readJson(GAME_ITEMS_FILE);
      res.json(Array.isArray(items) ? items : []);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка чтения gameItems:', error);
    res.status(500).json({ error: 'Не удалось загрузить предметы' });
  }
});

// POST /api/items - создать новый предмет
app.post('/api/items', async (req, res) => {
  try {
    if (!GAME_ITEMS_FILE) {
      GAME_ITEMS_FILE = await serverSetup.getGameItemsFile();
    }
    
    if (!GAME_ITEMS_FILE) {
      GAME_ITEMS_FILE = await serverSetup.getGameItemsFile();
    }
    
    if (GAME_ITEMS_FILE) {
      await fs.ensureDir(path.dirname(GAME_ITEMS_FILE));
    }
    
    let items = [];
    if (GAME_ITEMS_FILE && await fs.pathExists(GAME_ITEMS_FILE)) {
      items = await fs.readJson(GAME_ITEMS_FILE);
    }
    
    const newItem = {
      id: Math.max(...items.map(m => m.id || 0), 0) + 1,
      enabled: req.body.enabled !== undefined ? req.body.enabled : true,
      ...req.body
    };
    
    items.push(newItem);
    await fs.writeJson(GAME_ITEMS_FILE, items, { spaces: 2 });
    
    res.json(newItem);
  } catch (error) {
    console.error('Ошибка создания предмета:', error);
    res.status(500).json({ error: 'Не удалось создать предмет' });
  }
});

// PUT /api/items/:id - обновить предмет
app.put('/api/items/:id', async (req, res) => {
  try {
    if (!GAME_ITEMS_FILE) {
      GAME_ITEMS_FILE = await serverSetup.getGameItemsFile();
    }
    
    const exists = await fs.pathExists(GAME_ITEMS_FILE);
    if (!exists) {
      return res.status(404).json({ error: 'Файл предметов не найден' });
    }
    
    const items = await fs.readJson(GAME_ITEMS_FILE);
    const id = parseInt(req.params.id);
    const index = items.findIndex(m => m.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }
    
    items[index] = { ...items[index], ...req.body, id };
    await fs.writeJson(GAME_ITEMS_FILE, items, { spaces: 2 });
    
    res.json(items[index]);
  } catch (error) {
    console.error('Ошибка обновления предмета:', error);
    res.status(500).json({ error: 'Не удалось обновить предмет' });
  }
});

// DELETE /api/items/:id - удалить предмет
app.delete('/api/items/:id', async (req, res) => {
  try {
    if (!GAME_ITEMS_FILE) {
      GAME_ITEMS_FILE = await serverSetup.getGameItemsFile();
    }
    
    const exists = await fs.pathExists(GAME_ITEMS_FILE);
    if (!exists) {
      return res.status(404).json({ error: 'Файл предметов не найден' });
    }
    
    const items = await fs.readJson(GAME_ITEMS_FILE);
    const id = parseInt(req.params.id);
    const filteredItems = items.filter(m => m.id !== id);
    
    if (filteredItems.length === items.length) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }
    
    // Удаляем статистику для этого предмета
    if (STATISTICS_FILE) {
      const statsExists = await fs.pathExists(STATISTICS_FILE);
      if (statsExists) {
        const stats = await fs.readJson(STATISTICS_FILE);
        const filteredStats = stats.filter(s => s.itemId !== id);
        await fs.writeJson(STATISTICS_FILE, filteredStats, { spaces: 2 });
      }
    }
    
    await fs.writeJson(GAME_ITEMS_FILE, filteredItems, { spaces: 2 });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления предмета:', error);
    res.status(500).json({ error: 'Не удалось удалить предмет' });
  }
});

// ==================== API для статистики ====================

// GET /api/statistics - получить всю статистику
app.get('/api/statistics', async (req, res) => {
  try {
    if (!STATISTICS_FILE) {
      STATISTICS_FILE = await serverSetup.getStatisticsFile();
    }
    
    const exists = await fs.pathExists(STATISTICS_FILE);
    if (exists) {
      const statistics = await fs.readJson(STATISTICS_FILE);
      res.json(Array.isArray(statistics) ? statistics : []);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка чтения статистики:', error);
    res.status(500).json({ error: 'Не удалось загрузить статистику' });
  }
});

// POST /api/statistics - сохранить статистику ответа
app.post('/api/statistics', async (req, res) => {
  try {
    if (!STATISTICS_FILE) {
      STATISTICS_FILE = await serverSetup.getStatisticsFile();
    }
    
    await fs.ensureDir(path.dirname(STATISTICS_FILE));
    
    let statistics = [];
    if (await fs.pathExists(STATISTICS_FILE)) {
      statistics = await fs.readJson(STATISTICS_FILE);
    }
    
    const { itemId, selectedAnswer, isCorrect } = req.body;
    
    // Ищем существующую запись для этого предмета
    let statEntry = statistics.find(s => s.itemId === itemId);
    
    if (statEntry) {
      statEntry.totalAnswers = (statEntry.totalAnswers || 0) + 1;
      statEntry.correctAnswers = (statEntry.correctAnswers || 0) + (isCorrect ? 1 : 0);
      
      if (!statEntry.answerStats) {
        statEntry.answerStats = {};
      }
      const answerKey = `option_${selectedAnswer}`;
      statEntry.answerStats[answerKey] = (statEntry.answerStats[answerKey] || 0) + 1;
      
      statEntry.accuracy = ((statEntry.correctAnswers / statEntry.totalAnswers) * 100).toFixed(2);
    } else {
      statEntry = {
        itemId,
        totalAnswers: 1,
        correctAnswers: isCorrect ? 1 : 0,
        answerStats: {
          [`option_${selectedAnswer}`]: 1
        },
        accuracy: isCorrect ? '100.00' : '0.00'
      };
      statistics.push(statEntry);
    }
    
    await fs.writeJson(STATISTICS_FILE, statistics, { spaces: 2 });
    
    res.json(statEntry);
  } catch (error) {
    console.error('Ошибка сохранения статистики:', error);
    res.status(500).json({ error: 'Не удалось сохранить статистику' });
  }
});

// Запуск сервера (проверка index.html и настройка статики — внутри startServer)
async function startServer() {
  try {
    console.log('🚀 Запуск сервера...');
    await initializeData();

    const indexExists = await serverSetup.checkIndexHtml();
    if (!indexExists) {
      throw new Error(`index.html не найден. Выполните в корне проекта: npm run build`);
    }
    serverSetup.setupStaticFiles(app, express);

    await serverSetup.startServer(app, async () => {
      const buildDir = serverSetup.getBuildDir();
      console.log(`✅ Сервер готов к работе`);
      if (GAME_ITEMS_FILE) {
        console.log(`📁 Данные в: ${path.dirname(GAME_ITEMS_FILE)}`);
      } else {
        const dataPath = await serverSetup.getGameItemsFile();
        console.log(`📁 Данные в: ${path.dirname(dataPath)}`);
      }
    });
  } catch (error) {
    console.error('❌ Критическая ошибка при запуске сервера:', error);
    console.error('Stack trace:', error.stack);
    
    // Пауза перед закрытием
    console.log('\n⚠️  Окно закроется через 30 секунд или нажмите любую клавишу...');
    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
      } catch (e) {
        // Если не удалось настроить stdin
      }
    }
    setTimeout(() => {
      process.exit(1);
    }, 30000);
  }
}

startServer().catch((error) => {
  console.error('❌ Ошибка при запуске:', error);
  console.error('Stack trace:', error.stack);
  
  // Пауза перед закрытием
    console.log('\n⚠️  Окно закроется через 30 секунд или нажмите любую клавишу...');
    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
      } catch (e) {
        // Если не удалось настроить stdin, просто ждем
      }
    }
    setTimeout(() => {
      process.exit(1);
    }, 30000);
});
