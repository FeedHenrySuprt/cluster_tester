var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');
var cluster = require('cluster');

//console.log(cluster);
if (cluster.isMaster) {
	 // Create four workers
	 for (var i = 0; i < 4; i++) {
	    console.log('Creating worker ' + i);
	    cluster.fork();
	 }

	  Object.keys(cluster.workers).forEach(function(id) {
	    console.log("I am running with ID : "+cluster.workers[id].process.pid);
	  });

	  cluster.on('exit', function(worker, code, signal) {
	    console.log('worker ' + worker.process.pid + ' died');
	  });

 // Code to run if we're in a worker process
 } else {
	// list the endpoints which you want to make securable here
	console.log('I am worker #' + cluster.worker.id);
	var securableEndpoints;
	// fhlint-begin: securable-endpoints
	securableEndpoints = ['/hello'];
	// fhlint-end

	var app = express();

	// Enable CORS for all requests
	app.use(cors());

	// Note: the order which we add middleware to Express here is important!
	app.use('/sys', mbaasExpress.sys(securableEndpoints));
	app.use('/mbaas', mbaasExpress.mbaas);

	// allow serving of static files from the public directory
	app.use(express.static(__dirname + '/public'));

	// Note: important that this is added just before your own Routes
	app.use(mbaasExpress.fhmiddleware());

	// fhlint-begin: custom-routes
	app.use('/hello', require('./lib/hello.js')());
	// fhlint-end

	// Important that this is last!
	app.use(mbaasExpress.errorHandler());

	var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
	var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
	var server = app.listen(port, host, function() {
    console.log("App started at: " + new Date() + " on port: " + port);
	});
}