const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let tray = null;
let win = null;

async function createWindow() {
  // Dinamik import kullanarak electron-store'u içe aktar
  const Store = (await import('electron-store')).default;
  const store = new Store();

  // Önceki pencere durumunu al
  const windowState = store.get('windowState') || { width: 800, height: 600 };
  const isMaximized = store.get('isMaximized') || false;

  // Yeni bir tarayıcı penceresi oluştur
  win = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Pencere maximized durumdaysa maximize et
  if (isMaximized) {
    win.maximize();
  }

  // Pencere kapanırken durumu kaydet
  win.on('close', (event) => {
    // Pencerenin gerçekten kapanmasını önle
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }

    if (!win.isMaximized()) {
      store.set('windowState', win.getBounds());
    }
    store.set('isMaximized', win.isMaximized());
  });

  // Belirtilen URL'yi yükle
  win.loadURL('https://canary.discord.com/app');
}

app.on('ready', () => {
  createWindow();

  // Tray oluştur
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        win.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Discord Canary');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show();
  });
});

app.on('window-all-closed', () => {
  // macOS dışındaki platformlarda uygulamayı kapat
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS'ta pencere yokken tıklanınca yeni pencere oluştur
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win.show();
  }
});
