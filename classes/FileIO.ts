
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

		const self = this;

		// ディレクトリが存在するかどうかを確認する
		fs.exists(this.dirpath, function(exists:Boolean)
		{
			// ディレクトリ名
			const dirname:string = path.basename(self.dirpath);

			const proc = () =>
			{
				// ソースファイルの書き出し
				fs.writeFile(self.dirpath+'/'+dirname+'.pde', logger.getCurentText());
				// ログファイルの書き出し
				fs.writeFile(self.dirpath+'/'+dirname+'.rec', 'bbb');

				complateFunc(self.dirpath);
			};

			if (exists)
			{
				proc();
			}
			else
			{
				// ディレクトリ作成
				fs.mkdir(self.dirpath);
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

		const dirname:string = path.basename(this.dirpath);

		const text:string = fs.readFileSync(this.dirpath + '/' + dirname + '.pde').toString();
		const log:string = fs.readFileSync(this.dirpath + '/' + dirname + '.rec').toString();

		complateFunc(text, log);
	}
}
