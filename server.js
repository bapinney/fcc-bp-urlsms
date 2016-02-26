var port = process.env.PORT;
var debug = false; //Enables some extra information to be pulled through Express
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = require('url');
var mongoURL = process.env.MONGOLAB_URI;

app.use(express.static(__dirname + '/public')); //Public folder for CSS, HTML, etc.

MongoClient.connect(mongoURL, function (err, db) {
    assert.equal(null, err);
    console.log("Mongo connection up.");

    var getNextURLID = function (inputURL, callback, req, res) {
        var sequenceDocument = db.collection("counters").findAndModify({
                "_id": 'urlid'
            }, [['_id', 1]], {
                "$inc": {
                    "seq": 1
                }
            }, {
                new: true
            },
            function (err, doc) {
                if (err) {
                    console.warn(err.message);
                } else {
                    if (typeof callback === "function" &&
                        req !== undefined &&
                        res !== undefined &&
                        callback.name == "insertURLwithID") {
                        console.log("Callback name is " + callback.name);
                        console.log("About to return next URL ID");
                        insertURLwithID(inputURL, doc.value.seq, req, res);
                    }
                }
            }
        );
    };

    var insertURLwithID = function insertURLwithID(inputURL, id2use, req, res) {
        db.collection("urlsms").insertOne({
            "_id": id2use,
            "url": inputURL
        }, function (err, result) {
            assert.equal(err, null);
            var rtnJSON = {original_url: req.url.substring(5), short_url: "http://" + req.headers.host + "/" + id2use};
            res.end(JSON.stringify(rtnJSON));
        });
    };

    var createAndReturnURL = function (inputURL, req, res) {
        console.log("Create and return URL was called!\n");
        var urlre = /\(?(?:(http|https|ftp):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?/;
        var isValidURL = urlre.test(inputURL);
        if (isValidURL) {
            console.log("URL is valid");
            getNextURLID(inputURL, insertURLwithID, req, res);
        } else {
            res.end("URL is not valid");
        }
    };

    app.get('/new/*', function (req, res) {
        console.log("New called!")
        inputURL = req.url.substring(5);
        db.collection('urlsms').find({
            "url": inputURL
        })
        .toArray(function (err, docs) {
            if (err) {
                console.log("There was an error checking the URL.\n");
            } else {
                console.log("URL check result...\n");
                console.log("---\n");
                resCount = docs.length;
                console.log("There are " + resCount + " result(s) returned...\n");
                if (resCount == 0) {
                    createAndReturnURL(inputURL, req, res);
                }
                else {
                    var rtnJSON = {original_url: inputURL, short_url: "http://" + req.headers.host + "/" + docs[0]._id};
                    res.end(JSON.stringify(rtnJSON));
                }
            }
        });
    });

    var getCurrentID = function () {
        var cursor = db.collection("counters").find({
            "_id": "urlid"
        });
        cursor.nextObject(function (err, item) { //NOT a loop.  Just a next...
            curID = item.seq;
            return curID;
        });
    };

    //Use this to test increasing the current ID
    app.get('/incid', function (req, res) {
        assert.equal(debug, true);
        var cursor = db.collection("counters").findAndModify({
                "_id": "urlid"
            }, [['_id', 'desc']], {
                "$inc": {
                    "seq": 1
                }
            }, {
                "new": true, //Returns the increased value
                "upsert": true
            }, //Inserts it if it does not exist
            function (err, item) {
                if (err) {
                    console.log("There was an error:");
                    console.dir(err);
                }
                assert.ok(item.value.seq, "Expected seq value.  None found"); //Truthy check for the 'seq' value
                res.send("item is now " + item.value.seq);
            });
    });

    var redirectToURL = function (req, res, urlID) {
        var url = db.collection("urlsms").findOne({
            _id: urlID
        }, function (err, doc) {
            if (doc !== null) {
                res.redirect(301, doc.url);
                res.end();
            } else {
                res.end("URL not found.");
            }
        });
    };

    app.get('/*', function (req, res) {
        if (typeof parseInt(req.params['0']) == 'number') {
            redirectToURL(req, res, parseInt(req.params['0']));
        } else {
            var options = {
                root: __dirname + '/public/',
                dotfiles: 'deny',
                headers: {
                    'x-timestamp': Date.now(),
                    'x-sent': true
                }
            };

            res.sendFile('index.html', options, function (err) {
                if (err) {
                    console.log(err);
                    res.status(err.status).end();
                }
            });

        }

    });

    app.listen(port, function () {
        console.log("Listening on port " + port);
    });

});
