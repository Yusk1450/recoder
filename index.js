'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const shell = electron.shell;
const Menu = electron.Menu;
const defaultMenu = require('electron-default-menu');

let mainWindow = null;

var openProc = null;
var saveProc = null;

/* --------------------------------------------------------
 * ウィンドウを作成する
-------------------------------------------------------- */
function createMainWindow()
{
	mainWindow = new BrowserWindow(
	{
		width: 650
		,height: 620
		,'minWidth': 450
		,'minHeight': 530
		,'overlay-scrollbars':false
	});
	mainWindow.loadURL('file://' + __dirname + '/index.html');
	mainWindow.webContents.openDevTools();
	mainWindow.on('closed', function()
	{
		mainWindow = null;
	});
}

function installMenu()
{
	if (process.platform === 'darwin')
	{
		const menu = defaultMenu(app, shell);

		menu.splice(1, 0, {
			label: 'File',
			submenu: [
				{
					label: 'New File',
					accelerator: 'Command+N',
					click: () => { }
				},
				{
					label: 'Open',
					accelerator: 'Command+O',
					click: () => { openProc(); }
				},
				{
					label: 'Save',
					accelerator: 'Command+S',
					click: () => { saveProc(); }
				}
			]
		});
		Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
	}
	else
	{

	}
}

app.on('ready', function()
{
	createMainWindow();
	installMenu();
});

/* --------------------------------------------------------
 * すべてのウィンドウを閉じたときに呼び出される
-------------------------------------------------------- */
app.on('window-all-closed', function()
{
	if (process.platform !== 'darwin')
	{
		app.quit();
	}
});

app.on('activate', function()
{
	if (mainWindow === null)
	{
		createMainWindow();
	}
});

/* --------------------------------------------------------
 * デスクトップのパスを返す
-------------------------------------------------------- */
exports.getDesktopPath = function()
{
	return app.getPath('desktop');
}

exports.setOpenProc = function(proc)
{
	openProc = proc;
}

exports.setSaveProc = function(proc)
{
	saveProc = proc;
}