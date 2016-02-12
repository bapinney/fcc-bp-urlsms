var port = 8080;

var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = require('url');
var mongoURL = 'mongodb://localhost:27017/freeCodeCamp';

MongoClient.connect(mongoURL, function (err, db) {
    assert.equal(null, err);
    console.log("Mongo connection up.");
    console.log("Checking for URL serial...");
    
    var getNextSequenceValue = function(seqName) {
        var sequenceDocument = db.collection
    };
    
    var cursor = db.collection('counters').find( {"_id": ""} )
    
    app.get('/new/*', function(req, res) {
        console.log("New called!")
        inputURL = req.url.substring(5);
        res.write("NEW: This URL was called: " + inputURL + "\n");
        res.write("Checking to see if it is already in the DB...\n");
        db.collection('urlsms').find({"origURL": inputURL})
        .toArray(function (err, docs) {
            if (err) {
                console.log("There was an error checking the URL.\n");
            }
            else {
                resCount = docs.length;
            }
        });
        res.write("There are " + resCount + " result(s) returned...\n");
        if (resCount == 0) {
            
        }
        res.end();
        /*
        var cursor = db.collection('urlsms').find( {"origURL": inputURL});
        res.write("Cursor has a length of " + cursor.length);
        cursor.each(function(err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                res.write("It exists.");
            }
            else { //No more results
                res.write("End of results");
                res.end();
            }
        });
        */
    });
    app.get('/', function (req, res) {
        
        var options = {
            root: __dirname + '/public/',
            dotfiles: 'deny',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true
            }
        };
        res.sendFile('index.html',options, function(err) {
            if (err) {
                console.log(err);
                res.status(err.status).end();
            }
        });
    });
    
    app.listen(port, function () {
        console.log("Listening on port " + port);
    });
    
});
