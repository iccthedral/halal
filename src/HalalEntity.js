(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["EventDispatcher"], function(EventDispatcher) {
    var HalalEntity;
    return HalalEntity = (function(_super) {
      __extends(HalalEntity, _super);

      function HalalEntity() {
        HalalEntity.__super__.constructor.call(this);
      }

      HalalEntity.prototype.attr = function(key, val) {
        if (arguments.length === 1) {
          if (typeof key === "string") {
            return this[key];
          }
          this.extend(key);
          return this.trigger("CHANGE", key);
        } else {
          this[key] = val;
          return this.trigger("CHANGE", [key, val]);
        }
      };

      HalalEntity.prototype.extend = function(obj) {
        var key, val;
        if (obj == null) {
          return this;
        }
        for (key in obj) {
          val = obj[key];
          if (this === val) {
            continue;
          }
          this[key] = val;
        }
        return this;
      };

      return HalalEntity;

    })(EventDispatcher);
  });

}).call(this);
