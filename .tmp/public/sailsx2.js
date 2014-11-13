/***********
 * Push Model state 
 ***********/
(function(name){
modelAction = {};

function registrySocketIO(url,modelName,xIO,action){
	modelName = modelName.toLowerCase();
	modelAction[modelName] = action;
	function registryAction(){
		if(typeof action !=='undefined' && action!= null){
			xIOSocket.request('/'+modelName, {}, function (users) {
			  xIOSocket.on(modelName, function(resp){
			  	var data = xIO.clone(resp.data);
				if(modelAction[modelName].hasOwnProperty(resp.verb)){
					modelAction[modelName][resp.verb](data);
				}else
				if(modelAction[modelName].hasOwnProperty('message')){
					modelAction[modelName]['message'](data);
				}
			  });
			});
		}
	}

	if(typeof xIOSocket == 'undefined'){
		xIOSocket = io.connect(url);
		xIOSocket.on('connect',function(e){
			registryAction();
		});		
	}
	else {
		registryAction();
	}
}

var ModelPrototype = function(info) {
	var my = this;
	my.createdAt = '';
	my.updatedAt = '';
	my.info = typeof info != 'undefined' ? info: {};
	var rtnObj = {
		info:function(i){
			if(i){
				my.info = JSON.parse(JSON.stringify(i));
				return my.info;
			}
			else{
				return my.info;
			}
		},
		set:function(property,val){
			my.info[property] = val;
		},
		get:function(property){
			return my.info[property];
		}
	};
	return rtnObj;
};

function xIO(url,action){
	if(url.indexOf('http://')!=0){
		url = "http://"+ url;
	}
	if(url.lastIndexOf(':')==4){
		var urlArray = url.split('/');
		urlArray[2] += ":80";
		url = urlArray.toString().replace(/,/g,'/');
	}
	var pos = url.lastIndexOf('/');
	var modelName = url.substring(pos+1);
	modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1).toLowerCase();
	url = url.substr(0,pos);
	registrySocketIO(url,modelName,this,action);
	window[modelName] = ModelPrototype;
	var my = this;
	my.modelName = modelName;
	my.url = url+'/'+modelName;
	my.post = function(cmd,model,callback){
		$.post(my.url,model.info()).always(function(resp){
			var rtnModel = my.clone(resp,model);
			if(typeof callback === "function"){
				callback(rtnModel);
			}
		});
	};
	my.clone = function(resp,m){
		var model = typeof m !== 'undefined' ? m:new window[my.modelName]();
		var info = model.info(resp);
		for(var key in info){
			model[key] = info[key];
		}
		return model;
	};
	return {
		create:function(model,callback){
			my.post('create',model,callback);
		},
		find:function(model,callback){
			var id =  typeof model=='string' || typeof model=='number'
				? ''+model:model.info().id;
			$.post(my.url+'/'+id).always(function(resp){
				if(typeof callback === "function"){
					callback(my.clone(resp));
				}
			});
		},
		update:function(model,callback){
			var id = model.info().id;
			$.post(my.url+'/update/'+id,model.info()).always(function(resp){
				if(typeof callback === "function"){
					callback(my.clone(resp,model));
				}
			});
		},
		list:function(callback){
			$.get(my.url+'?limit=0').always(function(resp){
				var modelList = [];
				$.each(resp,function(idx,obj){
					modelList.push(my.clone(obj));
				});
				if(typeof callback === "function"){
					callback(modelList);	
				}
			});
		},
		each:function(callback,finallyCallback){
			$.get(my.url+'?limit=0').always(function(resp){
				$.each(resp,function(idx,obj){
					if(typeof callback === "function"){
						callback(my.clone(obj));
					}
				});
				if(typeof finallyCallback === "function"){
					finallyCallback();
				}
			});
		},
		delete:function(model,callback){
			this.destroy(model,callback);
		},
		destroy:function(model,callback){
			var id =  typeof model=='string' || typeof model=='number'
				? ''+model:model.info().id;
			$.get(my.url+'/destroy/'+id).always(function(resp){
				var clone = my.clone(resp);
				if(typeof callback === "function"){
					callback(clone);
				}
			});
		}
	};
}
window[name] = xIO;
})('x2');