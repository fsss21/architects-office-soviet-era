const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

/**
 * Конфигурация сервера — проект «Классический Петербург» (architects-office-soviet-era)
 * React + Vite, статика из build/, данные: catalogItems.json, progressPoints.json
 */
const CONFIG = {
  // Порт сервера (не конфликтует с Vite dev 5173)
  port: Number(process.env.PORT) || 3001,

  // Режим kiosk (полноэкранный режим)
  kioskMode: process.env.KIOSK_MODE === 'true',

  // Автоматически открывать браузер при запуске
  openBrowser: process.env.KIOSK_OPEN_BROWSER !== 'false',

  // Отключить проверку CORS в браузере (только для локальной разработки)
  disableWebSecurity: false,

  // Задержка перед открытием браузера (мс)
  browserDelay: Number(process.env.KIOSK_BROWSER_DELAY) || 1000,

  // Путь к index.html (сборка Vite → build/)
  indexHtmlPath: 'index.html',

  // Файлы данных проекта (относительно public/ или build/data/)
  gameItemsFile: path.join('data', 'catalogItems.json'),
  statisticsFile: path.join('data', 'progressPoints.json'),
};

/**
 * Класс для управления настройками и запуском сервера
 * Поддерживает как обычный запуск через node, так и сборку через pkg
 */
class ServerSetup {
  constructor() {
    try {
      // Определяем базовую директорию (корень проекта architects-office-soviet-era)
      // __dirname = src/server/utils → вверх 3 уровня = корень проекта; pkg: папка с exe (build/)
      this.isPkg = typeof process.pkg !== 'undefined';
      this.baseDir = this.isPkg ? path.dirname(process.execPath) : path.join(__dirname, '..', '..', '..');

      // Используем конфигурацию из CONFIG
      this.config = {
        port: CONFIG.port,
        kioskMode: CONFIG.kioskMode,
        openBrowser: CONFIG.openBrowser,
        disableWebSecurity: CONFIG.disableWebSecurity,
        browserDelay: CONFIG.browserDelay,
        indexHtmlPath: CONFIG.indexHtmlPath,
        gameItemsFile: CONFIG.gameItemsFile,
        statisticsFile: CONFIG.statisticsFile,
      };

      // Проверяем, что CONFIG правильно загружен
      if (!this.config.gameItemsFile || !this.config.statisticsFile) {
        throw new Error(`CONFIG не инициализирован правильно. gameItemsFile: ${this.config.gameItemsFile}, statisticsFile: ${this.config.statisticsFile}`);
      }

      // Директория со сборкой: Vite → build/ (vite.config.js outDir: 'build')
      if (this.isPkg) {
        this.buildDir = this.baseDir;
      } else {
        this.buildDir = path.join(this.baseDir, 'build');
      }

      // Пути к файлам данных (catalogItems.json, progressPoints.json)
      if (this.isPkg) {
        // В pkg режиме: данные в build/json/ (рядом с launch.exe)
        this.gameItemsFile = path.join(this.baseDir, this.config.gameItemsFile);
        this.statisticsFile = path.join(this.baseDir, this.config.statisticsFile);
        this.gameItemsFileFallback = null;
        this.statisticsFileFallback = null;
      } else {
        // В режиме разработки: сначала build/data/, затем public/data/
        const buildGameItemsPath = path.join(this.buildDir, this.config.gameItemsFile);
        const publicGameItemsPath = path.join(this.baseDir, 'public', this.config.gameItemsFile);
        const buildStatisticsPath = path.join(this.buildDir, this.config.statisticsFile);
        const publicStatisticsPath = path.join(this.baseDir, 'public', this.config.statisticsFile);
        
        this.gameItemsFile = buildGameItemsPath;
        this.gameItemsFileFallback = publicGameItemsPath;
        this.statisticsFile = buildStatisticsPath;
        this.statisticsFileFallback = publicStatisticsPath;
      }

      this.usingFallbackRoot = false;

      // Привязываем методы к контексту для pkg режима
      this.getGameItemsFile = this.getGameItemsFile.bind(this);
      this.getStatisticsFile = this.getStatisticsFile.bind(this);
    } catch (error) {
      console.error('❌ Ошибка в конструкторе ServerSetup:', error);
      throw error;
    }
  }

  /**
   * Получить базовую директорию
   */
  getBaseDir() {
    return this.baseDir;
  }

  /**
   * Получить директорию со статическими файлами
   */
  getBuildDir() {
    return this.buildDir;
  }

  /**
   * Получить путь к файлу gameItems.json
   * Проверяет существование файла и возвращает подходящий путь
   */
  async getGameItemsFile() {
    try {
      if (this.isPkg) {
        if (!this.gameItemsFile) {
          throw new Error('gameItemsFile не определен в pkg режиме');
        }
        return this.gameItemsFile;
      }
      
      if (!this.gameItemsFile) {
        throw new Error('gameItemsFile не определен');
      }
      
      // Проверяем существование файла в build/, если нет - используем public/
      if (typeof fs.pathExists !== 'function') {
        console.warn('⚠️  fs.pathExists не является функцией, используем прямой путь');
        return this.gameItemsFile;
      }
      
      const buildExists = await fs.pathExists(this.gameItemsFile);
      if (buildExists) {
        return this.gameItemsFile;
      }
      
      // Если файла нет в build/, проверяем public/
      if (this.gameItemsFileFallback) {
        const publicExists = await fs.pathExists(this.gameItemsFileFallback);
        if (publicExists) {
          return this.gameItemsFileFallback;
        }
      }
      
      // Если файла нет нигде, возвращаем путь к build/ (будет создан)
      return this.gameItemsFile;
    } catch (error) {
      console.error('❌ Ошибка в getGameItemsFile:', error);
      throw error;
    }
  }

  /**
   * Получить путь к файлу statistics.json
   * Проверяет существование файла и возвращает подходящий путь
   */
  async getStatisticsFile() {
    try {
      if (this.isPkg) {
        if (!this.statisticsFile) {
          throw new Error('statisticsFile не определен в pkg режиме');
        }
        return this.statisticsFile;
      }
      
      if (!this.statisticsFile) {
        throw new Error('statisticsFile не определен');
      }
      
      // Проверяем существование файла в build/, если нет - используем public/
      if (typeof fs.pathExists !== 'function') {
        console.warn('⚠️  fs.pathExists не является функцией, используем прямой путь');
        return this.statisticsFile;
      }
      
      const buildExists = await fs.pathExists(this.statisticsFile);
      if (buildExists) {
        return this.statisticsFile;
      }
      
      // Если файла нет в build/, проверяем public/
      if (this.statisticsFileFallback) {
        const publicExists = await fs.pathExists(this.statisticsFileFallback);
        if (publicExists) {
          return this.statisticsFileFallback;
        }
      }
      
      // Если файла нет нигде, возвращаем путь к build/ (будет создан)
      return this.statisticsFile;
    } catch (error) {
      console.error('❌ Ошибка в getStatisticsFile:', error);
      throw error;
    }
  }

  /**
   * Проверить, запущен ли через pkg
   */
  isPkgMode() {
    return this.isPkg;
  }

  /**
   * Получить URL приложения
   */
  getAppUrl() {
    return `http://localhost:${this.config.port}`;
  }

  /**
   * Получить URL API
   */
  getApiUrl() {
    return `http://localhost:${this.config.port}/api`;
  }

  /**
   * Проверить существование index.html и при необходимости подставить fallback (корень проекта)
   */
  async checkIndexHtml() {
    try {
      let indexFullPath = path.join(this.buildDir, this.config.indexHtmlPath);
      let exists = await fs.pathExists(indexFullPath);

      this.usingFallbackRoot = false;
      if (!exists) {
        // Fallback: при запуске через node — ищем index.html в корне проекта (без предварительного build)
        if (!this.isPkg) {
          const rootIndex = path.join(this.baseDir, this.config.indexHtmlPath);
          const rootExists = await fs.pathExists(rootIndex);
          if (rootExists) {
            this.buildDir = this.baseDir;
            this.usingFallbackRoot = true;
            indexFullPath = rootIndex;
            exists = true;
            console.log(`✅ Используется index.html из корня проекта (запуск без сборки): ${indexFullPath}`);
          }
        }
        // Fallback для pkg: exe в build/ — проверяем корень проекта (родитель build/)
        if (!exists && this.isPkg) {
          const parentDir = path.join(this.baseDir, '..');
          const parentIndex = path.join(parentDir, this.config.indexHtmlPath);
          const parentExists = await fs.pathExists(parentIndex);
          if (parentExists) {
            this.buildDir = parentDir;
            this.usingFallbackRoot = true;
            indexFullPath = parentIndex;
            exists = true;
            console.log(`✅ Используется index.html из корня проекта: ${indexFullPath}`);
          }
        }
      }

      if (!exists) {
        console.error(`\n❌ ОШИБКА: файл ${this.config.indexHtmlPath} не найден.`);
        console.log(`\n📂 Проверенные пути:`);
        console.log(`   ${path.join(this.buildDir, this.config.indexHtmlPath)}: ❌ не найден`);
        if (!this.isPkg) {
          console.log(`   ${path.join(this.baseDir, this.config.indexHtmlPath)}: ${await fs.pathExists(path.join(this.baseDir, this.config.indexHtmlPath)) ? '✅' : '❌'}`);
        }
        console.log(`\n💡 Выполните в корне проекта сборку фронтенда:`);
        console.log(`   npm run build`);
        console.log(`   Затем снова запустите сервер (или exe).`);
      } else if (!this.isPkg && this.buildDir === this.baseDir) {
        console.log(`✅ ${this.config.indexHtmlPath} найден: ${indexFullPath}`);
      } else {
        console.log(`✅ ${this.config.indexHtmlPath} найден: ${indexFullPath}`);
      }

      return exists;
    } catch (error) {
      console.error('❌ Ошибка при проверке index.html:', error);
      console.error('Stack:', error.stack);
      return false;
    }
  }

  /**
   * Открыть браузер в kiosk режиме (только для Windows)
   */
  async openBrowser() {
    if (!this.config.openBrowser) {
      return;
    }

    if (os.platform() !== 'win32') {
      console.log('⚠️  Автоматическое открытие браузера поддерживается только на Windows');
      console.log(`🌐 Откройте браузер вручную: ${this.getAppUrl()}`);
      return;
    }

    const url = this.getAppUrl();

    if (!this.config.kioskMode) {
      console.log('💡 Kiosk режим выключен - DevTools доступны (F12 для открытия)');
    }
    if (this.config.disableWebSecurity) {
      console.log('⚠️  ВНИМАНИЕ: Проверка CORS отключена в браузере! Это небезопасно для продакшена.');
    }
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || programFiles;
    const chromePath = path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe');
    const edgePath = path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe');

    // Проверяем наличие Chrome
    const chromeExists = chromePath && (await fs.pathExists(chromePath));

    if (chromeExists) {
      // Открываем Chrome в kiosk режиме или обычном режиме
      let chromeFlags = '';

      // Добавляем флаги для отключения CORS, если включено
      if (this.config.disableWebSecurity) {
        chromeFlags += `--disable-web-security --user-data-dir="${os.tmpdir()}\\ChromeTempProfile" `;
      }

      if (this.config.kioskMode) {
        chromeFlags += `--autoplay-policy=no-user-gesture-required --app="${url}" --start-fullscreen --kiosk --disable-features=Translate,ContextMenuSearchWebFor,ImageSearch`;
      } else {
        chromeFlags += `--app="${url}" --auto-open-devtools-for-tabs`;
      }

      exec(`"${chromePath}" ${chromeFlags}`, (error) => {
        if (error) {
          console.error('❌ Ошибка открытия Chrome:', error);
        }
      });

      // Убиваем explorer.exe через 12 секунд для чистого kiosk режима
      if (this.config.kioskMode) {
        setTimeout(() => {
          exec('taskkill /f /im explorer.exe', (error) => {
            if (error && !error.message.includes('не найден')) {
              console.error('⚠️  Не удалось закрыть explorer.exe:', error.message);
            }
          });
        }, 12000);
      }
    } else {
      // Проверяем наличие Edge
      const edgeExists = edgePath && (await fs.pathExists(edgePath));

      if (edgeExists) {
        // Настраиваем Edge политики
        if (this.config.kioskMode) {
          exec('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "TranslateEnabled" /t REG_DWORD /d 0 /f >nul 2>&1', () => {});
          exec('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "ContextMenuSearchEnabled" /t REG_DWORD /d 0 /f >nul 2>&1', () => {});
          exec('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "VisualSearchEnabled" /t REG_DWORD /d 0 /f >nul 2>&1', () => {});
        }

        // Открываем Edge в kiosk режиме
        let edgeFlags = '';

        // Добавляем флаги для отключения CORS, если включено
        if (this.config.disableWebSecurity) {
          edgeFlags += `--disable-web-security --user-data-dir="${os.tmpdir()}\\EdgeTempProfile" `;
        }

        if (this.config.kioskMode) {
          edgeFlags += `--kiosk "${url}" --edge-kiosk-type=fullscreen --no-first-run --disable-features=msEdgeSidebarV2,msHub,msWelcomePage,msTranslations,msContextMenuSearch,msVisualSearch --disable-component-update --disable-prompt-on-repost --kiosk-idle-timeout-minutes=0`;
        } else {
          edgeFlags += `"${url}"`;
        }

        exec(`"${edgePath}" ${edgeFlags}`, (error) => {
          if (error) {
            console.error('❌ Ошибка открытия Edge:', error);
          }
        });
      } else {
        console.error('❌ Не найден ни Chrome, ни Edge. Откройте браузер вручную:', url);
      }
    }
  }

  /**
   * Инициализировать директории для данных
   */
  async initializeDataDir() {
    try {
      // Получаем актуальные пути к файлам данных
      const gameItemsFile = await this.getGameItemsFile();
      const statisticsFile = await this.getStatisticsFile();
      
      // Проверяем, что пути валидны
      if (!gameItemsFile || !statisticsFile) {
        throw new Error(`Пути к файлам данных не определены. gameItemsFile: ${gameItemsFile}, statisticsFile: ${statisticsFile}`);
      }
      
      // Создаем директории если их нет
      await fs.ensureDir(path.dirname(gameItemsFile));
      await fs.ensureDir(path.dirname(statisticsFile));

      // Проверяем существование файлов
      const gameItemsExists = await fs.pathExists(gameItemsFile);
      const statisticsExists = await fs.pathExists(statisticsFile);
      
      console.log(`📂 Проверка файла catalogItems.json: ${gameItemsFile}`);
      console.log(`📂 Файл существует: ${gameItemsExists}`);
      console.log(`📂 Проверка файла progressPoints.json: ${statisticsFile}`);
      console.log(`📂 Файл существует: ${statisticsExists}`);

      if (!gameItemsExists || !statisticsExists) {
        console.log('✅ Директории для данных созданы');
      } else {
        console.log('✅ Файлы данных найдены');
      }

      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации директории данных:', error);
      return false;
    }
  }

  /**
   * Вывести информацию о конфигурации сервера
   */
  logServerInfo() {
    console.log(`🚀 Сервер запущен на порту ${this.config.port}`);
    console.log(`📁 catalogItems.json: ${this.gameItemsFile}`);
    console.log(`📁 progressPoints.json: ${this.statisticsFile}`);
    console.log(`📂 Статические файлы из: ${this.buildDir}`);
    console.log(`📂 Корень проекта: ${this.baseDir}`);
    console.log(`🌐 API доступно по адресу: ${this.getApiUrl()}`);
    console.log(`🎨 Приложение: ${this.getAppUrl()}`);
    console.log(`🔧 Kiosk режим: ${this.config.kioskMode ? '✅ включен' : '❌ выключен (DevTools доступны)'}`);
    console.log(`🔒 Отключение CORS в браузере: ${this.config.disableWebSecurity ? '✅ включено (⚠️  небезопасно!)' : '❌ выключено'}`);
    if (this.config.openBrowser) {
      console.log(`🌐 Автооткрытие браузера: ✅ включено`);
    }
  }

  /**
   * Настроить Express приложение для работы со статическими файлами
   * @param {Express} app - Express приложение
   * @param {Object} express - Express модуль (для express.static)
   */
  setupStaticFiles(app, express) {
    // При раздаче из корня проекта (fallback без build) — отдаём /data/* из public/data/
    if (this.usingFallbackRoot) {
      const publicDataDir = path.join(this.buildDir, 'public', 'data');
      app.use('/data', express.static(publicDataDir));
    }
    // Раздача статических файлов из build или корня (CSS, JS, index.html и т.д.)
    app.use(express.static(this.buildDir));

    // Fallback для SPA роутинга - все не-API запросы возвращают index.html
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(this.buildDir, this.config.indexHtmlPath));
    });
  }

  /**
   * Запустить сервер с автоматическим открытием браузера
   * @param {Express} app - Express приложение
   * @param {Function} onReady - Callback функция, вызываемая когда сервер готов
   */
  async startServer(app, onReady) {
    try {
      // Проверка index.html и установка buildDir/usingFallbackRoot выполняется вызывающим кодом до setupStaticFiles

      // Запускаем сервер
      app.listen(this.config.port, async () => {
        try {
          this.logServerInfo();

          // Вызываем callback если указан
          if (onReady) {
            await onReady();
          }

          // Открываем браузер через задержку
          if (this.config.openBrowser) {
            setTimeout(async () => {
              try {
                await this.openBrowser();
              } catch (error) {
                console.error('❌ Ошибка при открытии браузера:', error);
                console.log(`🌐 Откройте браузер вручную: ${this.getAppUrl()}`);
              }
            }, this.config.browserDelay);
          }
        } catch (error) {
          console.error('❌ Ошибка после запуска сервера:', error);
          throw error;
        }
      }).on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`\n❌ Порт ${this.config.port} уже занят!`);
          console.error(`   Закройте другое приложение, использующее этот порт, или измените порт в конфигурации.`);
        } else {
          console.error('\n❌ Ошибка запуска сервера:', error.message);
          console.error('Stack:', error.stack);
        }
        
        // Пауза перед закрытием
        console.log('\n⚠️  Окно закроется через 30 секунд...');
        setTimeout(() => {
          process.exit(1);
        }, 30000);
      });
    } catch (error) {
      console.error('❌ Ошибка в startServer:', error);
      throw error;
    }
  }
}

module.exports = ServerSetup;
