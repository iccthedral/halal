(function(){var e=[].slice;define([],function(){var t,n;return n=function(){function e(){this.successChain=[],this.failChain=[]}return e.prototype.then=function(e){return this.successChain.push(e),this},e.prototype.fail=function(e){return this.failChain.push(e),this},e}(),t=function(){function t(e){this.prom=new n}return t.prototype.resolve=function(){var t,n;return n=arguments[0],t=2<=arguments.length?e.call(arguments,1):[],this.traverse_chain("successChain",n,t)},t.prototype.reject=function(){var t,n;return n=arguments[0],t=2<=arguments.length?e.call(arguments,1):[],this.traverse_chain("failChain",n,t)},t.prototype.promise=function(){return this.prom},t.prototype.traverse_chain=function(e,t,n){var r,i,s,o,u;t==null&&(t=this),o=this.prom[e],u=[];for(i=0,s=o.length;i<s;i++)r=o[i],u.push(r.apply(t,n));return u},t}(),window.Deferred=t,t})}).call(this);