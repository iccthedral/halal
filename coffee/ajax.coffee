"use strict"

define [],

() ->

    class AjaxResult
        constructor: (@url) ->
            @success_ = @fail_ = @always_ = () -> return
            @success = (@success_) ->
                return @
            @fail = (@fail_) ->
                return @
            @always = (@always_) ->
                return @
                
    Ajax        = new Object()
    Ajax.Result = AjaxResult

    Ajax.get = (url, callbacks...) ->
        result  = new AjaxResult(document.domain + '/' + url)
        ajaxreq = new XMLHttpRequest()

        ajaxreq.open("GET", url)
        ajaxreq.send()
        ajaxreq.onreadystatechange = () ->
            if (ajaxreq.readyState is 4)
                type = ajaxreq.getResponseHeader("Content-Type")
                if (ajaxreq.status is 200)
                    data = ajaxreq.responseText
                    if type is "application/json" and url.indexOf("json") is -1
                        data = JSON.parse(data)
                    result.success_(data)
                    callbacks[0](data) if callbacks[0]
                else
                    result.fail_(ajaxreq.responseText)
                    callbacks[1](data) if callbacks[1]
                result.always_(url or data)
                callbacks[2](data) if callbacks[2]
        return result

    Ajax.post = (url, data, callbacks...) ->
        result = new AjaxResult(document.domain + '/' + url)
        ajaxreq = new XMLHttpRequest()
        ajaxreq.open("POST", url);
        ajaxreq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        ajaxreq.send(data)

        ajaxreq.onreadystatechange = () ->
            if (ajaxreq.readyState is 4)
                type = ajaxreq.getResponseHeader("Content-Type")
                if (ajaxreq.status is 200)
                    data = ajaxreq.responseText
                    data = JSON.parse(data) if type is "application/json"
                    result.success_(data)
                    callbacks[0](data) if callbacks[0]
                else
                    result.fail_(ajaxreq.responseText)
                    callbacks[1](data) if callbacks[1]
                result.always_(url or data)
                callbacks[2](data) if callbacks[2]
        return result

    return Ajax