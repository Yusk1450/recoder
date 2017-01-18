
enum LogType
{
	Insert,											// 文字入力
	Remove,											// 文字削除
	Run												// 実行
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
	public cursorPosition:{[key: string]: number};
}

class Logger
{
	private editor:Editor = null;								// エディタ
	private isPlaying:boolean = false;							// 再生中
	private logs:Log[] = [];									// 文字ログ
	private eventLogs:EventLog[] = [];							// イベントログ

	public maxDuration:number = 500;
	private timerID:number = null;

	private currentLogIndex:number = 0;							// 現在のログID

	public didLogging:()=>void = ()=>{};						// ロギングイベント
	public didEditEvent:()=>void = ()=>{};						// 編集終了イベント
	public didLogIndexChangedEvent:()=>void = ()=>{};			// ログインデックス変更イベント
	public didPlayingEvent:(logtype:LogType)=>void = ()=>{};	// 再生中イベント
	public didPlayEndEvent:()=>void = ()=>{};					// 再生終了イベント

	/* --------------------------------------------------------
	* コンストラクタ
	-------------------------------------------------------- */
	constructor(editor:Editor)
	{
		this.editor = editor;
		this.setupEditor();

		this.logging(LogType.Insert, (new Date()).getTime());
	}

	/* 
	* エディタの初期設定
	*/
	private setupEditor()
	{
		if (!this.editor)
		{
			return;
		}

		this.editor.editing((e) =>
		{
			const timestamp = (new Date()).getTime();
			const newLogIndex = this.getLatestLogIndex() + 1;
			const cnt = this.editor.charCount(e.start.column, e.start.row);

			// 複数行を配列に変換する
			var chars = '';
			for (var i = 0; i < e.lines.length; i++)
			{
				for (var j = 0; j < e.lines[i].length; j++)
				{
					chars += e.lines[i].charAt(j);
				}
				chars += '\n';
			}
			// 最後の改行を削除する
			chars = chars.substr(0, chars.length-1);

			// 文字挿入
			if (e.action === 'insert')
			{
				const headIndex = this.getActualLogAryIndex(cnt);

				for (var i = 0; i < chars.length; i++)
				{
					var log = new Log();
					log.char = chars.charAt(i);
					log.beginIndex = newLogIndex;
					log.endIndex = Number.MAX_VALUE;

					this.logs.splice(headIndex + i, 0, log);
				}

				this.logging(LogType.Insert, timestamp);
			}
			// 文字削除
			else if (e.action === 'remove')
			{
				const headIndex = this.getActualLogAryIndex(cnt);

				for (var i = 0; i < chars.length; i++)
				{
					this.logs[headIndex + i].endIndex = newLogIndex;
				}

				this.logging(LogType.Remove, timestamp);
			}

			this.didEditEvent();
		});
	}

	/*
	* 存在しているログのみをカウントしたインデックスを返す
	*/
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

	/* 
	* 指定した時点のソースコードを返す
	*/
	public getTextFromIndex(idx:number):string
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
	* ログの読み込み
	-------------------------------------------------------- */
	public loadLogFromJSON(json:string)
	{
		const data = JSON.parse(json);

		this.eventLogs = data['eventLogs'];
		this.logs = data['logs'];

		this.setCurrentLogIndex(this.getLatestLogIndex());
	}

	/* --------------------------------------------------------
	* 指定したログインデックスをセットする
	-------------------------------------------------------- */
	public setCurrentLogIndex(idx:number)
	{
		this.editor.setReadOnly(!(idx == this.getLatestLogIndex()));
		this.currentLogIndex = idx;
		this.editor.setText(this.getTextFromIndex(idx));

		const cursorPos = this.eventLogs[idx].cursorPosition;
		this.editor.scrollToRow(cursorPos['row']);

		this.didLogIndexChangedEvent();
	}

	/* --------------------------------------------------------
	* 現在のログインデックスを取得する
	-------------------------------------------------------- */
	public getCurrentLogIndex():number
	{
		return this.currentLogIndex;
	}

	/* --------------------------------------------------------
	* ログをとる
	-------------------------------------------------------- */
	public logging(type:LogType, timestamp:number)
	{
		// 連続の実行ログは記録しない
		if ((type == LogType.Run) && (this.eventLogs[this.getLatestLogIndex()].type == LogType.Run))
		{
			return;
		}

		var eventLog = new EventLog();
		eventLog.type = type;
		eventLog.timestamp = timestamp;
		eventLog.cursorPosition = this.editor.getCursorPosition();
		this.eventLogs.push(eventLog);

		this.currentLogIndex++;

		this.didLogging();
	}

	/* --------------------------------------------------------
	* 現在再生中かどうかを返す
	-------------------------------------------------------- */
	public getIsPlaying():boolean
	{
		return this.isPlaying;
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
		if (this.currentLogIndex == this.getLatestLogIndex())
		{
			this.setCurrentLogIndex(0);
		}
		if (this.currentLogIndex+1 > this.getLatestLogIndex())
		{
			this.didPlayEndEvent();
			return;
		}

		this.isPlaying = true;

		this.reproducing();
	}

	/* --------------------------------------------------------
	* ログの再生を一時停止する
	-------------------------------------------------------- */
	public pause()
	{
		if (!this.isPlaying)
		{
			return;
		}

		this.isPlaying = false;
		this.didPlayEndEvent();

		if (this.timerID != null)
		{
			clearTimeout(this.timerID);
		}
	}

	private reproducing()
	{
		if (this.currentLogIndex+1 > this.getLatestLogIndex())
		{
			this.timerID = null;
			this.isPlaying = false;
			this.didPlayEndEvent();
			return;
		}

		const idx = toInt(this.currentLogIndex);
		this.setCurrentLogIndex(idx+1);

		var timestamp = this.eventLogs[idx + 1].timestamp - this.eventLogs[idx].timestamp;
		var timestamp = Math.min(timestamp, this.maxDuration);

		this.didPlayingEvent(this.eventLogs[idx + 1].type);

		this.timerID = setTimeout(() =>
		{
			this.reproducing();
		}, timestamp);
	}

	/* --------------------------------------------------------
	* 現在のソースコードを返す
	-------------------------------------------------------- */
	public getCurrentText():string
	{
		return this.getTextFromIndex(this.getCurrentLogIndex());
	}

	public getLatestLogIndex():number
	{
		return this.eventLogs.length - 1;
	}

	public getLatestText():string
	{
		return this.getTextFromIndex(this.getLatestLogIndex());
	}

	public getEventLogs():EventLog[]
	{
		return this.eventLogs;
	}

	public getLogs():Log[]
	{
		return this.logs;
	}

	public getPrevRunLogIndex():number
	{
		var idx = this.getCurrentLogIndex();
		while(idx > 0)
		{
			idx--;
			if (this.eventLogs[idx].type == LogType.Run)
			{
				break;
			}
		}
		return idx;
	}

	public getNextRunLogIndex():number
	{
		var idx = this.getCurrentLogIndex();
		while(idx < this.getLatestLogIndex())
		{
			idx++;
			if (this.eventLogs[idx].type == LogType.Run)
			{
				break;
			}
		}
		return idx;
	}
}
