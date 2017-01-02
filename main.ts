
declare function require(string): any;
declare var ace: any;

const remote = require('electron').remote;
const {dialog} = require('electron').remote;
const main = remote.require('./index');

const $ = require('./jquery-2.1.3.min.js');

class Recoder
{
	public editor = new Editor(ace.edit('input_txt'));
	public slider = $('.slider');
	private fileIO = new FileIO();
	private logger:Logger;

	/* --------------------------------------------------------
	* コンストラクタ
	-------------------------------------------------------- */
	constructor()
	{
		var self = this;
		this.slider.on('input change', () => {
			self.logger.setCurrentLogIndex(self.slider.val());
		});

		this.logger = new Logger(this.editor, this.slider);
		this.logger.isLogging = true;
	}

	/* --------------------------------------------------------
	* プログラムを実行する
	-------------------------------------------------------- */
	public run()
	{
		if (this.logger.isPlaying)
		{
			return
		}

		this.save((dirpath) => {
			ProcessingUtil.run(dirpath);
		});
	}

	/* --------------------------------------------------------
	* 再生する
	-------------------------------------------------------- */
	public play()
	{
		if (this.logger.isPlaying)
		{
			return;
		}

		this.logger.play();
	}

	/* --------------------------------------------------------
	* 停止する
	-------------------------------------------------------- */
	public stop()
	{

	}

	/* --------------------------------------------------------
	* 保存する
	-------------------------------------------------------- */
	public save(complateFunc:(dirpath:string)=>void)
	{
		if (this.fileIO.dirpath === '')
		{
			// 保存ダイアログを開いて保存する
			this.showSaveDialog(complateFunc);
		}
		else
		{
			// 保存する
			this.fileIO.save(this.logger, complateFunc);
		}
	}

	/* --------------------------------------------------------
	* 保存ダイアログを表示する
	-------------------------------------------------------- */
	public showSaveDialog(complateFunc:(dirpath:string)=>void)
	{
		const defPath = main.getDesktopPath();
		const win = remote.getCurrentWindow();

		const self = this;

		dialog.showSaveDialog(win, {
			defaultPath: defPath
		}, (o) => {
			// キャンセルしたとき...
			if (o === undefined)
			{
				return;
			}

			console.log(o);

			// 保存する
			self.fileIO.dirpath = o;
			self.fileIO.save(this.logger, complateFunc);
		});
	}

	/* --------------------------------------------------------
	* 読み込みダイアログを表示する
	-------------------------------------------------------- */
	public showOpenDialog(complateFunc:(dirpath:string)=>void)
	{
		const defPath = main.getDesktopPath();
		const win = remote.getCurrentWindow();

		const self = this;

		dialog.showOpenDialog(win, {
			defaultPath: defPath,
			properties: ['openDirectory']
		}, (o) => {
			// キャンセルしたとき...
			if (o === undefined)
			{
				return;
			}

			self.fileIO.dirpath = o[0];
			self.fileIO.load((text:string, log:string) => {
				self.logger.loadLog(log);

				// TODO: のちに削除（エディタの管理はLoggerの仕事）
				// self.editor.setValue(text, -1);
			});
			complateFunc(o);
		});
	}
}

/* --------------------------------------------------------
* エントリポイント
-------------------------------------------------------- */
$(function()
{
	var recoder = new Recoder();

	$('#runBtn').click(function()
	{
		recoder.run();
	});

	$('#playBtn').click(function()
	{
		recoder.play();
	});

	main.setOpenProc(function()
	{
		recoder.showOpenDialog((dirpath) => {});
	});

	main.setSaveProc(function()
	{
		recoder.save((dirpath) => {});
	});

	// document.ondragover = (e) => {
	// 	e.preventDefault();
	// 	return false;
	// };

	// document.ondrop = (e) => {
	// 	e.preventDefault();

	// 	const dir = e.dataTransfer.files[0];
	// 	fileIO.load(dir.path);

	// 	return false;
	// };
});
