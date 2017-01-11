var xml2js = require('xml2js');
var prompt    = require('prompt');
var fs = require('fs');
var parser = new xml2js.Parser();

prompt.start();

console.log("Insert the repository's name");

prompt.get(['repo'], function (err, result) {

	fs.readdir(result.repo, (err, files) => {
	  
	  files.forEach(file => {

		if (file.endsWith(".xml")) {
		  		
		  	

		  	
		  	fs.readFile(result.repo + '/' + file, function(err, data) {
		  	    parser.parseString(data, function (err, result) {

		  	    	var largeClass = 0;
		  	    	var longMethod = 0;
		  	    	var longParameterList = 0;

		  	    	if (typeof result.pmd.file !== "undefined") {
		  	    		for (var i = 0; i < result.pmd.file.length; i++) {
		  	    			var codeFile = result.pmd.file[i];

		  	    			for (var j = 0; j < codeFile.violation.length; j++) {
		  	    				if (codeFile.violation[j].$.rule === "TooManyMethods") {
		  	    					largeClass += 1;
		  	    				} else if (codeFile.violation[j].$.rule === "ExcessiveMethodLength"){
		  	    					longMethod += 1;
		  	    				} else if (codeFile.violation[j].$.rule === "TooManyFields"){
		  	    					longParameterList += 1;
		  	    				}

		  	    			}
		  	    		}
		  	    	}

		  	    	console.log('Release: ' + file.replace('.xml', ""));
		  	    	console.log('Large Class: ' + largeClass);
		  	    	console.log('Long Method: ' + longMethod);
		  	    	console.log('Long Parameter List: ' + longParameterList);
		  	    	console.log('Total Smell: ' + (largeClass + longMethod + longParameterList));
		  	    	console.log();
		  	    });
		  	});
		 }
	  });
	})	
});