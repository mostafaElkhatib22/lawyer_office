const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '/next.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // تأكد من وجود ملف preload.js أو قم بإزالته
    }
  });

  mainWindow.loadURL('https://lawyer-office.vercel.app/'); // أو المسار لتطبيق Next.js الخاص بك
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
