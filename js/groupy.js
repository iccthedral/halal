(function() {
  "use strict";
  define(["eventdispatcher"], function(EventDispatcher) {
    var Groupy;
    Groupy = (function() {
      function Groupy() {
        this.ent_groups = {};
        this.group = "default";
        this.on("ENTITY_DESTROYED", this.group_ent_destr = function(ent) {
          var group, ind;
          group = this.ent_groups[ent.group];
          if (group != null) {
            ind = group.indexOf(ent);
            return group.splice(ind, 1);
          }
        });
        this.on("ENTITY_ADDED", function(ent) {
          return this.trigger("GROUP_CHANGE", ent);
        });
        this.on("GROUP_CHANGE", function(ent) {
          var group, ind;
          group = this.ent_groups[ent.group];
          if (group == null) {
            group = this.ent_groups[ent.group] = [];
          }
          ind = group.indexOf(ent);
          if (ind !== -1) {
            return group.splice(ind, 1);
          } else {
            return group.push(ent);
          }
        });
      }

      Groupy.prototype.findGroup = function(group) {
        if (this.ent_groups[group] == null) {
          return [];
        }
        return this.ent_groups[group].slice();
      };

      return Groupy;

    })();
    return Groupy;
  });

}).call(this);
