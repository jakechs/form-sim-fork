var natural = require('natural');
var fs = require('fs');

function wordProc (file) {
	console.log('Creating word proc');
}

wordProc.prototype.init = function(file)
{
	console.log('Init word proc');
	this.master_idf = "master_idf";
	this.file = file;
}

wordProc.prototype.tokenize = function () {
	tokenizer = new natural.WordTokenizer();
	return tokenizer.tokenize(fs.readFileSync(this.file).toString());
};

module.exports = new wordProc();

