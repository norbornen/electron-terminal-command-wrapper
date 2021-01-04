// @ts-check
// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const execa = require('execa');

/** @type {BrowserWindow} */
let win;

function createMainWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  const filepath = path.resolve(__dirname, '../render/index.html');
  win.loadURL(`file://${filepath}`);

  if (isDev) {
    win.webContents.openDevTools();
  }

  win.once('closed', () => {
    win = null;
  });
}

function initIpc() {
  ipcMain.on('channelCmd', async (event, args) => {
    const { command, options, argument } = typeof args === 'string' ? JSON.parse(args) : args;

    try {
      const { stdout, stderr } = await execa(command, [options, argument].filter((x) => typeof x === 'string' && /\S/.test(x)));
      console.log(stdout);
      console.log(stderr);
      event.reply('channelCmd', stdout || stderr);
    } catch (err) {
      console.log(err);
      event.reply('channelCmd', err.stack || err.message);
    }
  });
}

app.on('ready', () => {
  createMainWindow();
  initIpc();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
