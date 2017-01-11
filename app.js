var prompt    = require('prompt');
var winston = require('winston');
var requestify      = require('requestify');
var fs = require('fs');
var request = require('request');
var ProgressBar = require('progress');
var unzip = require('unzip');
var exec = require('child_process').exec;


var uncompressed = 0;
var PMDDone = 0;

// To prompt the user
 prompt.start();

 winston.log('info', 'Type in the repository\'s owner and the repository\'s name', {});

  prompt.get(['owner', 'repo'], function (err, result) {
    
    if (err) { 
      winston.log('error', 'Error getting user input!', {});
    }

    var url = "https://api.github.com/repos/" + result.owner + "/" + result.repo + "/releases";

    requestify.get(url).then(function(response) {
        
        var data = response.getBody();
        console.log(result.repo + " has a total of " + data.length + " releases.");

        var totalReleasesDownloadedBar = new ProgressBar('  Downloading Releases [:bar] :percent :current/:total', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: data.length
          });

        var PMDBar = new ProgressBar('  Runnig PMD [:bar] :percent :current/:total', {
                            complete: '=',
                            incomplete: ' ',
                            width: 20,
                            total: data.length
                        });

        var totalReleasesUncompressedBar = new ProgressBar('  Unzipping Releases [:bar] :percent :current/:total', {
                            complete: '=',
                            incomplete: ' ',
                            width: 20,
                            total: data.length
                        });

        var dir = result.repo;

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }


        for (var i = 0; i < data.length; i++) {

          totalReleasesDownloadedBar.tick(0);

          fs.writeFile(dir + "/" + data[i].tag_name  + ".date", data[i].created_at, function(err) {
          });
          
          downloadRelease(data[i].zipball_url, data[i].tag_name, dir, function(releaseName) {
             totalReleasesDownloadedBar.tick(1);



             if (totalReleasesDownloadedBar.complete) {
                console.log("Finished downloading releases.");

                totalReleasesUncompressedBar.tick(uncompressed);
             }

             unzipRelease(releaseName, dir, function(releaseName){
                
                if (totalReleasesDownloadedBar.complete) {
                  totalReleasesUncompressedBar.tick(1);
                } else {
                  uncompressed++;
                }

                if (totalReleasesUncompressedBar.complete) {
                  console.log("Finished uncompressing releases.");
                  PMDBar.tick(PMDDone);
                }
             

                //fs.unlinkSync(dir + "/" + releaseName + ".zip");

                generatePMDReport(releaseName, dir, function(releaseName){
                  
                  if (totalReleasesUncompressedBar.complete) {
                    
                    PMDBar.tick(1);
                  
                  } else {
                    PMDDone++;
                  }

                });

             });

          });
        }
    }); 
  });

  var downloadRelease = function(url, fileName, dir, callback) {

      var options = {
        url: url,
        headers: {
          'User-Agent': "felipenbrito"
        },
        encoding: null
      };

      request(options, function(error, response, body) {
        
        if (error && response.statusCode !== 200) {
          winston.log('Error', error);
          return;
        }

        fs.writeFile(dir + "/" + fileName + ".zip", body, function(err) {
          callback(fileName);
        });
      });
  }

var unzipRelease = function(fileName, dir, callback) {
  fs
    .createReadStream(dir + "/" + fileName + ".zip")
    .pipe(unzip.Extract({ path: dir + "/" + fileName }));
    callback(fileName);
}

var generatePMDReport = function(fileName, dir, callback) {

  var cmd = './pmd/bin/run.sh pmd -d ' + dir + '/' + fileName +  ' -f xml -R rulesets/java/codesize.xml -reportfile ./'+ dir + '/' + fileName + '.xml';

  exec(cmd, function(error, stdout, stderr) {
      callback(fileName);
  });
}

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};