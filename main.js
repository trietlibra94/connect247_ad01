const { app, BrowserWindow } = require('electron')
const contextMenu = require('electron-context-menu');

$ = require('jquery');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
var request = require('request');

// Add an item to the context menu that appears only when you click on an image
contextMenu({
    prepend: (params, browserWindow) => [{
        role: "zoomIn"
    }, {
        role: "zoomOut"
    }, {
        role: "resetZoom"
    }, {
        role: "togglefullscreen"
    }, {
        role: "reload"
    }],
});

function createWindow() {
    // Tạo một cửa sổ trình duyệt.
    win = new BrowserWindow({
        width: 1300,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            zoomFactor: 0.8
        },
        icon: __dirname + '/public/img/Connect247_logo.ico'
    })

    win.removeMenu()
        // full screen
    win.maximize()
        // and load the index.html of the app.
    win.loadFile('views/ad_login.html')
        //win.loadFile('login.ejs')

    // Open the DevTools.
    // win.webContents.openDevTools()
    // Bắt sự kiện cửa sổ được đóng lại.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.

        win = null
    })
}

app.commandLine.appendSwitch('ignore-certificate-errors');
// Phương thức này sẽ được gọi ra khi Electron hoàn thành
//  khởi tạo và sẳn sàng để tạo ra các cửa sở trình duyệt.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Thoát ra khi tất cả cửa sổ đóng lại.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q

    //Logout contact center
    logoutWindow()

    setInterval(intervalQuitApp, 5000);
    // if (process.platform !== 'darwin') {
    //   app.quit()
    // }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function logoutWindow() {
    win = new BrowserWindow({
        width: 500,
        height: 300,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.loadFile('views/ad_logout.html')
}

function intervalQuitApp() {
    app.quit();
}