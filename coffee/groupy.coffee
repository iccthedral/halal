"use strict"

define ["eventdispatcher"],

(EventDispatcher) ->

    class Groupy
        constructor: () ->
            @ent_groups = {}
            @group = "default"

            @on "ENTITY_DESTROYED", @group_ent_destr = (ent) ->
                group = @ent_groups[ent.group]
                if group?
                    ind = group.indexOf(ent)
                    group.splice(ind, 1)

            @on "ENTITY_ADDED", @groupy_ent_add = (ent) ->
                @trigger "GROUP_CHANGE", ent

            @on "GROUP_CHANGE", @groupy_change = (ent) ->
                group = @ent_groups[ent.group]
                if not group?
                    group = @ent_groups[ent.group] = []
                ind = group.indexOf(ent)
                if ind isnt -1
                    group.splice(ind, 1)
                else
                    group.push(ent)

        destructor: () ->
            @removeTrigger "GROUP_CHANGE", @groupy_change
            @removeTrigger "ENTITY_ADDED", @groupy_ent_add
            @removeTrigger "ENTITY_DESTROYED", @group_ent_destr
        
        findGroup: (group) ->
            return [] if not @ent_groups[group]?
            return @ent_groups[group].slice()

    return Groupy