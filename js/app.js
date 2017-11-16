function isLocalStorageNameSupported() {
  var testKey = 'test', storage = window.localStorage;
  try {
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true
  }
  catch (error) {
    return false;
  }
}
var isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

var VISIBLE_DEFAULT = 15;

new Vue({
  el: "#app",
  data: {
    activeCode: "",
    activeAP: {},
    regions: [],
    isPlaying: false,
    loading: false
  },

  computed: {
    // a computed getter
    isPlayingState: function () {
      return this.isPlaying ? "playing" : "paused";
    }
  },

  mounted: function () {
    var self = this;
    var $ = jQuery;

    if (isMobile) {
      jQuery("body").addClass("isMobile");
    }

    if (isMobile) {
      jQuery('.video-foreground').html("");
    }

    $('.nxt').on('click', function () {
      var player = SC.Widget("soundcloud_player_iframe");
      player.next();
    });

    $("#stream").on("error", function (e) {
      self.error(e);
      self.loading = false;
    }).on("loadstart", function (e) {
      self.loading = true;
    }).on("canplay", function (e) {
      self.loading = false;
    });

    $.get("airports.json", function (data) {
      self.regions = data.map(function (region) {
        var aps = region.airports.map(function (cv) {
          return {
            code: cv[0],
            text: cv[1],
            iata: cv[2],
            time: cv[3],
            error: cv[4] === true
          }
        });

        aps.sort(function (a, b) {
          return a.error - b.error;
        });

        region.airports = aps;
        region.showAll = false;

        return region;
      });

      var fil = self.getAirports();

      if (document.location.hash === "#debug") {
        fil.forEach(function (element, index) {
          setTimeout(function () {
            self.listenTo(element);
          }, 1000 * (index + 1));
        }, this);
      } else if (!isMobile) {
        self.listenTo(null)
      } else {
        self.pause();
      }
    });
  },

  methods: {
    getHiddenCount: function (region) {
      return region.airports.length - VISIBLE_DEFAULT;
    },

    getAirports: function () {
      var airports = this.regions.reduce(function (acc, val) {
        return acc.concat(val.airports);
      }, []);
      return airports.filter(function (cv) {
        return cv.code !== "iss" && !cv.error && cv.code !== ""
      });
    },

    airportsBucket: function (region) {
      if (region.showAll) {
        return region.airports;
      } else {
        return region.airports.slice(0, VISIBLE_DEFAULT);
      }
      // return region.airports;
    },

    showMore: function (region) {
      region.showAll = true;
    },

    donateYes: function (e) {
      $("#supportbtns").hide();
      $("#support").show();
    },

    donateNo: function (e) {
      $("#nobtn").text("Okey :(");
    },

    error: function (e) {
      //console.log("Error detected");
      this.activeAP.error = true;
      //var txt = this.activeAP.text;
      //this.activeAP.text = txt += " (Offline)"
      //console.log("Error detected", this.activeAP);
    },

    play: function () {
      if (!this.activeAP.code) {
        this.listenTo(null);
        return;
      }
      this.isPlaying = true;
      //$('.playpause').attr("data-state", "playing");
      var player = SC.Widget("soundcloud_player_iframe");
      var stream = document.getElementById("stream");
      //playButton.goToState("playing");
      stream.play();
      player.play();
    },

    pause: function () {
      this.isPlaying = false;
      //playButton.goToState("paused");
      //$('.playpause').attr("data-state", "paused");
      var player = SC.Widget("soundcloud_player_iframe");
      var stream = document.getElementById("stream");
      stream.pause();
      player.pause();
    },

    changeState: function () {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    listenTo: function (airport) {
      if (!airport) {
        var aps = this.getAirports();
        var randomNum = Math.floor(Math.random() * (aps.length));
        var lp = localStorage.getItem("lastPlayed");
        if (lp) {
          airport = aps.find(function (ap) {
            return ap.code === lp
          });
        }

        if (!airport) {
          airport = aps[randomNum];
        }
      }

      if (!airport.code) return;
      this.activeCode = airport.code;
      this.activeAP = airport;
      if (isLocalStorageNameSupported()) {
        localStorage.setItem("lastPlayed", airport.code);
      }

      if (airport.code === "iss") {
        spaceModeOn();
      } else {
        spaceModeOff();
        var url = "http://mtl2.liveatc.net/" + airport.code;
        $("#stream").attr("src", url);
      }

      $(".current").text(airport.text + ' (' + airport.iata + ')');
      this.play();
    },

    getData: function () {
      return this.regions;
    }
  }

});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

$('#vc_music, #vc_control').on('change input', function () {
  setMusic($(this).val());
});
$('#vc_radio').on('change input', function () {
  setRadio($(this).val());
});

function setRadio(v) {
  var stream = document.getElementById("stream");
  stream.volume = v / 100;
  $('#vc_radio').val(v);
  localStorage.setItem("vc_radio", v);
}
function setMusic(v) {
  // console.log(v);
  var player = SC.Widget("soundcloud_player_iframe");
  player.setVolume(v);
  $('#vc_music, #vc_control').val(v);
  localStorage.setItem("vc_music", v);
}

var scsrc = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/5281179&auto_play=true&start_track=" + getRandomInt(0, 152);
$("#soundcloud_player_iframe").attr("src", scsrc);

// default volumes
$(function () {
  setRadio(localStorage.getItem("vc_radio") || 50);
  setMusic(localStorage.getItem("vc_music") || 50);
  setTimeout(function () {
    setRadio(localStorage.getItem("vc_radio") || 50);
    setMusic(localStorage.getItem("vc_music") || 50);
  }, 3000);
});

// var spacestream = "http://www.ustream.tv/embed/17074538?v=3&wmode=direct&autoplay=true";
// var spacestream = "https://www.youtube.com/embed/LFPqXIcP-bA?controls=0&showinfo=0&rel=0&autoplay=1&loop=1&enablejsapi=1";
var spacestream = "https://www.youtube.com/embed/ddFvjfvPnqk?controls=0&showinfo=0&rel=0&autoplay=1&loop=1&enablejsapi=1&mute=1";
var origbg = null;
var isInspace = false;
function spaceModeOn() {
  $('body').addClass("spacemode");
  isInspace = true;

  // var url = "http://mtl2.liveatc.net/" + airport.code;
  // $("#stream").attr("src", url);

  var stream = document.getElementById("stream");
  stream.pause();
  var $v = $('.video-foreground');
  if (origbg === null) {
    origbg = $v.html();
  }
  $v.html('<iframe width="720" height="437" src="' + spacestream + '" scrolling="no" frameborder="0" style="border: none;"></iframe>');
  $v.getElementById('player').mute();
}

function spaceModeOff() {
  if (isInspace) {
    $('body').removeClass("spacemode");
    $('.video-foreground').html(origbg);
  }
  isInspace = false;
}

function handleVisibilityChange() {
  var video = document.getElementById("video");
  if (!video) return;

  var iframe = video.contentWindow;

  var func;
  if (document.hidden) {
    func = 'pauseVideo';
  } else {
    func = 'playVideo';
  }
  iframe.postMessage('{"event":"command","func":"' + func + '","args":""}', '*');
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);

if (isLocalStorageNameSupported()) {
  var views = localStorage.getItem("views");
  views = parseInt(views || 0, 10);
  views += 1;
  localStorage.setItem("views", views);

  if (views >= 3) {
    $('.donate').insertAfter($(".airport-info"));
  }
}
