(function(){var e={}.hasOwnProperty,t=function(t,n){function i(){this.constructor=t}for(var r in n)e.call(n,r)&&(t[r]=n[r]);return i.prototype=n.prototype,t.prototype=new i,t.__super__=n.prototype,t},n=[].indexOf||function(e){for(var t=0,n=this.length;t<n;t++)if(t in this&&this[t]===e)return t;return-1};define(["deferred","deferredcounter","ajax","spritefactory","sprite","spritesheet","eventdispatcher"],function(e,r,i,s,o,u,a){var f,l,c,h;return c="/assets/",h="http://localhost:8080",l=/^(.*)\.(.*)$/,f=function(e){function n(){n.__super__.constructor.call(this),this.assets={sprites:{},spritesheets:{},audio:{},animation:{}},this.tint_cache={},this.wait_queue=[]}return t(n,e),n}(a),f.prototype.setResourcesRelativeURL=function(e){return c=e},f.prototype.resolvePath=function(e){var t,n,r,i,s,o,u;n=e.split("/");if(this.assets.hasOwnProperty(n[0])){i=this.assets[n[0]],u=n.slice(1,+(n.length-2)+1||9e9);for(s=0,o=u.length;s<o;s++)t=u[s],i.hasOwnProperty(t)||(i[t]={}),i=i[t]}return r=n[n.length-1],r=r.substring(0,r.lastIndexOf(".")),[i,r]},f.prototype.addToStorage=function(e,t){var n,r,i;return i=this.resolvePath(e),r=i[0],n=i[1],r[n]=t,r[n]},f.prototype.deleteFromStorage=function(e){var t,n,r;return r=this.resolvePath(e),n=r[0],t=r[1],n[t]=null,delete n[t]},f.prototype.loadImage=function(t){var n,r,i=this;return n=new e,r=new Image,r.src=t,r.onload=function(){return n.resolve(r,r)},r.onerror=function(){return n.reject(r,t)},n.promise()},f.prototype.loadImages=function(e){var t,n,i,s;t=new r(e.length);for(i=0,s=e.length;i<s;i++)n=e[i],this.loadImage(n).then(function(e){return t.release(this,e)}).fail(function(e){return t.acquire(this,e)});return t.promise()},f.prototype.tint=function(e,t){var n;return n=e.folder+e.name+t,this.tint_cache[n]||(this.tint_cache[n]=Hal.im.tintImage(e.img,t,.5)),this.tint_cache[n]},f.prototype.loadSprite=function(t){var n,r=this;return t=c+t,n=new e,this.loadImage(t).then(function(e){var i,o;return o=s.fromSingleImage(e,t),i=o.getName(),r.wait_queue[i]&&(log.debug(r.wait_queue[i]),r.wait_queue[i].changeSprite(o),delete r.wait_queue[t]),Hal.trigger("SPRITE_LOADED",o),n.resolve(r,o)}).fail(function(e){return n.reject(r,e)}),n.promise()},f.prototype.loadAudio=function(t){var n,r;return r=new e,n=new Audio(t)},f.prototype.loadSound=function(t){var n;return t=c+t,n=new e,this.loadAudio()},f.prototype.addSprite=function(e){var t=this;return this.loadSprite(e).then(function(n){return t.addToStorage(e,n)})},f.prototype.addSound=function(e){var t=this;return this.loadSound(e).then(function(n){return t.addToStorage(e,n)})},f.prototype.resolveFolderPath=function(e){var t,n,r,i,s,o,u;n=e.split("/");if(this.assets.hasOwnProperty(n[0])){i=this.assets[n[0]];if(n.length>3){u=n.slice(1,+(n.length-3)+1||9e9);for(s=0,o=u.length;s<o;s++)t=u[s],i.hasOwnProperty(t)||(i[t]={}),i=i[t]}}return r=n[n.length-2],[i,r]},f.prototype.loadViaSocketIO=function(){var e=this;if(typeof io=="undefined"||io===null){log.error("Couldn't find socket.io library");return}return this.socket=io.connect(h),this.socket.on("connect",function(){return log.debug("connected")}),this.socket.on("LOAD_SPRITES",function(t){var n,r,i,s,o,u,a;s=JSON.parse(t.files),i=s.length,e.trigger("SPRITES_LOADING",i),a=[];for(r=o=0,u=s.length;o<u;r=++o)n=s[r],a.push(function(n,r){return e.addSprite(t.url+n).then(function(){e.trigger("SPRITE_LOADED",n);if(r>=i-1)return e.trigger("SPRITES_LOADED")})}(n,r));return a}),this.socket.on("LOAD_SOUNDS",function(t){var n,r,i,s,o,u,a;s=JSON.parse(t.files),i=s.length,e.trigger("SOUNDS_LOADING",i),a=[];for(r=o=0,u=s.length;o<u;r=++o)n=s[r],a.push(function(n,r){return e.addSound(t.url+n).then(function(){e.trigger("SOUND_LOADED");if(r>=i-1)return e.trigger("SOUNDS_LOADED")})}(n,r));return a}),this.socket.on("SPRITE_ADDED",function(t){return log.debug("sprite added"),log.debug(t),e.addSprite(t.url)}),this.socket.on("SPRITESHEET_ADDED",function(e){return log.debug(e)}),this.socket.on("SPRITE_DELETED",function(t){return log.debug("sprite deleted"),log.debug(t),e.deleteFromStorage(t.url)}),this.socket.on("SPRITE_FOLDER_DELETED",function(t){var n,r,i;return log.debug("sprite folder deleted"),log.debug(t),i=e.resolveFolderPath(t.url),r=i[0],n=i[1],delete r[n],e.trigger("SPRITES_LOADED")}),this.socket.on("SPRITE_FOLDER_ADDED",function(t){var n,r,i,s,o,u,a;log.debug("sprite folder added"),log.debug(t),i=t.files.length,e.trigger("SPRITES_LOADING"),u=t.files,a=[];for(r=s=0,o=u.length;s<o;r=++s)n=u[r],log.debug("file: "+n),a.push(function(n,r){return log.debug(t.url+n),e.addSprite(t.url+n).then(function(){e.trigger("SPRITE_LOADED",n);if(r>=i-1)return e.trigger("SPRITES_LOADED")})}(n,r));return a}),this.socket.on("SPRITESHEET_DELETED",function(e){return log.debug(e)})},f.prototype.loadSpritesFromFileList=function(e){var t=this;return i.get(e,function(e){var n,r,i,s,o,u;e=e.split("\n"),e.splice(-1),r=e.length,t.trigger("SPRITES_LOADING",r),u=[];for(n=s=0,o=e.length;s<o;n=++s)i=e[n],u.push(function(e,n){return t.addSprite(e).then(function(){t.trigger("SPRITE_LOADED",e);if(n>=r-1)return t.trigger("SPRITES_LOADED")})}(i,n));return u})},f.prototype.loadFromArray=function(e,t){var r;r=!e,n.call(this.assets,r)>=0},f.prototype.getSprite=function(e){var t,n,r;return r=this.resolvePath("sprites/"+e+"."),n=r[0],t=r[1],n[t]},f.prototype.getSpritesFromFolder=function(e){var t,n,r,i,s,o,u,a;if(e==="/")return this.getSpriteFolders();t=e.indexOf("/"),t===0&&(e=e.substring(t+1)),t=e.charAt(e.length-1),t!=="/"&&(e=""+e+"/"),i={},u=this.resolveFolderPath("sprites/"+e),s=u[0],r=u[1],a=s[r];for(n in a)o=a[n],o.img!=null&&(i[n]=o);return i},f.prototype.getSpriteFoldersFromFolder=function(e){var t,n,r,i,s,o,u,a;t=e.indexOf("/"),t===0&&(e=e.substring(t+1)),t=e.charAt(e.length-1),t!=="/"&&(e=""+e+"/"),i={},u=this.resolveFolderPath("sprites/"+e),s=u[0],r=u[1],a=s[r];for(n in a)o=a[n],o.img==null&&(i[n]=o);return i},f.prototype.getSpriteFolders=function(){return this.assets.sprites},f.prototype.waitFor=function(e,t){return this.wait_queue[t]=e},f})}).call(this);