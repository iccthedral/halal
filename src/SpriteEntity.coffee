"use strict"


define ["Entity", "BBoxAlgos", "SpriteFactory"],

(Entity, BBoxAlgos, SpriteFactory) ->

    class SpriteEntity extends Entity
        constructor: (meta) ->
            super(meta)
            @sprite = Hal.asm.getSprite(meta.sprite)
            if not @sprite?
                @sprite = SpriteFactory.dummySprite()
                Hal.asm.waitFor(@sprite, meta.sprite)
            #else
                #@attr("shape", BBoxAlgos.polyBBoxFromSprite(@sprite))

            @sprite.onLazyLoad = () =>
                @attr("bbox", BBoxAlgos.rectBBoxFromSprite(@sprite))
                # @attr("shape", [
                #     [@bbox[0] - @bbox[2]*0.5, @bbox[1]-@bbox[3]*0.5],
                #     [@bbox[2]*0.5, @bbox[1] - @bbox[3] * 0.5],
                #     [@bbox[2]*0.5, @bbox[3]*0.5],
                #     [@bbox[0] - @bbox[2] * 0.5, @bbox[3]*0.5]
                # ])

                # lets translate the shape to origin
                shape = BBoxAlgos.polyBBoxFromSprite(@sprite)
                b_rect = BBoxAlgos.rectFromPolyShape(shape)
                for pt, i in shape
                    shape[i][0] -= b_rect[2] * 0.5
                    shape[i][1] -= b_rect[3] * 0.5

                @attr("shape", shape)

        draw: () ->
            super()
            Hal.glass.drawSprite(@sprite)

    return SpriteEntity