(function(){var e={}.hasOwnProperty,t=function(t,n){function i(){this.constructor=t}for(var r in n)e.call(n,r)&&(t[r]=n[r]);return i.prototype=n.prototype,t.prototype=new i,t.__super__=n.prototype,t};define(["vec2"],function(e){var n,r,i,s,o,u,a,f;return n={polyBBoxFromSprite:function(e,t,n){return t==null&&(t=u),n==null&&(n=o),i(e,t,n)},rectBBoxFromSprite:function(e){return[-e.w*.5,-e.h*.5,e.w,e.h]},rectFromPolyShape:function(e){var t,n,r,i,s,o,u;r=Number.MAX_VALUE,i=Number.MAX_VALUE,t=-Number.MIN_VALUE,n=-Number.MIN_VALUE;for(o=0,u=e.length;o<u;o++)s=e[o],r=Math.min(s[0],r),i=Math.min(s[1],i),t=Math.max(s[0],t),n=Math.max(s[1],n);return[r,i,Math.abs(r)+t,Math.abs(i)+n]},circularBBoxFromSprite:function(e){var t;return t=Math.sqrt(e.w*e.w+e.h*e.h)*.5,[t]},rectIntersectsRect:function(e){return Hal.math.rectIntersectsRect(e,[this.pos[0],this.pos[1],this.bounds[2],this.bounds[3]])},rectIntersectsCircle:function(e){return Hal.math.rectIntersectsAndHullsCircle(e,this.pos,this.bounds[0])},rectBoundCheck:function(e){return Hal.math.isPointInRect(e,[this.pos[0],this.pos[1],this.bounds[2],this.bounds[3]])},circularBoundCheck:function(e){return Hal.math.isPointInCircle(e,this.pos,this.bounds[0])}},i=function(t,n,r){var i,s,o,u,a,f,l,c,h;c=[],h=t.w,f=t.h,i=Hal.dom.createCanvas(h,f),u=i.getContext("2d"),o=[],u.drawImage(t.img,0,0),l=u.getImageData(0,0,h,f),a=function(){var t,n,r,i,s,o,u,a,f,l,h,p,d,v,m,g;a=0,n=0,t=1/33;if(c.length<2)return void 0;for(l=m=0,g=c.length;m<g;l=++m){u=c[l],o=c[l+1];if(o==null)break;s=e.fromValues(u.x,u.y),h=e.fromValues(o.x,o.y),d=e.sub([],h,s);if(d!=null){p=c[l+2];if(p==null)break;v=e.sub([],h,e.fromValues(p.x,p.y))}if(d!=null&&v!=null){e.normalize(d,d),e.normalize(v,v),i=e.dot(d,v),a=n,n=e.dot(d,v),r=Math.abs(n-a);if(r>t)return f=[c[l+2].x-Hal.math.epsilon,c[l+2].y-Hal.math.epsilon],c.splice(0,l+2),f}}},c=new n(l.data,h,f);while(s=a())o.push(s);return log.debug("num criticals: "+o.length),new r(o)},s=function(){function e(e,t,n,r){return this.data=e!=null?e:[],this.width=t,this.height=n,this.sample_rate=r!=null?r:1,this.samplingFunc()}return e.prototype.samplingFunc=function(){return[]},e.prototype.getPixelAt=function(e,t){var n;return n=(e+this.width*t)*4,[this.data[n],this.data[n+1],this.data[n+2],this.data[n+3]]},e}(),u=function(e){function n(){return a=n.__super__.constructor.apply(this,arguments),a}return t(n,e),n.prototype.samplingFunc=function(){var e,t,n,r,i,s,o,u,a,f,l,c,h,p,d;e=130,i=[];for(t=s=0,f=this.width-1,l=this.sample_rate;l>0?s<=f:s>=f;t=s+=l)for(n=o=0,c=this.height;0<=c?o<=c:o>=c;n=0<=c?++o:--o){r=this.getPixelAt(t,n);if(r[3]>e){i.push({x:t,y:n});break}}for(t=u=0,h=this.width-1,p=this.sample_rate;p>0?u<=h:u>=h;t=u+=p)for(n=a=d=this.height;a>=0;n=a+=-1){r=this.getPixelAt(t,n);if(r[3]>e){i.unshift({x:t,y:n});break}}return i},n}(s),r=function(){function e(e){return this.downsamplingFunc(e)}return e.prototype.downsamplingFunc=function(){return[]},e}(),o=function(e){function n(){return f=n.__super__.constructor.apply(this,arguments),f}return t(n,e),n.prototype.downsamplingFunc=function(e){var t,n,r,i,s,o,u,a,f,l,c,h;r=3,l=e[0],n=e[e.length-1],o=0,s=0,u=[];if(e.length<2)return e;for(i=c=1,h=e.length-2;1<=h?c<=h:c>=h;i=1<=h?++c:--c)t=Hal.math.perpDistance(e[i],l,n),t>o&&(s=i,o=t);return o>r?(a=this.downsamplingFunc(e.slice(0,+s+1||9e9)),f=this.downsamplingFunc(e.slice(s,+(e.length-1)+1||9e9)),a=a.slice(0,a.length-1),u=a.concat(f)):(u.push(e[0]),u.push(e[e.length-1])),u},n}(r),n})}).call(this);