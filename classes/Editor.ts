
class Editor
{
	private editor:any = null;

	/* --------------------------------------------------------
	* コンストラクタ
	-------------------------------------------------------- */
	constructor(editor:any)
	{
		this.editor = editor;

		this.editor.$blockScrolling = Infinity; 
		this.editor.getSession().setMode('ace/mode/processing');
		this.editor.setTheme('ace/theme/twilight');
	}

	/* --------------------------------------------------------
	* 編集時に呼び出される処理を登録する
	-------------------------------------------------------- */
	public editing(func:(e:any)=>void)
	{
		this.editor.on('change', (e) => {
			func(e);
		});
	}

	/* --------------------------------------------------------
	* 指定した列番号と行番号から何文字目かを返す
	-------------------------------------------------------- */
	public charCount(col:number, row:number):number
	{
		const txt = this.editor.getValue();
		const rows = txt.split('\n');

		var cnt = 0;
		for (var r = 0; r < row; r++)
		{
			// 改行分を+1する
			cnt += rows[r].length + 1;
		}
		cnt += col;

		return cnt;
	}

	/* --------------------------------------------------------
	* テキストをセットする
	-------------------------------------------------------- */
	public setText(txt:string)
	{
		this.editor.setValue(txt);
	}
}
