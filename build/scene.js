(function(){var e={}.hasOwnProperty,t=function(t,n){function i(){this.constructor=t}for(var r in n)e.call(n,r)&&(t[r]=n[r]);return i.prototype=n.prototype,t.prototype=new i,t.__super__=n.prototype,t};define(["halalentity","renderer","camera","matrix3","quadtree","vec2"],function(e,n,r,i,s,o){var u;return u=function(e){function u(e){e==null&&(e={}),u.__super__.constructor.call(this),this.name=e.name!=null?e.name:""+Hal.ID(),this.bounds=e.bounds!=null?e.bounds:Hal.viewportBounds(),this.paused=!0,this.bg_color=e.bg_color!=null?e.bg_color:"white",this.entities=[],this.identity_matrix=i.create(),this.update_clip=!1,this.mpos=[0,0],this.viewport_pos=[0,0],this.world_pos=[0,0],this.quadspace=null,this.ent_cache={},this.draw_camera_center=e.draw_camera_center!=null?e.draw_camera_center:!1,this.draw_stat=e.draw_stat!=null?e.draw_stat:!0,this.draw_quadspace=e.draw_quadspace!=null?e.draw_quadspace:!1,this.local_matrix=i.create(),this.z=e.z!=null?e.z:1,this.g=new n(this.bounds,null,this.z),this.cam_bounds=e.cam_bounds!=null?e.cam_bounds:this.bounds.slice(),log.debug(this.cam_bounds),this.resetQuadSpace([0,0,this.cam_bounds[2],this.cam_bounds[3]])}return t(u,e),u.prototype.resetQuadSpace=function(e){return log.debug("QuadSpace reset"),this.quadspace=null,this.quadspace=new s(e),this.quadspace.divide()},u.prototype.addCamera=function(){return this.camera=new r(this.g.ctx,this.cam_bounds,this),this.camera.enableDrag(),this.camera.enableLerp(),this.camera.enableZoom()},u.prototype.addEntityToQuadspace=function(e){return e=this.addEntity(e),this.quadspace.insert(e),e},u.prototype.addEntity=function(e){return this.entities.push(e),this.ent_cache[e.id]=e,e.attr("parent",this),e.attr("scene",this),e.attr("needs_updating",!0),e.trigger("ENTITY_ADDED"),e},u.prototype.rotationMatrix=function(){return[Math.cos(this.camera.angle),-Math.sin(this.camera.angle),this.camera.cx,Math.sin(this.camera.angle),Math.cos(this.camera.angle),this.camera.cy,0,0,1]},u.prototype.localMatrix=function(){return[this.camera.zoom,0,this.camera.zoom*(this.camera.x-this.camera.cx),0,this.camera.zoom,this.camera.zoom*(this.camera.y-this.camera.cy),0,0,1]},u.prototype.worldToLocal=function(e){return o.transformMat3([],e,i.transpose([],i.invert([],this.local_matrix)))},u.prototype.localToWorld=function(e){var t;return t=i.transpose(i.create(),this.local_matrix),o.transformMat3([],e,t)},u.prototype.destroy=function(){return this.removeAllEntities(),this.camera.remove("CHANGE",this.cam_change),Hal.remove("EXIT_FRAME",this.exit_frame),Hal.remove("ENTER_FRAME",this.enter_frame),Hal.remove("LEFT_CLICK",this.click_listeners),Hal.remove("LEFT_DBL_CLICK",this.click_listeners),Hal.remove("RESIZE",this.resize_event),Hal.trigger("DESTROY_SCENE",this),this.quadspace=null,this.camera=null,this.renderer=null,this.removeAll()},u.prototype.drawStat=function(){if(this.paused)return;return this.g.ctx.setTransform(1,0,0,1,0,0),this.g.ctx.font="10pt monospace",this.g.ctx.fillStyle="black",this.g.ctx.fillText("FPS: "+Hal.fps,0,10),this.g.ctx.fillText("Num of entities: "+this.entities.length,0,25),this.g.ctx.fillText("Zoom: "+this.camera.zoom,0,40),this.g.ctx.fillText("Mouse: "+this.mpos[0]+", "+this.mpos[1],0,55),this.g.ctx.fillText("Camera pos: "+this.camera.x+", "+this.camera.y,0,70),this.g.ctx.fillText("World pos: "+this.world_pos[0]+", "+this.world_pos[1],0,85),this.g.ctx.fillText("Center relative pos: "+(this.mpos[0]-this.camera.cx-this.bounds[0])+", "+(this.mpos[1]-this.camera.cy-this.bounds[1]),0,100)},u.prototype.removeEntity=function(e){var t;if(!this.ent_cache[e.id]){log.error("No such entity "+e.id+" in cache");return}t=this.entities.indexOf(e);if(t===-1){log.error("No such entity "+e.id+" in entity list");return}return delete this.ent_cache[e.id],this.trigger("ENTITY_DESTROYED",e),this.entities.splice(t,1)},u.prototype.getAllEntities=function(){return this.entities.slice()},u.prototype.removeAllEntities=function(){var e,t,n,r;r=this.getAllEntities();for(t=0,n=r.length;t<n;t++)e=r[t],e.destroy(!1)},u.prototype.removeEntityByID=function(e){var t;return t=this.ent_cache[e],t!=null?t.removeEntity(t):log.error("No such entity "+e+" in entity cache")},u.prototype.update=function(){},u.prototype.draw=function(){if(this.paused)return;return this.g.ctx.fillStyle=this.bg_color,this.g.ctx.fillRect(0,0,this.bounds[2],this.bounds[3])},u.prototype.drawQuadSpace=function(e){if(this.paused)return;e.nw!=null&&(this.drawQuadSpace(e.nw),this.g.ctx.strokeRect(e.nw.bounds[0],e.nw.bounds[1],e.nw.bounds[2],e.nw.bounds[3])),e.ne!=null&&(this.drawQuadSpace(e.ne),this.g.ctx.strokeRect(e.ne.bounds[0],e.ne.bounds[1],e.ne.bounds[2],e.ne.bounds[3])),e.sw!=null&&(this.drawQuadSpace(e.sw),this.g.ctx.strokeRect(e.sw.bounds[0],e.sw.bounds[1],e.sw.bounds[2],e.sw.bounds[3]));if(e.se!=null)return this.drawQuadSpace(e.se),this.g.ctx.strokeRect(e.se.bounds[0],e.se.bounds[1],e.se.bounds[2],e.se.bounds[3])},u.prototype.calcLocalMatrix=function(){return this.local_matrix=i.mul(this.localMatrix(),this.rotationMatrix())},u.prototype.pause=function(){return this.attr("paused",!0)},u.prototype.resume=function(){return this.attr("paused",!1)},u.prototype.init=function(){var e=this;return this.paused=!1,this.addCamera(),this.calcLocalMatrix(),this.on("CHANGE",function(e){e&&e[0]==="draw_quadspace"}),this.cam_change=this.camera.on("CHANGE",function(){if(e.paused)return;return e.calcLocalMatrix(),e.update_clip=!0}),this.resize_event=Hal.on("RESIZE",function(t){return e.g.resize(t.width,t.height),e.bounds[2]=t.width,e.bounds[3]=t.height,e.camera.resize(t.width,t.height)}),this.exit_frame=Hal.on("EXIT_FRAME",function(){if(e.paused)return;e.draw_camera_center&&(e.g.ctx.setTransform(1,0,0,1,0,0),e.g.ctx.translate(e.camera.cx,e.camera.cy),e.g.strokeRect([-3,-3,6,6],"white"),e.g.ctx.lineWidth=5,e.g.strokeRect([-e.camera.w2,-e.camera.h2,e.camera.w,e.camera.h],"white"),e.g.ctx.translate(-e.camera.cx,-e.camera.cy),e.g.ctx.lineWidth=1);if(e.draw_stat)return e.drawStat()}),this.on("ENTITY_MOVING",function(e){return Hal.math.isPointInRect(e.viewportPos(),e.quadspace.bounds)||(log.debug("i'm out of my quadspace "+e.id),e.quadspace.remove(e),this.quadspace.insert(e)),this.camera.trigger("CHANGE"),this.calcLocalMatrix()})},u}(e),u})}).call(this);