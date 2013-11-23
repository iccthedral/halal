"use strict"

define [], 
() ->

    class ImageUtils
        constructor: () ->
            #i should specify this
            @hit_ctx = @createCanvas(1, 1).getContext("2d")
            ### 
             @todo 
                Ovo treba biti maks velicine
            ###
            @tint_ctx = @createCanvas(800, 600).getContext("2d")

        createCanvas: (w, h) ->
            canvas = document.createElement("canvas")
            canvas.width = w
            canvas.height = h
            return canvas

        clipImage: (img, area) ->
            canvas  = @createCanvas(area.w, area.h)
            ctx     = canvas.getContext("2d")
            ctx.drawImage(img, area.x, area.y, area.w, area.h, 0, 0, area.w, area.h)
            img     = new Image()
            img.src = canvas.toDataURL("image/png");
            return img            

        isTransparent: (img, x, y) ->
            @hit_ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1)
            data = @hit_ctx.getImageData(0, 0, 1, 1).data
            log.debug "is transparent: #{data[3] is 255}"
            return data[3] is 255
        
        getPixelAt: (img, x, y) ->
            #ctx = @hit_canvas.getContext("2d")
            @hit_ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1)
            data = @hit_ctx.getImageData(0, 0, 1, 1).data
            pos = (x + y) * 4
            return [
                data[pos], 
                data[pos+1], 
                data[pos+2], 
                data[pos+3]
            ]

        tintImage: (img, color, opacity) ->
            tint_buff = @createCanvas(img.width, img.height)
            tint_ctx = tint_buff.getContext("2d")
            tint_ctx.globalAlpha = 1.0
            tint_ctx.drawImage(img, 0, 0)
            tint_ctx.globalAlpha = opacity
            tint_ctx.globalCompositeOperation = 'source-atop'        
            tint_ctx.fillStyle = color
            tint_ctx.fillRect(0, 0, img.width, img.height)
            return tint_buff
            
    return ImageUtils