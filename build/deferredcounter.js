(function(){var e={}.hasOwnProperty,t=function(t,n){function i(){this.constructor=t}for(var r in n)e.call(n,r)&&(t[r]=n[r]);return i.prototype=n.prototype,t.prototype=new i,t.__super__=n.prototype,t},n=[].slice;define(["deferred"],function(e){var r;return r=function(e){function r(e){this.total_trigs=e,this.num_approved=0,this.num_rejected=0,r.__super__.constructor.call(this)}return t(r,e),r.prototype.resolve=function(e,t){if(this.num_approved+this.num_rejected===this.total_trigs)return r.__super__.resolve.call(this,e,{num_approved:this.num_approved,num_rejected:this.num_rejected},t)},r.prototype.reject=function(e,t){r.__super__.reject.call(this,e,{num_approved:this.num_approved,num_rejected:this.num_rejected},t);if(this.num_approved+this.num_rejected===this.total_trigs)return this.resolve(e,t)},r.prototype.acquire=function(){var e,t;return t=arguments[0],e=2<=arguments.length?n.call(arguments,1):[],this.num_rejected++,this.reject(t,e)},r.prototype.release=function(){var e,t;return t=arguments[0],e=2<=arguments.length?n.call(arguments,1):[],this.num_approved++,this.resolve(t,e)},r}(e),r})}).call(this);