"use strict"

define ["sprite", "imgutils"], 

(Sprite, ImgUtils) ->

    SpriteFactory = {}

    SpriteFactory.clipFromSpriteSheet = (img, name, cliprect) ->
        return new Sprite(ImgUtils.clipImage(img, cliprect), name, 0, 0, cliprect.w, cliprect.h)

    SpriteFactory.fromSingleImage = (img, name) ->
        return new Sprite(img, name, 0, 0, img.width, img.height)

    SpriteFactory.dummySprite = () ->
        img = new Image()
        img.src = ""
        return new Sprite(img, "n/a", 0, 0, img.width, img.height)
    
    return SpriteFactory