var connect = require('connect');
var connectRoute = require('connect-route');
var MongoClient = require('mongodb').MongoClient;

// Database configuration
var db = "youtube-most-popular";
var host = "localhost";
var port = "27017";

connect.createServer(
  connect.static('client'),
  connectRoute(function(app) {
    app.get('/videos', function(req, res) {
      var pageSize = 20;
      var currentPage = 1;

      MongoClient.connect("mongodb://" + host + ":" + port + "/" + db, function(err, db) {
        if (err) { return console.dir(err); }

        db.collection('videos', function(err, collection) {
          if (err) { return console.dir(err); }

          collection
            .find()
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .sort({ _id: 1 })
            .toArray(function(err, items) {
              if (err) { return console.dir(err); }

              var json = {
                items: items
              };

              res.writeHead(200, {'Content-type': 'application/json'})
              res.end(JSON.stringify(json));
            });

        });
      });
    });
  })
).listen(8080);


