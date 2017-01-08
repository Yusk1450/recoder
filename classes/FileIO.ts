
const fs = require('fs');

const path = require('path');

class FileIO
{
	public dirpath:string = '';

	/* --------------------------------------------------------
	* 保存する
	-------------------------------------------------------- */
	public save(logger:Logger, complateFunc:(dirpath:string)=>void)
	{
		if (this.dirpath === '')
		{
			return;
		}

		// ディレクトリが存在するかどうかを確認する
		fs.exists(this.dirpath, (exists:boolean) =>
		{
			// ディレクトリ名
			const dirname:string = path.basename(this.dirpath);

			const proc = () =>
			{
				// ソースファイルの書き出し（実行用）
				fs.writeFile(this.dirpath+'/'+dirname+'.pde', logger.getCurentText());

				var output = {};
				output['eventLogs'] = logger.getEventLogs();				// イベントログ
				output['logs'] = logger.getLogs();

				// ログファイルの書き出し
				fs.writeFile(this.dirpath+'/'+dirname+'.rec', JSON.stringify(output));

				complateFunc(this.dirpath);
			};

			if (exists)
			{
				proc();
			}
			else
			{
				// ディレクトリ作成
				fs.mkdir(this.dirpath);
				proc();
			}
		});
	}

	/* --------------------------------------------------------
	* 読み込む
	-------------------------------------------------------- */
	public load(complateFunc:(text:string, log:string)=>void)
	{
		if (this.dirpath === '')
		{
			return;
		}

		const dirname = path.basename(this.dirpath);

		const text = fs.readFileSync(this.dirpath + '/' + dirname + '.pde').toString();
		const log = fs.readFileSync(this.dirpath + '/' + dirname + '.rec').toString();

		complateFunc(text, log);
	}
}
