/*
 * blz模块声明
 */
;(function(fn){
	'use strict';
	/* jshint ignore:start */
	if (typeof define === 'function' && define.amd) {
	  define([],function () {
		return fn();
	  });
	} else if (typeof module !== 'undefined' && module.exports) {
	  module.exports = fn();
	}else{
		fn();
	}
	/* jshint ignore:end */
}(function(){
	'use strict';
	
	// music constructure
	function Music(){
		defineProperty(this);
	}
	
	// define property
	function defineProperty(context){
		Object.defineProperty(context,'src',{
			get:function(){
				return this.src||'';
			},
			set:function(src){
				var that=this;
				this.src=src;
				var xhr=new XMLHttpRequest();
				xhr.open('GET',src,true);
				xhr.responseType='arraybuffer';
				xhr.onload=function(){
					Music.musicContext.decodeAudioData(this.response,function(buffer){
						that.buffer=buffer;
						if(that.onload instanceof Function){
							that.onload();
						}
					},function(e){
						console.log(e);
					});
				};
				xhr.send(null);
			}
		});
	}
	
	// set the Music constructure's musicContext property's value
	Music.musicContext=new AudioContext();
	
	window.Music=Music;
}));