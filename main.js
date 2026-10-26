const { app, BrowserWindow, protocol, net, Menu } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 480, height: 860, minWidth: 360, minHeight: 600,
    title: 'ProteKids', icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true, backgroundColor: '#ffffff',
    webPreferences: { contextIsolation: true, autoplayPolicy: 'no-user-gesture-required' }
  });
  win.loadURL('app://protekids/index.html');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const root = path.join(__dirname, 'www');
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    const full = path.normalize(path.join(root, p));
    if (!full.startsWith(root)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(full).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
