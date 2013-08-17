$('document').ready(function() {
  $.ajax({
    url: '/videos',
    dataType: 'json',
    success: function(data) {
      data.items.forEach(function(videoJson) {
        var video = new Video(videoJson);
        $('#content').append(video.getFullHtml());
      });
    },
    error: function(error) {
      console.log(error);
    }
  })
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
      "<div> " +
        _this.getEmbedHtml() +
        "<p>" +
          _this.title +
        "</p>" +
      "</div>";

    return html;
  };
}