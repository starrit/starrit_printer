'use strict';
var out = console.log;

out("Initializing required dependencies:")
var express = require('express');
var http = require('http');
var bunyan = require('bunyan');
var dotenv = require('dotenv');
var path = require('path');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var fs  = require('fs');
var util = require('util')
dotenv.load();

// HTTP Server
var app = express();
var server = http.createServer(app);
out("Server created: "+ server)
//Parsing of input body for use by express
out("Use bodyPaser:urlencoded")
app.use(bodyParser.urlencoded({limit: '50mb'}));

// -- Logging --
var loggerConfig = {
    name: "printerLog",
    streams: [ ],
    serializers: bunyan.stdSerializers
};
var baselog = "tilingLog";
loggerConfig.streams.push( { level: 'debug', path: baselog + '.log' });
var logger = bunyan.createLogger(loggerConfig);

logger.info("Starting up service");

//setting up CORS
out("set up CORS")
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

out("Setup healthcheck endpoint")
// Healthcheck endpoint
app.get('/healthcheck', function(req, res) {
    res.status(200).json("Service healthy: " + "StarrIT Printer");
});

// Handle uncaught exceptions
out("Handle uncaught exceptions")
process.on('uncaughtException', function(err) {
    console.log(err);
});

//handle errors that occur within Promises and resolve to unhandled rejections.
out("handle promise errors")
process.on('unhandledRejection', function(reason, p){
    console.log(reason);
    console.log(p);
});

var printer = require("printer");

/**
 * @api {post} /print
 * @apiDescription Prints a photo.
 * @apiParam {Multipart} file in body containing Image file
 */
console.log(printer.getPrinter('Canon_CP910'))
app.post('/print', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        if (err) {
            res.status(500).json(err);
        } else {
            var image = files['file'];
            if (!image) {
                res.status(500).json("Missing image for printing!");
            } else {
                if (!image) {
                    res.status(500).json("Image needs to be present to print");
                } else {
                    fs.readFile(image.path, function(err, f) {

                        printer.printDirect({data:f // or simple String: "some text"

                        , type: 'RAW' // type: RAW, TEXT, PDF, JPEG, .. depends on platform
                            ,docname: 'Doc1'
                            , success:function(jobID){
                                console.log("sent to printer with ID: "+jobID);
                                var jobInfo = printer.getJob('Canon_CP910', jobID)
                                console.log(jobInfo)

                            }
                            , error:function(err){
                                console.log(err);}
                        });
                        res.status(200).json("printed")
                    }.bind(this));

                }
            }
        }
    }.bind(this));

}.bind(this));


server.listen(3007, function () {
    var host = '127.0.0.1';
    logger.info('Listening at http://%s:%s', host, 3007);
});