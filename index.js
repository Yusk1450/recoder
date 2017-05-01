'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const shell = electron.shell;
const Menu = electron.Menu;
const defaultMenu = require('electron-default-menu');

var forceQuit = false;
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
		title: app.getName()
		,width: 650
		,height: 620
		,'minWidth': 450
		,'minHeight': 530
		,'overlay-scrollbars':false
		,"title-bar-style": "hidden-inset"
	});
	mainWindow.loadURL('file://' + __dirname + '/index.html');
	// mainWindow.webContents.openDevTools();
	mainWindow.on('close', function(e)
	{
		if (!forceQuit)
		{
			e.preventDefault();
			mainWindow.hide();
		}
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
		menu.splice(5, 1, {
			label: 'Help',
			submenu: [
				{
					label: 'Getting Started',
					accelerator: '',
					click: () => {
						shell.openExternal("https://processing.org/tutorials/gettingstarted/");
					}
				},
				{
					label: 'Reference',
					accelerator: '',
					click: () => {
						shell.openExternal("https://processing.org/reference/");
					}
				},
				{type: 'separator'},
				{
					label: 're:coder.yusk1450.com',
					accelerator: '',
					click: () => {
						shell.openExternal("http://recoder.yusk1450.com/");
					}
				},
				{
					label: 'Processing.org',
					accelerator: '',
					click: () => {
						shell.openExternal("https://processing.org/");
					}
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

app.on('window-all-closed', function()
{
	if (process.platform != 'darwin')
	{
		app.quit();
	}
});

app.on('before-quit', function(e)
{
	forceQuit = true;
});

app.on('will-quit', function()
{
	mainWindow = null;
});

app.on('activate', function()
{
	mainWindow.show();
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