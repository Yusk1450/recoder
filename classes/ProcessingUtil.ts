
const exec = require('child_process').exec;

class ProcessingUtil
{
	public static run(dirpath)
	{
		const command = 'processing-java --sketch='+dirpath+' --output='+dirpath+'/output --force --run';
		exec(command, (error, stdout, stderr) => {
			console.log(stdout);
			console.log(stderr);
		});
	}
}