process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

var request = require('request');
var querystring = require('querystring');
var q = require('q');
var MongoClient = require('mongodb').MongoClient;

// Database configuration
var db = "youtube-most-popular";
var host = "localhost";
var port = "27017";

// An object that wraps around an array of promises that
// proxies some array methods to the underlying promises.
// Inspired by EmberJS ArrayProxy.
var ArrayProxy = function(promises) {
  this.promises = promises;

  this.forEach = function(callback) {
    this.promises.forEach(function(entry) {
      entry.then(callback);
    })
  }
}

var api = function() {
  this.baseUrl = 'https://www.googleapis.com/youtube/v3/';
  this.apiKey = 'AIzaSyDRSYXX5uXaQQ7OduW6y3i3P9lNhTtKfoU';

  this.query = function(url) {
    url = url + '&key=' + this.apiKey;
    var deferred = q.defer();

    request.get({
      url: url,
      json: true
    }, function(error, response, body) {
      if (response.statusCode == 200) {
        deferred.resolve(body);
      } else {
        console.log(body);
        deferred.reject(error);
      }
    });

    return deferred.promise;
  }

  this.categoryQuery = function(queryStr) {
    var url = this.baseUrl + 'guideCategories?' + queryStr;
    return this.query(url);
  };

  this.channelQuery = function(queryStr) {
    var url = this.baseUrl + 'channels?' + queryStr;
    return this.query(url);
  };

  this.searchQuery = function(queryStr) {
    var url = this.baseUrl + 'search?' + queryStr;
    return this.query(url);
  };

  this.videoQuery = function(queryStr) {
    process.stdout.write("!");
    var url = this.baseUrl + 'videos?' + queryStr;
    return this.query(url);
  };

  this.fetchAllCategories = function() {
    var queryStr = querystring.stringify({
      part: 'id',
      regionCode: 'US'
    });

    var deferred = q.defer();

    categoryQuery(queryStr).then(function(val) {
      var categoryIds = [];

      for (var k in val.items) {
        categoryIds.push(val.items[k].id);
      }

      deferred.resolve(categoryIds);
    })

    return deferred.promise;
  };

  this.fetchAllChannels = function(categoryIds) {
    var promises = []; // array of promises for each query

    categoryIds.forEach(function(categoryId) {
      var queryStr = querystring.stringify({
        part: 'id',
        categoryId: categoryId,
        maxResults: 50
      });

      var fetchChannels = function(queryStr) {
        var channelIds = [];
        var deferred = q.defer();
        promises.push(deferred.promise);

        this.channelQuery(queryStr).then(function(val) {
          val.items.forEach(function(item) {
            channelIds.push(item.id);
          });

          deferred.resolve(channelIds);

          // Continue querying if not done yet
          if (val.nextPageToken) {
            queryStr = querystring.stringify({
              part: 'id',
              categoryId: categoryId,
              maxResults: 50,
              pageToken: val.nextPageToken
            });

            fetchChannels(queryStr);
          }
        });
      };

      fetchChannels(queryStr);
    });

    return new ArrayProxy(promises);
  };

  this.fetchAllVideos = function(channelIds) {
    var promises = [];
    console.log("Total channels: " + channelIds.length);

    channelIds.forEach(function(channelId) {
      var queryStr = querystring.stringify({
        part: 'snippet',
        channelId: channelId,
        maxResults: 50
      });

      var fetchVideos = function(queryStr) {
        var videoJsons = [];
        var deferred = q.defer();
        promises.push(deferred.promise);

        this.searchQuery(queryStr).then(function(val) {
          val.items.forEach(function(item) {
            videoJsons.push(item);
          });

          deferred.resolve(videoJsons);

          if (val.nextPageToken) {
            queryStr = querystring.stringify({
              part: 'snippet',
              channelId: channelId,
              pageToken: val.nextPageToken,
              maxResults: 50
            });
            fetchVideos(queryStr);
          }
        });
      };

      fetchVideos(queryStr);
    });

    return new ArrayProxy(promises);
  };

  return this;
}();

var Video = function(json) {
  // Extract basic info including
  // * Id
  // * Title
  // * Url
  // * Description
  this.id = json.id.videoId;
  this.title = json.snippet.title;
  this.description = json.snippet.description;
  this.url = 'http://www.youtube.com/watch?v=' + this.id;

  this.save = function(collection) {
    var data =  {
      id: this.id,
      title: this.title,
      description: this.description,
      url: this.url
    };

    var _this = this;
    collection.update({id: this.id}, data, {upsert: 1}, function(error, result) {
      if (error) { return console.dir(error); }
    });
  };

  // Save the video into Mongo database if it's popular.
  // Popularity is based on:
  //   * Whether the video has more than 1 million views
  //   * Whether the video has more than 90% like counts
  this.saveIfPopular = function(collection) {
    // Retrieve view count
    if (typeof this.id === 'undefined') { return; }

    var queryStr = querystring.stringify({
      part: 'statistics',
      id: this.id
    })

    var _this = this;
    api.videoQuery(queryStr).then(function(val) {
      // If more than million and more than 90% likes
      var viewCount = parseInt(val.items[0].statistics.viewCount);
      var likeCount = parseInt(val.items[0].statistics.likeCount);
      var dislikeCount = parseInt(val.items[0].statistics.dislikeCount);

      if (viewCount > 1000000 & (likeCount / dislikeCount) > 9) {
        _this.save(collection);
      }
    });
  };
};

// Main execution
MongoClient.connect("mongodb://" + host + ":" + port + "/" + db, function(err, db) {
  if (err) {
    return console.dir(err);
  }

  var collection = db.collection('videos');

  api.fetchAllCategories().then(function(categoryIds) {
    api.fetchAllChannels(categoryIds).forEach(function(channelIds) {
      api.fetchAllVideos(channelIds).forEach(function(videoJsons) {
        videoJsons.forEach(function(videoJson) {
          process.stdout.write(".");
          var video = new Video(videoJson);
          video.saveIfPopular(collection);
        });
      });
    });
  });
});