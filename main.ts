
declare function require(string): any;
declare var ace: any;

const remote = require('electron').remote;
const {dialog} = require('electron').remote;
const main = remote.require('./index');

const $ = require('./jquery-2.1.3.min.js');

function toInt(val:any):number
{
	return parseInt(val);
}

class Recoder
{
	public editor = new Editor(ace.edit('input_txt'));
	public slider = $('.slider');
	private fileIO = new FileIO();
	public logger:Logger;

	/* --------------------------------------------------------
	* コンストラクタ
	-------------------------------------------------------- */
	constructor()
	{
		this.logger = new Logger(this.editor);

		// スライダーを変更したときに呼び出される
		this.slider.on('input change', () =>
		{
			// console.log(this.slider.val());
			this.logger.setCurrentLogIndex(this.slider.val());
		});

		// ロギングした際に呼び出される
		this.logger.didLogging = () =>
		{
			// console.log(this.logger.getCurrentLogIndex());
			this.slider.attr('max', this.logger.getLatestLogIndex());
			this.slider.val(this.logger.getCurrentLogIndex());
		};

		// ログインデックスが変更されたときに呼び出される
		this.logger.didLogIndexChangedEvent = () =>
		{
			this.slider.attr('max', this.logger.getLatestLogIndex());			
			this.slider.val(this.logger.getCurrentLogIndex());
		};

		this.logger.didPlayingEvent = (logtype:LogType) =>
		{
			if (logtype == LogType.Run)
			{
				this.save((dirpath) =>
				{
					ProcessingUtil.run(dirpath);
				});
			}
		};
	}

	/* --------------------------------------------------------
	* プログラムを実行する
	-------------------------------------------------------- */
	public run()
	{
		if (this.logger.getIsPlaying())
		{
			return;
		}

		this.save((dirpath) =>
		{
			this.logger.logging(LogType.Run, (new Date()).getTime());
			ProcessingUtil.run(dirpath);
		});
	}

	/* --------------------------------------------------------
	* 再生する
	-------------------------------------------------------- */
	public play()
	{
		if (this.logger.getIsPlaying())
		{
			return;
		}

		this.logger.play();
	}

	/* --------------------------------------------------------
	* 停止する
	-------------------------------------------------------- */
	public pause()
	{
		if (!this.logger.getIsPlaying())
		{
			return;
		}

		this.logger.pause();
	}

	/* --------------------------------------------------------
	* 前の実行ログまでジャンプする
	-------------------------------------------------------- */
	public prev()
	{
		const idx = this.logger.getPrevRunLogIndex();
		this.logger.setCurrentLogIndex(idx);
	}

	/* --------------------------------------------------------
	* 次の実行ログまでジャンプする
	-------------------------------------------------------- */
	public next()
	{
		const idx = this.logger.getNextRunLogIndex();
		this.logger.setCurrentLogIndex(idx);
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
		if (this.logger.getIsPlaying())
		{
			return;
		}

		const defPath = main.getDesktopPath();
		const win = remote.getCurrentWindow();

		dialog.showOpenDialog(win, {
			defaultPath: defPath,
			properties: ['openDirectory']
		}, (o) => {
			// キャンセルしたとき...
			if (o === undefined)
			{
				return;
			}

			this.fileIO.dirpath = o[0];
			this.fileIO.load((text:string, log:string) => {
				this.logger.loadLogFromJSON(log);
			});
			complateFunc(o);
		});
	}

	public getIsPlaying():boolean
	{
		return this.logger.getIsPlaying();
	}
}

/* --------------------------------------------------------
* エントリポイント
-------------------------------------------------------- */
$(function()
{
	var recoder = new Recoder();

	// 再生終了時の処理
	recoder.logger.didPlayEndEvent = () =>
	{
		$('#playBtn').children('img').attr('src', 'imgs/PlayBtn.png');
	};

	$('#runBtn').click(() =>
	{
		recoder.run();
	});

	$('#playBtn').click(function()
	{
		if (recoder.getIsPlaying())
		{
			$(this).children('img').attr('src', 'imgs/PlayBtn.png');
			recoder.pause();
		}
		else
		{
			$(this).children('img').attr('src', 'imgs/PauseBtn.png');
			recoder.play();
		}
	});

	$('#prevBtn').click(() =>
	{
		recoder.prev();
	});

	$('#nextBtn').click(() =>
	{
		recoder.next();
	});

	main.setOpenProc(() =>
	{
		recoder.showOpenDialog((dirpath) => {});
	});

	main.setSaveProc(() =>
	{
		if (!recoder.logger.getIsPlaying())
		{
			recoder.save((dirpath) => {});
		}
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
