"use strict"

define [],

() ->

    class Result
        constructor: (@url) ->
            @success_ = @fail_ = @always_ = () -> return
            @success = (@success_) ->
                return @
            @fail = (@fail_) ->
                return @
            @always = (@always_) ->
                return @
                
    Ajax = new Object()
    
    Ajax.get = (url, data, callbacks...) ->
        result = new Result(document.domain + '/' + url)
        ajaxreq = new XMLHttpRequest()
        ajaxreq.open("GET", "#{url}?#{data}")
        ajaxreq.send()

        ajaxreq.onreadystatechange = () ->
            if (ajaxreq.readyState == 4)
                type = ajaxreq.getResponseHeader("Content-Type")
                if (ajaxreq.status == 200)
                    data = ajaxreq.responseText
                    if type == "application/json" and url.indexOf("json") is -1
                        data = JSON.parse(data)
                    result.success_(data)
                    callbacks[0](data) if callbacks[0]
                else
                    result.fail_(ajaxreq.responseText)
                    callbacks[1](data) if callbacks[1]
                result.always_(url || data)
                callbacks[2](data) if callbacks[2]
        return result


    Ajax.post = (url, data, callbacks...) ->
        result = new Result(document.domain + '/' + url)
        ajaxreq = new XMLHttpRequest()
        ajaxreq.open("POST", url);
        ajaxreq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        ajaxreq.send(data)

        ajaxreq.onreadystatechange = () ->
            if (ajaxreq.readyState == 4)
                type = ajaxreq.getResponseHeader("Content-Type")
                if (ajaxreq.status == 200)
                    data = ajaxreq.responseText
                    data = JSON.parse(data) if type == "application/json"
                    result.success_(data)
                    callbacks[0](data) if callbacks[0]
                else
                    result.fail_(ajaxreq.responseText)
                    callbacks[1](data) if callbacks[1]
                result.always_(url || data)
                callbacks[2](data) if callbacks[2]
        return result

    return Ajax