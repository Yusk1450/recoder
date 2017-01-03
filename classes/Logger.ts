
enum LogType
{
	Insert,
	Remove,
	Run
}

class Log
{
	public beginIndex:number = -1;					// 開始ログID
	public endIndex:number = Number.MAX_VALUE;		// 終了ログID
	public char = '';
}

class EventLog
{
	public timestamp:number;
	public type:LogType;
}

class Logger
{
	private editor:Editor = null;						// エディタ
	private slider:any = null;							// スライダ
	public isLogging:boolean = false;					// ロギング中
	public isPlaying:boolean = false;					// 再生中
	private logs:Log[] = [];
	private eventLogs:EventLog[] = [];

	private currentLogIndex = 0;						// 現在のログID
	private startTimestamp = (new Date()).getTime();	// ログ開始タイムスタンプ

	/* --------------------------------------------------------
	* コンストラクタ
	-------------------------------------------------------- */
	constructor(editor:Editor, slider:any)
	{
		this.editor = editor;
		this.slider = slider;
		this.setupEditor();
	}

	/* --------------------------------------------------------
	* エディタの初期設定
	-------------------------------------------------------- */
	private setupEditor()
	{
		if (!this.editor)
		{
			return;
		}

		var self = this;

		this.editor.editing((e) => {

			if (!self.isLogging)
			{
				return;
			}

			const timestamp = (new Date()).getTime();
			const newLogIndex = self.getLatestLogIndex() + 1;
			const chars = e.lines[0];
			const cnt = self.editor.charCount(e.start.column, e.start.row);

			// 文字挿入
			if (e.action === 'insert')
			{
				const headIndex = self.getActualLogAryIndex(cnt);

				// 改行時の処理
				if (e.lines.length == 2)
				{
					var log = new Log();
					log.char = '\n';
					log.beginIndex = newLogIndex;
					log.endIndex = Number.MAX_VALUE;

					self.logs.splice(headIndex, 0, log);
				}
				else
				{
					for (var i = 0; i < chars.length; i++)
					{
						var log = new Log();
						log.char = chars.charAt(i);
						log.beginIndex = newLogIndex;
						log.endIndex = Number.MAX_VALUE;

						self.logs.splice(headIndex + i, 0, log);
					}
				}

				self.logging(LogType.Insert, timestamp);
			}
			// 文字削除
			else if (e.action === 'remove')
			{
				const headIndex = self.getActualLogAryIndex(cnt);

				for (var i = 0; i < chars.length; i++)
				{
					self.logs[headIndex + i].endIndex = newLogIndex;
				}

				self.logging(LogType.Remove, timestamp);
			}

			self.currentLogIndex = newLogIndex;

			self.slider.attr('max', self.currentLogIndex);
			self.slider.val(self.currentLogIndex);
		});
	}

	/* --------------------------------------------------------
	* 
	-------------------------------------------------------- */
	private getActualLogAryIndex(idx:number):number
	{
		var res = 0;
		var cnt = -1;
		for (res = 0; res < this.logs.length; res++)
		{
			var log = this.logs[res];

			if (log.beginIndex <= this.getLatestLogIndex() && log.endIndex > this.getLatestLogIndex())
			{
				cnt++;
			}

			if (cnt == idx)
			{
				break;
			}
		}
		return res;
	}

	/* --------------------------------------------------------
	* 指定した時点のソースコードを返す
	-------------------------------------------------------- */
	private getTextFromIndex(idx:number):string
	{
		var txt = '';
		for (var i = 0; i < this.logs.length; i++)
		{
			var log = this.logs[i];

			if (log.beginIndex <= idx && log.endIndex > idx)
			{
				txt += log.char;
			}
		}
		return txt;
	}

	/* --------------------------------------------------------
	* 指定したログインデックスに変更する
	-------------------------------------------------------- */
	public setCurrentLogIndex(idx:number)
	{
		this.editor.setReadOnly(!(idx == this.getLatestLogIndex()));
		this.currentLogIndex = idx;
		this.editor.setText(this.getTextFromIndex(idx));
	}

	/* --------------------------------------------------------
	* ログをとる
	-------------------------------------------------------- */
	public logging(type:LogType, timestamp:number)
	{
		var eventLog = new EventLog();
		eventLog.type = type;
		eventLog.timestamp = timestamp;
		this.eventLogs.push(eventLog);
	}

	/* --------------------------------------------------------
	* ログを再生する
	-------------------------------------------------------- */
	public play()
	{
		if (this.isPlaying)
		{
			return;
		}

		this.isLogging = false;

		// if (this.eventLogs.length-1 < this.currentLogIndex+1)
		// {
		// 	return;
		// }

		// var self = this;
		// setTimeout(function()
		// {
		// 	self.reproducing();
		// }, 1000);
	}

	public reproducing()
	{
		console.log('aaa');
	}

	public loadLog(log:string)
	{

	}

	/* --------------------------------------------------------
	* 現在のソースコードを返す
	-------------------------------------------------------- */
	public getCurentText():string
	{
		return this.getTextFromIndex(this.eventLogs.length-1);
	}

	public getLatestLogIndex():number
	{
		return this.eventLogs.length - 1;
	}

	/*
	 * テストコード
	*/

}
