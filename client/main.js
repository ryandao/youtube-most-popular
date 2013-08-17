$('document').ready(function() {
  var nextPage = 1;

  var queryVideos = function(data, callback) {
    $.ajax({
      url: '/videos',
      data: data,
      dataType: 'json',
      success: callback,
      error: function(error) { console.log(error); }
    });
  };

  var videoLoadedCallback = function(data) {
    var html = "";

    if (typeof data.nextPage !== 'undefined') {
      nextPage = data.nextPage;
    }

    data.items.forEach(function(videoJson) {
      var video = new Video(videoJson);
      html += video.getFullHtml();
    });

    $('#content').prepend(html);
  };

  $('#load-more').click(function() {
    queryVideos({ nextPage: nextPage }, videoLoadedCallback);
  });

  queryVideos({}, videoLoadedCallback)
});

var Video = function(json) {
  this.id = json.id;
  this.title = json.title;
  this.embedUrl = "http://www.youtube.com/embed/" + this.id;
  this.videoWidth = 300;
  this.videoHeight = 225;

  var _this = this;
  this.getEmbedHtml = function() {
    return "<iframe title=" + _this.title +
           " class='youtube-player' type='text/html' width=" + _this.videoWidth +
           " height=" + _this.videoHeight +
           " src=" + _this.embedUrl +
           " frameborder='0' allowFullScreen></iframe>";
  };

  this.getFullHtml = function() {
    var html =
      "<div class='video-result'> " +
        _this.getEmbedHtml() +
        "<p>" +
          _this.title +
        "</p>" +
      "</div>";

    return html;
  };
}