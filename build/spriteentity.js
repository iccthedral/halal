(function(){var e={}.hasOwnProperty,t=function(t,n){function i(){this.constructor=t}for(var r in n)e.call(n,r)&&(t[r]=n[r]);return i.prototype=n.prototype,t.prototype=new i,t.__super__=n.prototype,t};define(["entity","bboxalgos","spritefactory"],function(e,n,r){var i;return i=function(e){function i(e){var t=this;i.__super__.constructor.call(this,e),this.sprite=Hal.asm.getSprite(e.sprite),this.visible_sprite=e.visible_sprite!=null?e.visible_sprite:!0,this.h=e.height!=null?e.height:0,this.w=e.width!=null?e.width:0,this.sprite==null?(this.sprite=r.dummySprite(),Hal.asm.waitFor(this.sprite,e.sprite)):this.calcShapeAndBBox(),this.sprite.onLazyLoad=function(){return t.calcShapeAndBBox()}}return t(i,e),i.prototype.init=function(){return i.__super__.init.call(this)},i.prototype.inShapeBounds=function(e){return e=this.worldToLocal(this.scene.localToWorld(e)),Hal.math.isPointInRect(e,this.bbox)&&!Hal.im.isTransparent(this.sprite.img,e[0]+this.bbox[2]*.5,e[1]+this.bbox[3]*.5)?!0:!1},i.prototype.calcShapeAndBBox=function(){return this.attr("bbox",n.rectBBoxFromSprite(this.sprite))},i.prototype.draw=function(){i.__super__.draw.call(this);if(this.visible_sprite)return this.scene.g.drawSprite(this.sprite,this.w,this.h)},i}(e),i})}).call(this);