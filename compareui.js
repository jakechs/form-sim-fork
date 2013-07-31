var express = require('express');
var fs = require('fs');
var app = express();

app.use(express.bodyParser());

app.post('/api/upload', function(req, res) {
    console.log(JSON.stringify(req.files));
	//res.end('File uploaded. '+JSON.stringify(req.files));
    fs.readFile(req.files.userfile.path, function (err, data) {
  // ...
        var newPath = __dirname + "/uploads/" + req.files.userfile.name;
        fs.writeFile(newPath, data, function (err) {
           res.redirect("/compare/"+req.files.userfile.name);
        });
    });
});


/*
app.get('/api/:func', function (req, res) {
  res.setHeader('Content-Type', 'text/plain');
 
  // Send the value passed from the middleware, above.
  var t = 2000;
  if(req.params.func == 'long'){
    t = 10000;   
  }
  
  if(req.params.func == 'compare'){
    var childProcess = require('child_process'),
        ls;
    ls = childProcess.exec('ls -l', function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
        }
        console.log('Child Process STDOUT: '+stdout);
        console.log('Child Process STDERR: '+stderr);
    });
    ls.on('exit', function (code) {
        console.log('Child process exited with exit code '+code);
      }); 
  }
  setTimeout(function(){
    res.end('You called to the api '+req.params.func);
  }, t);
});

*/

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT || 3000);