(function() {
  "use strict";
  var __slice = [].slice;

  define([], function() {
    var Ajax, Result;
    Result = (function() {
      function Result(url) {
        this.url = url;
        this.success_ = this.fail_ = this.always_ = function() {};
        this.success = function(success_) {
          this.success_ = success_;
          return this;
        };
        this.fail = function(fail_) {
          this.fail_ = fail_;
          return this;
        };
        this.always = function(always_) {
          this.always_ = always_;
          return this;
        };
      }

      return Result;

    })();
    Ajax = new Object();
    Ajax.get = function() {
      var ajaxreq, callbacks, result, url;
      url = arguments[0], callbacks = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      result = new Result(document.domain + '/' + url);
      ajaxreq = new XMLHttpRequest();
      ajaxreq.open("GET", url);
      ajaxreq.send();
      ajaxreq.onreadystatechange = function() {
        var data, type;
        if (ajaxreq.readyState === 4) {
          type = ajaxreq.getResponseHeader("Content-Type");
          if (ajaxreq.status === 200) {
            data = ajaxreq.responseText;
            if (type === "application/json" && url.indexOf("json") === -1) {
              data = JSON.parse(data);
            }
            result.success_(data);
            if (callbacks[0]) {
              callbacks[0](data);
            }
          } else {
            result.fail_(ajaxreq.responseText);
            if (callbacks[1]) {
              callbacks[1](data);
            }
          }
          result.always_(url || data);
          if (callbacks[2]) {
            return callbacks[2](data);
          }
        }
      };
      return result;
    };
    Ajax.post = function() {
      var ajaxreq, callbacks, data, result, url;
      url = arguments[0], data = arguments[1], callbacks = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      result = new Result(document.domain + '/' + url);
      ajaxreq = new XMLHttpRequest();
      ajaxreq.open("POST", url);
      ajaxreq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      ajaxreq.send(data);
      ajaxreq.onreadystatechange = function() {
        var type;
        if (ajaxreq.readyState === 4) {
          type = ajaxreq.getResponseHeader("Content-Type");
          if (ajaxreq.status === 200) {
            data = ajaxreq.responseText;
            if (type === "application/json") {
              data = JSON.parse(data);
            }
            result.success_(data);
            if (callbacks[0]) {
              callbacks[0](data);
            }
          } else {
            result.fail_(ajaxreq.responseText);
            if (callbacks[1]) {
              callbacks[1](data);
            }
          }
          result.always_(url || data);
          if (callbacks[2]) {
            return callbacks[2](data);
          }
        }
      };
      return result;
    };
    return Ajax;
  });

}).call(this);
