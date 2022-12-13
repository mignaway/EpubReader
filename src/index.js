const { app, BrowserWindow, globalShortcut, ipcMain, dialog, shell } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: false,
    show: false,
    frame: false,
    icon: path.join(__dirname,"icon.ico"),
    // hasShadow: true,
    // transparent: true,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, './preload.js'),
    },
  });
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  ipcMain.handle('appVersion', () => app.getVersion())
  ipcMain.handle('storePath', () => app.getPath('appData'))

  // mainWindow.on('ready-to-show', ()=> setTimeout(() => mainWindow.show(), 50))
  mainWindow.webContents.on('did-finish-load', async () => {
    setTimeout(() => mainWindow.show(), 50); // HACK
  });
  globalShortcut.register('f5', function () {
    mainWindow.reload()
  })

  ipcMain.on('closeApp', () => {
    mainWindow.close()
  })
  ipcMain.on('minimizeApp', () => {
    mainWindow.minimize()
  })
  ipcMain.on('resizeApp', () => {
    if (!mainWindow.isMaximized()) {
      mainWindow.maximize();
      return null;
    }
    mainWindow.unmaximize();
  })
  ipcMain.on('unmaximizeApp', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return null;
    } 
  })
  ipcMain.on('openBookChooserDialog', () => {
    dialog.showOpenDialog({ 
      properties: ['openFile'],
      filters: [
        { "name": "Epub Files","extensions": ["epub"]}
      ]
    }).then(result => {
      if (!result.canceled) {
        mainWindow.webContents.send('bookChosenSuccess', result.filePaths[0])
      }
    }).catch(err => {
      console.log(err)
    })
  })
  mainWindow.on('resize', function() {
    mainWindow.webContents.send('updateMaximizeIcon', mainWindow.isMaximized());
  })
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
