"use strict"

define ["eventdispatcher"],

(EventDispatcher) ->

    class Groupy
        constructor: () ->
            @ent_groups = {}
            @group = "default"

            @on "ENTITY_DESTROYED", (ent) ->
                group = @ent_groups[ent.group]
                if group?
                    ind = group.indexOf(ent)
                    group.splice(ind, 1)

            @on "ENTITY_ADDED", (ent) ->
                @trigger "GROUP_CHANGE", ent

            @on "CHANGE", (key) ->
                if key is "group"
                    @trigger "GROUP_CHANGE"
                    
            @on "GROUP_CHANGE", (ent) ->
                group = @ent_groups[ent.group]
                if not group?
                    group = @ent_groups[ent.group] = []
                ind = group.indexOf(ent)
                if ind isnt -1
                    group.splice(ind, 1)
                else
                    group.push(ent)

        findGroup: (group) ->
            return [] if not @ent_groups[group]?
            return @ent_groups[group].slice()

    return Groupy