var express = require('express');
var mongodb = require('mongodb');
var url = require('url');
var crypto = require("crypto");

var app = express();
var MongoClient = mongodb.MongoClient;
var host = process.env.IP || 'localhost';
var port = process.env.PORT || 80;
var mongoURI = "mongodb://user:password@ds123182.mlab.com:23182/url-shortener-microservice";

function GetHash(url) {
  var hash = crypto.createHash('md5');
  hash.update(url);
  return hash.digest('hex');
}

/**
 * Connect to Mongodb
 */
MongoClient.connect(mongoURI, function(err, db) {
  if(err) { 
    return console.dir(err); 
  }
  
  var collection = db.collection("url-map");
  
  app.get('/:URL', function(req, res) {
    console.log(req.params.URL);
    collection.findOne({hash: req.params.URL.toString() }
      , function(err, item) {
      if (err) {
        console.log(err);
        res.writeHead(420);
        res.end("error retrieving short url from database");
        return;
      }
      
      console.log(item.url);
      
      res.redirect(item.url);
    });

  
  });
  
  app.get('/new/*', function(req, res) {
    console.log(req.params[0]);
    // return error for invalid url
    if (!url.parse(req.params[0]).host){
      res.writeHead(420);
      res.end("error- malformed url");
      return;
    }
    
    var hash = GetHash(req.params[0]);
    
    // store url
    collection.insert({'url': req.params[0], 'hash': hash}
      , {w:1}
      , function(err, result) {
      if (err) {
        res.writeHead(400);
        console.log(err);
        res.end("error inserting url into databse");
        return;
      }

      console.log(JSON.stringify({'newUrl': hash}));
      
      // return json
      res.writeHead(200);
      res.end(JSON.stringify({'newUrl': hash}));
    });
  });

})

  
/**
 * Listen for requests
 */
app.listen(port, function(err, data) {
  if (err) {
    console.log("Error starting express on port " + port)
    console.log(err);
  }
  console.log("express on port " + port);
});