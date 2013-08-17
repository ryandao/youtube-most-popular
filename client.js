var url = require('url');
var connect = require('connect');
var connectRoute = require('connect-route');
var MongoClient = require('mongodb').MongoClient;

// Database configuration
var db = "youtube-most-popular";
var host = "localhost";
var port = "27017";

// Pagination configuration
var pageSize = 20;
var currentPage = 1;

connect.createServer(
  connect.static('client'),
  connectRoute(function(app) {
    app.get('/videos', function(req, res) {
      var query = url.parse(req.url, true).query;
      if (typeof query.nextPage === 'undefined') {
        currentPage = 1;
      } else {
        currentPage = query.nextPage;
      }

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

              if (items.length == pageSize) {
                json.nextPage = currentPage + 1;
              }

              res.writeHead(200, {'Content-type': 'application/json'})
              res.end(JSON.stringify(json));
            });

        });
      });
    });
  })
).listen(8080);