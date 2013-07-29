var natural = require('natural');
var fs = require('fs');

function wordProc (file) {
}

wordProc.prototype.init = function(file)
{
	this.master = "master_idf";
	this.file = file;
};

wordProc.prototype.tokenize = function () {
	tokenizer = new natural.WordTokenizer();
	return tokenizer.tokenize(fs.readFileSync(this.file).toString());
};

wordProc.prototype.getDetails = function(data) {
	var response = {}
	response.size = data.length;
	var tokens = {};

	data.forEach(function (el) {
		if(tokens.hasOwnProperty(el))
			tokens[el] = tokens[el] + 1;
		else
			tokens[el] = 1;
	});

	response.tokens = tokens;
	response.vocabsize = Object.keys(tokens).length;

	return response;
}

module.exports = new wordProc();

