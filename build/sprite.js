(function(){define([],function(){var e;return e=function(){function e(e,t,n,r,i,s){var o;this.img=e,this.x=n,this.y=r,this.w=i,this.h=s,o=this.img.src.match(/\/assets\/sprites\/(.*\/)(.*)\.png/),this.name=o&&o[2]?o[2]:"",this.w2=this.w*.5,this.h2=this.h*.5,this.folder=o&&o[1]?o[1]:"",this.onLazyLoad=null}return e.prototype.changeSprite=function(e){this.img=e.img,this.name=e.name,this.x=e.x,this.y=e.y,this.w=e.w,this.h=e.h,this.folder=e.folder,this.w2=e.w2,this.h2=e.h2;if(this.onLazyLoad!=null)return this.onLazyLoad()},e.prototype.getName=function(){return this.folder+this.name},e}(),e})}).call(this);