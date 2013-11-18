(function() {
  "use strict";
  define(["jquery-ui", "handlebars"], function($) {
    var $BackIcon, $CenterTileDialog, $CenterTileDialogContent, $CenterTileDialogTBox, $SpritesContainer, $SpritesContainerContent, $SpritesContainerTBox, $TilesContainer, $TilesContainerContent, $TilesContainerHolder, $TilesContainerTBox, FolderBox, SelectableBox, SelectableBoxTitle, SelectableDragable, TileForm, all_folders, createGrid, createTileFromSprite, current_sprite_folder, displaySpritesAndFolders, hud_zindex, onFolderClick, prev_sprite_folder, showTilePropertyForm, tpl_select_drag, tpl_title, wrapImage,
      _this = this;
    SelectableDragable = "<div id = {{id}} class=\"selectable\">\n    <div class=\"title-container\">\n        <h5 id=\"title\"> {{title}} </h5>\n        <div class=\"title-buttons\">\n            <i id=\"toggle-show\" class=\"fa fa-minus-circle\"></i>\n        </div>\n    </div>\n    <div class=\"holder\">\n        <div class=\"toolbox\"></div>\n        <div class=\"content\">\n    </div>\n    </div>\n</div>";
    TileForm = "<div class=\"keyval\">\n    <div>\n        <label for=\"name\">Name</label>\n        <input id=\"tile-name\" type=\"text\" value=\"{{name}}\"></input>\n    </div>\n\n    <div>\n        <label for=\"layer\">Layer</label>\n        <select id=\"layer-cbox\">\n            <option value=\"0\">0</option>\n            <option value=\"1\">1</option>\n            <option value=\"2\">2</option>\n            <option value=\"3\">3</option>\n            <option value=\"4\">4</option>\n            <option value=\"5\">5</option>\n        </select>\n    </div>\n\n    <div>\n        <label for=\"size\">Size</label>\n        {{{minigrid}}}\n    </div>\n</div>";
    SelectableBox = "<li class=\"selectable-box\">\n</li>";
    SelectableBoxTitle = "<span class=\"selectable-title\">\n    {{title}}\n</span>";
    FolderBox = "<i class=\"fa fa-folder-open\"></i>";
    $BackIcon = $("<i class=\"fa fa-arrow-circle-left\"></i>");
    tpl_select_drag = Handlebars.compile(SelectableDragable);
    tpl_title = Handlebars.compile(SelectableBoxTitle);
    prev_sprite_folder = "";
    current_sprite_folder = "";
    all_folders = Hal.asm.getSpriteFolders();
    /*
        Sprite list dialog
    */

    $SpritesContainer = $(tpl_select_drag({
      title: "Sprites",
      id: "sprite-container"
    }));
    $SpritesContainer.css("top", "20px");
    $SpritesContainer.css("right", "50px");
    $SpritesContainer.draggable();
    $SpritesContainer.resizable();
    $SpritesContainerContent = $SpritesContainer.find(".content");
    $SpritesContainerTBox = $SpritesContainer.find(".toolbox");
    $SpritesContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "up"
      });
      return $(this).toggleClass("fa-minus-circle fa-plus-circle");
    });
    /*
        Tiles container
    */

    $TilesContainer = $(tpl_select_drag({
      title: "Tiles",
      id: "tiles-container"
    }));
    $TilesContainer.css("top", "337px");
    $TilesContainer.css("position", "absolute");
    $TilesContainer.css("right", "50px");
    $TilesContainer.draggable();
    $TilesContainer.resizable();
    $TilesContainerHolder = $TilesContainer.find(".holder");
    $TilesContainerContent = $TilesContainer.find(".content");
    $TilesContainerTBox = $TilesContainer.find(".toolbox");
    $TilesContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "up"
      });
      return $(this).toggleClass("fa-minus-circle fa-plus-circle");
    });
    /*
        Tile editing container
    */

    $CenterTileDialog = $(tpl_select_drag({
      title: "#",
      id: "tile-container"
    }));
    $CenterTileDialog.resizable();
    $CenterTileDialog.draggable();
    $CenterTileDialog.css({
      "left": "50%",
      "top": "50%",
      "margin-left": "-150px",
      "margin-top": "-150px"
    });
    $CenterTileDialog.css("position", "absolute");
    $CenterTileDialogContent = $CenterTileDialog.find(".content");
    $CenterTileDialogTBox = $CenterTileDialog.find(".toolbox");
    $CenterTileDialog.find("#toggle-show").switchClass("fa-minus-circle", "fa-arrow-right");
    $CenterTileDialog.hide();
    $CenterTileDialog.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable");
      return holder.toggle("clip");
    });
    hud_zindex = +Hal.dom.hud.style["z-index"];
    wrapImage = function(img) {};
    displaySpritesAndFolders = function(content, sprites, folders) {
      var f, i, s, sprBox;
      content.empty();
      for (i in folders) {
        f = folders[i];
        sprBox = $(SelectableBox);
        sprBox.attr("id", "folder");
        sprBox.attr("folder", i);
        sprBox.append(FolderBox);
        sprBox.append(tpl_title({
          title: i
        }));
        content.append(sprBox);
      }
      for (i in sprites) {
        s = sprites[i];
        sprBox = $(SelectableBox);
        sprBox.attr("id", "sprite");
        sprBox.attr("sprite_path", s.getName());
        sprBox.append(s.img);
        sprBox.append(tpl_title({
          title: s.name
        }));
        sprBox.draggable({
          revert: "invalid",
          helper: "clone",
          start: function(ev, ui) {
            return $(ui.helper).css("z-index", hud_zindex + 1);
          }
        });
        content.append(sprBox);
      }
      return content.find("li#folder").each(function(k, v) {
        return $(v).click(function() {
          return onFolderClick.call(this);
        });
      });
    };
    onFolderClick = function() {
      var folders, sprites;
      $SpritesContainerTBox.append($BackIcon);
      prev_sprite_folder = current_sprite_folder;
      $BackIcon.show();
      current_sprite_folder = "" + prev_sprite_folder + "/" + ($(this).attr('folder'));
      folders = Hal.asm.getSpriteFoldersFromFolder(current_sprite_folder);
      sprites = Hal.asm.getSpritesFromFolder(current_sprite_folder);
      return displaySpritesAndFolders($SpritesContainerContent, sprites, folders);
    };
    Hal.trigger("DOM_ADD", function(domlayer) {
      var $domlayer;
      $domlayer = $(domlayer);
      $SpritesContainerTBox.append($BackIcon);
      $BackIcon.hide();
      $BackIcon.click(function() {
        var folders, sprites;
        if (prev_sprite_folder === current_sprite_folder) {
          prev_sprite_folder = "";
        }
        if (prev_sprite_folder === "") {
          folders = all_folders;
        } else {
          folders = Hal.asm.getSpriteFoldersFromFolder(prev_sprite_folder);
        }
        sprites = Hal.asm.getSpritesFromFolder(prev_sprite_folder);
        displaySpritesAndFolders($SpritesContainerContent, sprites, folders);
        current_sprite_folder = prev_sprite_folder;
        if (current_sprite_folder === "") {
          return $BackIcon.hide();
        }
      });
      displaySpritesAndFolders($SpritesContainerContent, null, all_folders);
      $domlayer.append($SpritesContainer);
      $domlayer.append($CenterTileDialog);
      $TilesContainerHolder.droppable({
        accept: "#sprite",
        activeClass: "border-active",
        drop: function(ev, ui) {
          var t;
          t = createTileFromSprite(ui.draggable.clone());
          return showTilePropertyForm(t);
        }
      });
      return $domlayer.append($TilesContainer);
    });
    createTileFromSprite = function(sprite) {
      var tile;
      tile = {
        id: Hal.ID(),
        name: "#",
        size: "1",
        sprite: sprite.attr("sprite_path"),
        prefered_layer: 0
      };
      sprite.data("tile", tile);
      return sprite;
    };
    showTilePropertyForm = function(tile_wrapper) {
      var $TileForm, tile, tpl_tile_form;
      $CenterTileDialogContent.empty();
      tile_wrapper.addClass("border-active");
      tile = tile_wrapper.data("tile");
      $CenterTileDialog.find("#title").text(tile.sprite);
      tpl_tile_form = Handlebars.compile(TileForm);
      $TileForm = $(tpl_tile_form({
        name: tile.name,
        size: tile.size,
        prefered_layer: tile.prefered_layer,
        minigrid: createGrid(tile.sprite, tile.size)
      }));
      $CenterTileDialogContent.append($TileForm);
      $TileForm.find("#layer-cbox option[value=" + tile.prefered_layer + "]").attr("selected", "selected");
      $CenterTileDialog.show("clip");
      return $TilesContainerContent.append(tile_wrapper);
    };
    return createGrid = function(sprname, encodednum, container) {
      var $cell, $parent, $wrapper, bin, diagonal, diff, factor, h, i, j, k, numcols, numrows, size, spr, toggleActiveCell, w, _i, _j;
      if (container == null) {
        container = $CenterTileDialog;
      }
      toggleActiveCell = function() {
        return $(this).toggleClass("minigrid-active-cell");
      };
      spr = Hal.asm.getSprite(sprname);
      h = Math.pow(2, ~~(Math.log(spr.h - 1) / Math.LN2) + 1);
      factor = 16;
      size = 128;
      w = Math.max(h, spr.h) * 2;
      numrows = w / size;
      numcols = w / size;
      diagonal = (Math.sqrt(2 * size * size) * numrows) / (size / factor);
      diff = diagonal - (numcols * factor);
      $wrapper = $("<div/>", {
        "width": diagonal + "px",
        "height": (diagonal / 2) + "px",
        "class": "minigrid-wrapper"
      });
      $parent = $("<div/>", {
        "class": "minigrid",
        "width": numcols * factor,
        "height": numrows * factor,
        "css": {
          "left": (diff * 0.5 - 1) + "px",
          "top": -(diff * 0.5 - (numrows * 5) / 2 + (numrows / 2 + 1)) + "px"
        }
      });
      k = 0;
      bin = encodednum.split('');
      for (i = _i = 0; 0 <= numrows ? _i < numrows : _i > numrows; i = 0 <= numrows ? ++_i : --_i) {
        for (j = _j = 0; 0 <= numcols ? _j < numcols : _j > numcols; j = 0 <= numcols ? ++_j : --_j) {
          $cell = $("<div/>", {
            "css": {
              "float": "left"
            },
            "width": factor - 1,
            "height": factor - 1
          });
          if (+bin[k]) {
            $cell.addClass("minigrid-active-cell");
          }
          k++;
          $cell.appendTo($parent);
          $cell.click(toggleActiveCell);
        }
      }
      $parent.appendTo($wrapper);
      log.debug($parent.html());
      log.debug($wrapper.html());
      log.debug($wrapper[0].outerHTML);
      return new Handlebars.SafeString($wrapper[0].outerHTML);
    };
  });

}).call(this);
