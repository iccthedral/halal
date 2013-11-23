"use strict"

define ["Entity", "BBoxAlgos", "SpriteFactory"],

(Entity, BBoxAlgos, SpriteFactory) ->

    class SpriteEntity extends Entity
        constructor: (meta) ->
            super(meta)
            @sprite = Hal.asm.getSprite(meta.sprite)
            @visible_sprite = if meta.visible_sprite? then meta.visible_sprite else true
            @h = if meta.height? then meta.height else 0
            @w = if meta.width? then meta.width else 0

            if not @sprite?
                @sprite = SpriteFactory.dummySprite()
                Hal.asm.waitFor(@sprite, meta.sprite)
            else
                @calcShapeAndBBox()

            @sprite.onLazyLoad = () =>
                @calcShapeAndBBox()
                # @attr("shape", [
                #     [@bbox[0] - @bbox[2]*0.5, @bbox[1]-@bbox[3]*0.5],
                #     [@bbox[2]*0.5, @bbox[1] - @bbox[3] * 0.5],
                #     [@bbox[2]*0.5, @bbox[3]*0.5],
                #     [@bbox[0] - @bbox[2] * 0.5, @bbox[3]*0.5]
                # ])

        init: () ->
            super()
            
        inShapeBounds: (pos) ->
            pos = @worldToLocal(@scene.localToWorld(pos))
            if Hal.math.isPointInRect(pos, @bbox)
                if not Hal.im.isTransparent(@sprite.img, pos[0] + @bbox[2] * 0.5, pos[1] + @bbox[3] * 0.5)
                    return true
            return false

        calcShapeAndBBox: () ->
            @attr("bbox", BBoxAlgos.rectBBoxFromSprite(@sprite))
            #shape = BBoxAlgos.polyBBoxFromSprite(@sprite)
            # b_rect = BBoxAlgos.rectFromPolyShape(shape)
        
            # # lets translate the shape to origin
            # for pt, i in shape
            #     shape[i][0] -= b_rect[2] * 0.5
            #     shape[i][1] -= b_rect[3] * 0.5

            # @attr("shape", shape)

        draw: () ->
            super()
            if @visible_sprite
                @scene.g.drawSprite(@sprite, @w, @h)

    return SpriteEntity