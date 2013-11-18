(function() {
  "use strict";
  var $hero_bottom_top, $tavern_caravan_row, $tavern_hero_row, $tavern_trainer_row, html;

  html = "<div class=\"tavern draggable\">\n    <div class=\"dialog-name\">\n        <span>Tavern</span>\n        <div class=\"close-button\"></div>\n    </div>\n    <div class=\"tavern-tabs\">\n        <div class=\"chat-tab\" id=\"commander\">\n            <div class=\"chat-tab-l\"></div>\n            <span class=\"chat-tab-middle\">Commander</span>\n            <div class=\"chat-tab-r\"></div>\n        </div>\n        <div class=\"chat-tab\" id=\"agent\">\n            <div class=\"chat-tab-l\"></div>\n            <span class=\"chat-tab-middle\">Agent</span>\n            <div class=\"chat-tab-r\"></div>\n        </div>\n        <div class=\"chat-tab\" id=\"caravan\">\n            <div class=\"chat-tab-l\"></div>\n            <span class=\"chat-tab-middle\">Caravan</span>\n            <div class=\"chat-tab-r\"></div>\n        </div>\n        <div class=\"chat-tab\" id=\"trainer\">\n            <div class=\"chat-tab-l\"></div>\n            <span class=\"chat-tab-middle\">Trainer</span>\n            <div class=\"chat-tab-r\"></div>\n        </div>\n        <div class=\"chat-tab\" id=\"mercenary\">\n            <div class=\"chat-tab-l\"></div>\n            <span class=\"chat-tab-middle\">Mercenary</span>\n            <div class=\"chat-tab-r\"></div>\n        </div>\n    </div>\n    <div class=\"tavern-info\">\n        <div class=\"bars\"></div>\n        <table>\n            <tr>\n                <th>Price</th>\n                <th>Statistic</th>\n                <th>Comamnder</th>\n            </tr>\n        </table>\n    </div>\n    <div class=\"tavern-building-info\">\n        <img src=\"img/bottom-middle/buildings/tavern.png\" class=\"dialog-building-img\" />\n        <div class=\"upgrade-building\">Upgrade</div>\n        <div class=\"upgrade-building move-button\">Move</div>\n    </div>  \n    <div class=\"employ-button\">Employ</div>\n</div>";

  $tavern_hero_row = "<tr class=\"\">\n    <td>{{price}}</td>\n    <td>\n        <span class=\"statistics\">Readiness</span><span>{{agility}}</span><br>\n        <span class=\"statistics\">Speed</span><span>{{speed}}</span><br>\n        <span class=\"statistics\">Leadership</span><span>{{leadership}}</span><br>\n    </td>\n    <td>\n        <div class=\"tavern-hero-img\"></div><br>\n        <span class=\"tavern-hero-table-name\">{{name}}</span>\n    </td>\n</tr>";

  $tavern_trainer_row = "<tr class=\"\">\n    <td>{{price}}</td>\n    <td>\n        <span class=\"statistics\">Reflexes</span><span>{{reflexes}}</span><br>\n        <span class=\"statistics\">Brawn</span><span>{{brawn}}</span><br>\n        <span class=\"statistics\">Endurance</span><span>{{endurance}}</span><br>\n    </td>\n    <td>\n        <div class=\"tavern-hero-img\"></div><br>\n        <span class=\"tavern-hero-table-name\">{{name}}</span>\n    </td>\n</tr>";

  $tavern_caravan_row = "<tr class=\"\">\n    <td>{{attr.price}}</td>\n    <td>\n        <span class=\"statistics\">Speed</span><span>{{attr.speed}}</span><br>\n        <span class=\"statistics\">Capacity</span><span>{{attr.capacity}}</span><br>\n        <span class=\"statistics\">Tongue</span><span>{{attr.tongue}}</span><br>\n    </td>\n    <td>\n        <div class=\"tavern-hero-img\"></div><br>\n        <span class=\"tavern-hero-table-name\">{{name}}</span>\n    </td>\n</tr>";

  $hero_bottom_top = "<div class=\"hero-frame\">\n    <div class=\"hero-icon\"></div>\n        <div class=\"hero-name-title\">\n            <span class=\"hero-name\">{{meta.attr.name}}</span>\n            <span class=\"hero-title\">{{meta.attr.type}}</span>\n        </div>\n        <div class=\"expirience\">\n            <span>Level {{exp_level}}</span>\n            <div class=\"exp-bar\">\n                <div class=\"exp-inner-bar\">\n                    <div></div>\n                </div>  \n            </div>\n        </div>  \n    </div>\n</div>";

  define(["jquery"], function($) {
    var $CaravanTab, $CommanderTab, $EmployButton, $Table, $TavernDialog, $TrainerTab, addHeroToBottomTopMenu, empire, getCaravans;
    empire = {
      caravans: {
        "Daskkk": {
          attr: {
            speed: 5,
            tongue: 10,
            capacity: 15,
            price: 5000
          },
          name: "Nikola Soro"
        },
        "Sale": {
          attr: {
            speed: 5,
            tongue: 10,
            capacity: 15,
            price: 5000
          },
          name: "Sale Milic"
        }
      }
    };
    getCaravans = function() {
      return empire.caravans;
    };
    $TavernDialog = $(html);
    $CommanderTab = $TavernDialog.find("#commander");
    $CaravanTab = $TavernDialog.find("#caravan");
    $TrainerTab = $TavernDialog.find("#trainer");
    $EmployButton = $TavernDialog.find(".employ-button");
    $Table = $TavernDialog.find("table");
    Hal.trigger("DOM_ADD", function(domlayer) {
      return $(domlayer).append($TavernDialog);
    });
    $TavernDialog.find(".close-button").click(function() {
      return $TavernDialog.data("tavern").trigger("DESELECTED");
    });
    $CaravanTab.click(function() {
      var caravan, caravan_name, template, _ref;
      $Table.find("tr:gt(0)").remove();
      template = Handlebars.compile($tavern_caravan_row);
      _ref = getCaravans();
      for (caravan_name in _ref) {
        caravan = _ref[caravan_name];
        html = $(template(caravan));
        html.data("hero", caravan);
        $Table.append(html);
      }
      return $Table.find("tr:gt(0)").each(function(k, v) {
        return $(v).click(function() {
          $('tr').not(this).removeClass('tr-click-bg');
          return $(this).toggleClass("tr-click-bg");
        });
      });
    });
    $CommanderTab.click(function() {
      var hero, heroes, heroname, tavern, template, tr;
      $Table.find("tr:gt(0)").remove();
      template = Handlebars.compile($tavern_hero_row);
      tavern = $TavernDialog.data("tavern");
      heroes = {
        "Nikola": {
          speed: 5,
          agility: 10,
          leadership: 15,
          price: 5000,
          name: "Nikola Soro"
        },
        "Sale": {
          speed: 5,
          agility: 10,
          leadership: 15,
          price: 5000,
          name: "Sale Milic"
        }
      };
      for (heroname in heroes) {
        hero = heroes[heroname];
        tr = $(template(hero));
        tr.data("hero", hero);
        $Table.append(tr);
      }
      return $Table.find("tr:gt(0)").each(function(k, v) {
        return $(v).click(function() {
          $('tr').not(this).removeClass('tr-click-bg');
          return $(this).toggleClass("tr-click-bg");
        });
      });
    });
    $EmployButton.click(function() {
      var hero, selected_hero;
      selected_hero = $TavernDialog.find(".tr-click-bg");
      return hero = $(selected_hero).data("hero");
    });
    Hal.on("OPEN_TAVERN_DIALOG", function(tavern) {
      $TavernDialog.data("tavern", tavern);
      $TavernDialog.fadeIn(200);
      return $CommanderTab.click();
    });
    return addHeroToBottomTopMenu = function(hero) {
      var herolist, template;
      template = Handlebars.compile($hero_bottom_top);
      html = $(template(hero));
      html.data("hero", hero);
      html.css("cursor", "pointer");
      html.click(function() {
        hero = $(this).data("hero");
        if (hero.meta.attr.type === "caravan") {
          return Hal.trigger("OPEN_CARAVAN_DIALOG", hero);
        } else if (hero.meta.attr.type === "commander") {
          return Hal.trigger("OPEN_COMMANDER_DIALOG", hero);
        }
      });
      html.hide();
      herolist = $(".bottom-top > .heroes");
      herolist.append(html);
      return html.fadeIn();
    };
  });

}).call(this);
