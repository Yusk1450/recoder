
class Diff
{
	public startPoint:number;
	public endPoint:number;
	public characters:string;
}

class DiffEngine
{
	/* --------------------------------------------------------
	* 差分をとる
	-------------------------------------------------------- */
	public static diff(str1:string, str2:string):Diff
	{
		// 空文字だった場合...
		if (str1.length == 0 && str2.length == 0)
		{
			console.log('empty');
			return null;
		}

		if (str1.length > str2.length)
		{
			console.log('str1 > str2');
			return null;
		}

		var d = new Diff();

		if (str1.length == 0)
		{
			d.startPoint = 0;
			d.endPoint = 0;
			d.characters = str2;
			return d;
		}

		var headPoint = this.searchHeadPoint(str1, str2);
		var tailPoint = this.searchTailPoint(str1, str2);

		d.startPoint = headPoint.s1;
		d.endPoint = headPoint.s2;
		d.characters = str2.substr(parseInt(headPoint.s2)+1, parseInt(tailPoint.s2+1) - parseInt(headPoint.s2+1)-1);

		return d;
	}

	/* --------------------------------------------------------
	* 前方検索
	-------------------------------------------------------- */
	public static searchHeadPoint(s1:string, s2:string):any
	{
		var idx1 = -1;
		var idx2 = -1;

		for (var i = 0; i < s1.length; i++)
		{
			if (s1.charAt(i) !== s2.charAt(i))
			{
				break;
			}

			idx1 = idx2 = i;
		}

		return {
			s1: idx1,
			s2: idx2
		};
	}

	/* --------------------------------------------------------
	* 後方検索
	-------------------------------------------------------- */
	public static searchTailPoint(s1:string, s2:string):any
	{
		var idx1 = (s1.length-1)+1;
		var idx2 = (s2.length-1)+1;

		for (var i = 0; i < s1.length; i++)
		{
			var i1 = s1.length-1 - i;
			var i2 = s2.length-1 - i;

			if (s1.charAt(i1) !== s2.charAt(i2))
			{
				break;
			}

			idx1 = i1;
			idx2 = i2;
		}

		return {
			s1: idx1,
			s2: idx2
		};
	}
}
