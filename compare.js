// Demo sample using ABBYY Cloud OCR SDK from Node.js

if (typeof process == 'undefined' || process.argv[0] != "node") {
	throw new Error("This code must be run on server side under NodeJS");
}

var argv = require('optimist')
			.default('m','1')
			.default('i','img/tax.jpg')
			.default('o','./result.txt')
			.argv;

//!!! Please provide your application id and password and remove this line !!!
// Name of application you created
var appId = 'Document similarity for uploaded forms';
// Password should be sent to your e-mail after application was created
var password = 'gXYVNyQgHTHqGLNBOkWSITCH';

var imagePath = argv.i;
var outputPath = argv.o;
var master, docs;

try {

	var ocrsdkModule = require('./ocrsdk.js');
	var ocrsdk = ocrsdkModule.create(appId, password);
	ocrsdk.serverUrl = "http://cloud.ocrsdk.com"; // change to https for secure connection

	if (appId.length == 0 || password.length == 0) {
		throw new Error("Please provide your application id and password!");
	}
	
	if( imagePath == 'myFile.jpg') {
		throw new Error( "Please provide path to your image!")
	}

	function downloadCompleted(error) {
		if (error) {
			console.log("Error: " + error.message);
			return;
		}
		console.log("Done.");
	}

	function processingCompleted(error, taskData) {
		if (error) {
			console.log("Error: " + error.message);
			return;
		}

		if (taskData.status != 'Completed') {
			console.log("Error processing the task.");
			if (taskData.error) {
				console.log("Message: " + taskData.error);
			}
			return;
		}

		console.log("Processing completed.");
		console.log("Downloading result to " + outputPath);

		ocrsdk
				.downloadResult(taskData.resultUrl, outputPath,
						downloadCompleted);
	}

	function uploadCompleted(error, taskData) {
		if (error) {
			console.log("Error: " + error.message);
			return;
		}

		console.log("Upload completed.");
		console.log("Task id = " + taskData.id + ", status is "
				+ taskData.status);

		ocrsdk.waitForCompletion(taskData.id, processingCompleted);
	}

	function getID (idf) {
		var max = -9999;

		if (Object.keys(idf).length <= 0)
			max = 0;
		else {
			for (var k in idf) {
				if(max < idf[k].id) {
					max = idf[k].id;
				}
			}
		}		

		return max + 1;
	};

	function addDocToDB(doc, idf) {
		console.log("Adding");
		var master_idf = idf || {};
		var tokens = doc.tokens;
		var newTokens = {};

		Object.keys(tokens).forEach(function (el) {
			if(master_idf.hasOwnProperty(el)) {
				master_idf[el].cnt = master_idf[el].cnt + tokens[el];
				newTokens[master_idf[el].id] = tokens[el];
			}
			else {
				master_idf[el] = {id:getID(master_idf)};
				master_idf[el].cnt =	 tokens[el];
				newTokens[master_idf[el].id] = tokens[el];
			}
		});

		doc.tokens = newTokens;
		delete master_idf.serializeFunctions;

		console.log(JSON.stringify(master_idf));
		console.log(JSON.stringify(doc));

		docs.insert(doc);
		master.update({}, master_idf, {upsert:true});
	};

	var settings = new ocrsdkModule.ProcessingSettings();
	// Set your own recognition language and output format here
	settings.language = "English"; // Can be comma-separated list, e.g. "German,French".
	settings.exportFormat = "txt"; // All possible values are listed in 'exportFormat' parameter description 
                                   // at http://ocrsdk.com/documentation/apireference/processImage/

	console.log("Uploading image..");
	//ocrsdk.processImage(imagePath, settings, uploadCompleted);

	var MongoConnection = require('./MongoConnection');
	new MongoConnection("similarity", function (err, mc) {
		if(err)
			console.log(err);

		var wp = require('./wordProc');
		wp.init(outputPath);

		mc.getCollection([wp.master, "docs"], function (collections) {
			master = collections.collection[0];
			docs = collections.collection[1];

			var newdoc = wp.getDetails( wp.tokenize());
			newdoc.file = imagePath;
			
			console.log("newdoc");

			master.find({}).toArray(function (err, items) {
				var idf = items[0];
				if (argv.m == '1') {
					console.log("Adding new doc");
					addDocToDB(newdoc, idf);
				}
				else if (argv.m == '2') {
					console.log("Comparing doc");
				}
				mc.db.close();
			});
		});
	});

} catch (err) {
	console.log("Error: " + err.message);
}
