(function(){define(["vec2"],function(e){var t,n;return t={MAT_ARRAY:typeof Float32Array!="undefined"?Float32Array:Array,epsilon:1e-6},t.createRegularon=function(e,t){var n,r,i,s,o,u,a,f;i=[],r=Math.PI*2/e,n=0;for(s=a=0,f=e-1;0<=f?a<=f:a>=f;s=0<=f?++a:--a)o=t*Math.cos(n),u=t*Math.sin(n),i.push([o,u]),n+=r;return i},t.clamp=function(e,t,n){return e<t&&(e=t),e>n&&(e=n),e},t.toDegrees=function(e){return e*180/Math.PI},t.isPointInRect=function(e,t){return e[0]>=t[0]&&e[0]<=t[0]+t[2]&&e[1]>=t[1]&&e[1]<=t[1]+t[3]},t.isRectInRect=function(e,t){return e[0]>=t[0]&&e[1]>=t[1]&&e[0]+e[2]<=t[0]+t[2]&&e[1]+e[3]<=t[1]+t[3]},t.rectIntersectsRect=function(e,t){return e[0]<t[0]+t[2]&&e[0]+e[2]>t[0]&&e[1]<t[1]+t[3]&&e[3]+e[1]>t[1]},t.createRectPolygon=function(e,t,n,r){return[[e,t],[e+n,t],[e+n,t+r],[e,t+r]]},t.doLinesIntersect=function(e,t,n,r){var i,s,o,u,a,f;return u=(e[1]-n[1])*(r[0]-n[0])-(e[0]-n[0])*(r[1]-n[1]),f=(e[1]-n[1])*(t[0]-e[0])-(e[0]-n[0])*(t[1]-e[1]),i=(t[0]-e[0])*(r[1]-n[1])-(t[1]-e[1])*(r[0]-n[0]),i===0?!1:(s=1/i,o=u*s,a=f*s,o>0&&o<1&&a>0&&a<1?!0:!1)},t.isPointInPoly=function(e,t){var n,r,i,s,o,u,a;n=[-1e4,e[1]],r=e,i=0,o=t.length;for(s=u=0,a=o-1;0<=a?u<=a:u>=a;s=0<=a?++u:--u)this.doLinesIntersect(n,r,t[s],t[(s+1)%o])&&i++;return i%2!==0},t.projectPointOnLine=function(t,n,r){var i,s,o,u,a;return o=e.sub([],r,n),u=e.sub([],t,n),e.normalize(o,o),e.normalize(u,u),i=e.dot(u,o),s=e.distance(n,t),a=e.scale([],o,i*s),a=e.fromValues(n[0]+a[0],n[1]+a[1]),a},t.rectIntersectsCircle=function(e,t,n){return this.lineIntersectsCircle([[e[0],e[1]],[e[0]+e[2],e[1]]],t,n)||this.lineIntersectsCircle([[e[0]+e[2],e[1]],[e[0]+e[2],e[1]+e[3]]],t,n)||this.lineIntersectsCircle([[e[0]+e[2],e[1]+e[3]],[e[0],e[1]+e[3]]],t,n)||this.lineIntersectsCircle([[e[0],e[1]+e[3]],[e[0],e[1]]],t,n)},t.rectIntersectsOrHullsCircle=function(e,t,n){return this.rectIntersectsCircle(e,t,n)||this.isPointInRect(t,e)},t.lineIntersectsCircle=function(e,t,n){var r;return r=this.perpDistanceToSegment(t,e[0],e[1]),r<n},t.perpDistance=function(t,n,r){var i;return i=this.projectPointOnLine(t,n,r),e.distance(t,i)},t.perpDistanceToSegment=function(t,n,r){var i,s;return i=this.projectPointOnLine(t,n,r),s=e.distance(n,r),e.distance(n,i)>s||e.distance(r,i)>s?Number.NaN:e.distance(t,i)},t.isPointInCircle=function(e,t,n){var r,i,s;return i=e[0]-t[0],s=e[1]-t[1],r=Math.sqrt(i*i+s*s),r<n},n=function(e,t,n){var r,i,s;return e[0]>=0&&t[0]<0?!0:e[0]===0&&t[0]===0?e[1]>t[1]:(s=(e[0]-n[0])*(t[1]-n[1])-(t[0]-n[0])*(e[1]-n[1]),s<0?!0:s>0?!1:(r=(e[0]-n[0])*(e[0]-n[0])+(e[1]-n[1])*(e[1]-n[1]),i=(t[0]-n[0])*(t[0]-n[0])+(t[1]-n[1])*(t[1]-n[1]),r>i))},t})}).call(this);