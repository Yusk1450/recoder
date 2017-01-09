
const exec = require('child_process').exec;

class ProcessingUtil
{
	public static run(dirpath, comp:(out:string, err:string)=>void)
	{
		const command = 'processing-java --sketch='+dirpath+' --output='+dirpath+'/output --force --run';
		exec(command, (error, stdout, stderr) => {
			comp(stdout, stderr);
		});
	}
}