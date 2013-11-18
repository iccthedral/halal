"use strict"

html = 
"""
<div class="tavern draggable">
    <div class="dialog-name">
        <span>Tavern</span>
        <div class="close-button"></div>
    </div>
    <div class="tavern-tabs">
        <div class="chat-tab" id="commander">
            <div class="chat-tab-l"></div>
            <span class="chat-tab-middle">Commander</span>
            <div class="chat-tab-r"></div>
        </div>
        <div class="chat-tab" id="agent">
            <div class="chat-tab-l"></div>
            <span class="chat-tab-middle">Agent</span>
            <div class="chat-tab-r"></div>
        </div>
        <div class="chat-tab" id="caravan">
            <div class="chat-tab-l"></div>
            <span class="chat-tab-middle">Caravan</span>
            <div class="chat-tab-r"></div>
        </div>
        <div class="chat-tab" id="trainer">
            <div class="chat-tab-l"></div>
            <span class="chat-tab-middle">Trainer</span>
            <div class="chat-tab-r"></div>
        </div>
        <div class="chat-tab" id="mercenary">
            <div class="chat-tab-l"></div>
            <span class="chat-tab-middle">Mercenary</span>
            <div class="chat-tab-r"></div>
        </div>
    </div>
    <div class="tavern-info">
        <div class="bars"></div>
        <table>
            <tr>
                <th>Price</th>
                <th>Statistic</th>
                <th>Comamnder</th>
            </tr>
        </table>
    </div>
    <div class="tavern-building-info">
        <img src="img/bottom-middle/buildings/tavern.png" class="dialog-building-img" />
        <div class="upgrade-building">Upgrade</div>
        <div class="upgrade-building move-button">Move</div>
    </div>  
    <div class="employ-button">Employ</div>
</div>
"""
                # speed: 5
                # agility: 10
                # seksipil: 15
                # price: 5000
                # name: "Sale Milic"

$tavern_hero_row = 
"""
<tr class="">
    <td>{{price}}</td>
    <td>
        <span class="statistics">Readiness</span><span>{{agility}}</span><br>
        <span class="statistics">Speed</span><span>{{speed}}</span><br>
        <span class="statistics">Leadership</span><span>{{leadership}}</span><br>
    </td>
    <td>
        <div class="tavern-hero-img"></div><br>
        <span class="tavern-hero-table-name">{{name}}</span>
    </td>
</tr>
"""

$tavern_trainer_row =
"""
<tr class="">
    <td>{{price}}</td>
    <td>
        <span class="statistics">Reflexes</span><span>{{reflexes}}</span><br>
        <span class="statistics">Brawn</span><span>{{brawn}}</span><br>
        <span class="statistics">Endurance</span><span>{{endurance}}</span><br>
    </td>
    <td>
        <div class="tavern-hero-img"></div><br>
        <span class="tavern-hero-table-name">{{name}}</span>
    </td>
</tr>
"""

$tavern_caravan_row =
"""
<tr class="">
    <td>{{attr.price}}</td>
    <td>
        <span class="statistics">Speed</span><span>{{attr.speed}}</span><br>
        <span class="statistics">Capacity</span><span>{{attr.capacity}}</span><br>
        <span class="statistics">Tongue</span><span>{{attr.tongue}}</span><br>
    </td>
    <td>
        <div class="tavern-hero-img"></div><br>
        <span class="tavern-hero-table-name">{{name}}</span>
    </td>
</tr>
"""

$hero_bottom_top =
"""
<div class="hero-frame">
    <div class="hero-icon"></div>
        <div class="hero-name-title">
            <span class="hero-name">{{meta.attr.name}}</span>
            <span class="hero-title">{{meta.attr.type}}</span>
        </div>
        <div class="expirience">
            <span>Level {{exp_level}}</span>
            <div class="exp-bar">
                <div class="exp-inner-bar">
                    <div></div>
                </div>  
            </div>
        </div>  
    </div>
</div>
"""

define ["jquery"], 
($) ->
    empire = 
        caravans:
            "Daskkk":
                attr: 
                    speed: 5
                    tongue: 10
                    capacity: 15
                    price: 5000
                name: "Nikola Soro"
            "Sale":
                attr: 
                    speed: 5
                    tongue: 10
                    capacity: 15
                    price: 5000
                name: "Sale Milic"

    getCaravans = () ->
        return empire.caravans

    $TavernDialog = $(html)
    $CommanderTab = $TavernDialog.find("#commander")

    $CaravanTab   = $TavernDialog.find("#caravan")
    $TrainerTab   = $TavernDialog.find("#trainer")
    $EmployButton = $TavernDialog.find(".employ-button")
    $Table        = $TavernDialog.find("table")

    Hal.trigger "DOM_ADD", (domlayer) ->
        $(domlayer).append($TavernDialog)

    $TavernDialog.find(".close-button").click () ->
        $TavernDialog.data("tavern").trigger "DESELECTED"

    $CaravanTab.click () ->
        $Table.find("tr:gt(0)").remove()
        template = Handlebars.compile($tavern_caravan_row)

        for caravan_name, caravan of getCaravans()
            html = $(template(caravan))
            html.data("hero", caravan)
            $Table.append(html)

        $Table.find("tr:gt(0)").each (k, v) ->
            $(v).click () ->
                $('tr').not(this).removeClass('tr-click-bg')
                $(@).toggleClass("tr-click-bg")


    $CommanderTab.click () ->
        $Table.find("tr:gt(0)").remove()
        template = Handlebars.compile($tavern_hero_row)
        # tavern = $TavernDialog.data("tavern")

        tavern = $TavernDialog.data("tavern")

        heroes =
            "Nikola":
                speed: 5
                agility: 10
                leadership: 15
                price: 5000
                name: "Nikola Soro"
            "Sale":
                speed: 5
                agility: 10
                leadership: 15
                price: 5000
                name: "Sale Milic"

        # tavern.getHeroes()

        for heroname, hero of heroes
            tr = $(template(hero))
            tr.data("hero", hero)
            $Table.append(tr)

        $Table.find("tr:gt(0)").each (k, v) ->
            $(v).click () ->
                $('tr').not(this).removeClass('tr-click-bg')
                $(@).toggleClass("tr-click-bg")

    # $CaravanTab.click () ->
    #     $Table.find("tr:gt(0)").remove()
    #     template = Handlebars.compile($tavern_caravan_row)
    #     tavern = $TavernDialog.data("tavern")
    #     for heroname, hero of tavern.getHeroes("caravan")
    #         html = $(template(hero))
    #         html.data("hero", hero)
    #         $Table.append(html)

    #     $Table.find("tr:gt(0)").each (k, v) ->
    #         $(v).click () ->
    #             $('tr').not(this).removeClass('tr-click-bg')
    #             $(@).toggleClass("tr-click-bg")
    #             log.debug $(@).data("hero")   

    # $TrainerTab.click () ->
    #     $Table.find("tr:gt(0)").remove()
    #     template = Handlebars.compile($tavern_trainer_row)
    #     tavern = $TavernDialog.data("tavern")
    #     for trainername, trainer of tavern.getHeroes("trainer")
    #         html = $(template(trainer))
    #         html.data("hero", trainer)
    #         $Table.append(html)

    #     $Table.find("tr:gt(0)").each (k, v) ->
    #         $(v).click () ->
    #             $('tr').not(this).removeClass('tr-click-bg')
    #             $(@).toggleClass("tr-click-bg")
    #             log.debug $(@).data("hero")   

    $EmployButton.click () ->
        selected_hero = $TavernDialog.find(".tr-click-bg")
        hero = $(selected_hero).data("hero")
        
        # amjad.city.wartent.buyHero(hero)

        # hero = selected_hero.data("hero")
        # tavern = $TavernDialog.data("tavern")
        # herot = amjad.empire.employHero(hero)
        # if herot?
        #     selected_hero.remove()
        #     tavern.removeHero(hero)
        #     if hero.type isnt "trainer"
        #         addHeroToBottomTopMenu(herot)
            

    Hal.on "OPEN_TAVERN_DIALOG", (tavern) ->
        $TavernDialog.data("tavern", tavern)
        $TavernDialog.fadeIn(200)
        $CommanderTab.click()
        
    addHeroToBottomTopMenu = (hero) ->
        template = Handlebars.compile($hero_bottom_top)
        html = $(template(hero))
        html.data("hero", hero)
        html.css("cursor", "pointer")
        html.click () ->
            hero = $(@).data("hero")
            if hero.meta.attr.type is "caravan"
                Hal.trigger "OPEN_CARAVAN_DIALOG", hero
            else if hero.meta.attr.type is "commander"
                Hal.trigger "OPEN_COMMANDER_DIALOG", hero
        html.hide()
        herolist = $(".bottom-top > .heroes")
        herolist.append(html)
        html.fadeIn()
