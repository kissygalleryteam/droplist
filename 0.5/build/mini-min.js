/*!build time : 2014-06-16 5:07:25 PM*/
KISSY.add("gallery/droplist/0.5/datalist",function(a){function b(){this._init.apply(this,arguments)}var c="__id",d="__index",e={dataSource:null};return a.augment(b,a.EventTarget,{_init:function(b){b=this.cfg=a.merge(e,b),this.cache={},this._dataMap={},this._initSelected=b.selected,this.mulSelect=b.mulSelect},getDataByValue:function(b){if(this.getDataSource()){var c;return a.each(this.getDataSource(),function(a){return a.value===b?(c=a,!1):void 0}),c}},getClientId:function(a){return a&&a[c]},getDataByText:function(b){if(this.getDataSource()){var c;return a.each(this.getDataSource(),function(a){return a.text===b?(c=a,!1):void 0}),c}},select:function(b){var c=b;a.isPlainObject(b)||void 0==b||(c=this._dataMap[b]),this._selectByData(c)},_selectByData:function(b){if(this.mulSelect){if(this.selected&&b&&a.inArray(b,this.selected))return}else if(this.selected&&b&&b.value===this.selected.value)return;this.fire("selected",{data:b})},saveData:function(a){this.mulSelect?(this.selected=this.selected||[],this.selected.push(a)):this.selected=a},delData:function(a){for(var b=0;b<this.selected.length;b++)if(this.selected[b].__id==a){this.selected.splice(b,1);break}},getSelectedData:function(){return this.selected||this._initSelected},setDataSource:function(a,b){this.cache[a]=b,this._list=b},getDataSource:function(a){return a=a||"",this.cache[a]},dataFactory:function(b){var e=this,f=e.getSelectedData(),g=[],h=this._dataMap;return e.selected=void 0,a.each(b,function(b,i){var j=a.guid();if(b[c]=j,b[d]=i,h[j]=b,g.push(b),e.cfg.mulSelect){if(f&&f.length)for(var k=0;k<f.length;k++)if(f[k]&&b.value==f[k].value){e.select(j);break}}else f&&b.value==f.value&&e.select(j)}),delete e._initSelected,g}}),b}),KISSY.add("gallery/droplist/0.5/viewscroll",function(a,b,c){function d(){this._init.apply(this,arguments)}var e=a.DOM,f=a.Event,g="",h={selectedCls:"selected",focusCls:"focus",prefixId:"dropmenu-",prefixCls:"dropmenu-",menuItem:'<li class="{prefixCls}item" id="{prefixId}item{__id}" data-id="{__id}">{text}</li>',empty:"\u641c\u7d22\u65e0\u7ed3\u679c"},i={format:function(a){return a}};return a.augment(d,a.EventTarget,{_init:function(c,d){var f=this,g=a.merge(i,d),j=new b({prefixCls:h.prefixCls});f.layer=j,f.elList=e.create("<ul></ul>"),f.datalist=c,f.format=g.format,f.mulSelect=g.mulSelect,j.on("afterRenderUI",function(){f._UIRender()}),this.on("hide",function(){f.focused=void 0})},_UIRender:function(){var b=this,c=b.layer,d=b.elList,e=c.get("el"),f=c.get("contentEl");f.append(d),b._bindList(),b.elWrap=e,b.elWrap.attr("id",h.prefixId+"wrap"+a.guid()),b.fire("UIRender")},emptyRender:function(a){this._list=[],e.html(this.elList,a||h.empty)},render:function(b){var d=this,f=d.lap,h=document.createDocumentFragment();return f&&f.stop(),d.lap?(a.later(function(){d.render(b)},20),!0):(e.html(d.elList,g),f=d.lap=c(b,{duration:30}),d._list=b,f.handle(function(a){var b=d._itemRender(a);b&&h.appendChild(b)}),f.batch(function(){e.append(h,d.elList)}),f.then(function(){e.append(h,d.elList),d.lap=null}),void f.start())},_itemRender:function(b){if(!b)return null;var c=this.format(a.clone(b)),d=a.substitute(h.menuItem,a.merge({prefixId:h.prefixId,prefixCls:h.prefixCls},c)),f=e.create(d),g=this.datalist.getSelectedData();return this.mulSelect?g&&a.inArray(b,g)&&this._selectByElement(f,b):g&&g.value===b.value&&this._selectByElement(f,b),f},_bindList:function(){var a=this,b=a.elList;f.on(b,"click",function(b){var c=b.target,d=h.prefixCls+"item";if(e.hasClass(c,d)||(c=e.parent(c,d)),c){b.stopPropagation();var f=e.attr(c,"data-id");a.fire("itemSelect",{id:f})}})},select:function(a){var b=this.getElement(a);b||(b=a=void 0),this._selectByElement(b,a),this.fire("select",{data:a})},_focus:function(b){var c=this.getElement(b);c||(c=b=void 0),this._setElementClass(c,this.focused,h.focusCls,!0),this.focused=b,this.scrollIntoView(b),this.mulSelect&&this.datalist.selected&&b&&a.inArray(b,this.datalist.selected)||this.fire("focus",{data:b})},_selectByElement:function(a,b){this._setElementClass(a,this.datalist.selected,h.selectedCls),this.focused=b},_setElementClass:function(a,b,c,d){if(b&&!this.mulSelect||d){var f=this.getElement(b);f&&e.removeClass(f,c)}a&&e.addClass(a,c)},focusNext:function(){function b(b){for(var e=d._list.length-b+1;e--;)if(!d.datalist.selected||!a.inArray(d._list[d._list.length-e],d.datalist.selected)){c=d._list[d._list.length-e];break}}var c,d=this,e=this.focused;if(e){var f=0;a.each(this._list,function(a,b){return a.value==e.value?(f=b,!1):void 0}),this.mulSelect?b(f+1):c=this._list[f+1]}else b(0);this._focus(c)},focusPrevious:function(){function b(b){for(b++;b--;)if(!d.datalist.selected||!a.inArray(d._list[b],d.datalist.selected)){c=d._list[b];break}}var c,d=this,e=this.focused;if(e){var f=0;a.each(this._list,function(a,b){return a.value==e.value?(f=b,!1):void 0}),this.mulSelect?b(f-1):c=this._list[f-1]}else b(this._list.length-1);this._focus(c)},selectFocused:function(){this.focused&&this.fire("itemSelect",{id:this.datalist.getClientId(this.focused)})},visible:function(a){var b=this.getVisible(),c=void 0===a?!b:a;b!==c&&(c?(this.layer.show(),this.fire("show")):(this.layer.hide(),this.fire("hide")))},destroy:function(){this.layer.destroy()},getVisible:function(){return this.layer.get("visible")},align:function(a){this.layer.set("align",a)},getElement:function(a){var b=this.datalist.getClientId(a);return b?e.get("#"+h.prefixId+"item"+b,this.elList):void 0},scrollIntoView:function(a){var b=this.getElement(a);e.scrollIntoView(b,this.elWrap)}}),d},{requires:["overlay","gallery/lap/0.1/index"]}),KISSY.add("gallery/droplist/0.5/droplist",function(a,b,c,d,e,f){function g(){this._init.apply(this,arguments)}var h="placeholder"in document.createElement("input"),i="",j=function(){},k={hideDelay:100,droplistCls:"",fieldName:"",inputName:"",ariaLabel:"",insertion:document.body,placeholder:"",freedom:!1,customData:void 0,autoMatch:!0,mulSelect:!1,fnDataAdapter:function(a){return a},fnReceive:function(a){return a}},l={wrap:['<div class="droplist {isMultiple} {droplistCls}"><div class="drop-trigger"><i class="caret"></i></div><div class="drop-wrap">',h?void 0:'<label class="drop-placeholder">{placeholder}</label>','<input class="drop-text" type="text" placeholder="{placeholder}" /></div><input class="drop-value" type="hidden" /></div>'].join(i),textCls:"drop-text",valueCls:"drop-value",triggerCls:"drop-trigger",placeholderCls:"drop-placeholder"},m=[9,13,16,17,18,20,27,33,34,35,36,37,38,39,40,45,91,93],n="aria-activedescendant",o={bind:function(a,c){var d=a._view,e=a.elText;b.attr(a.elWrap,{role:"combobox"}),b.attr(e,{role:"textbox"}),b.attr(e,{"aria-autocomplete":"list","aria-haspopup":"true","aria-label":c}),a.on("hide show",function(a){b.attr(e,"aria-expanded","show"===a.type)}),d.on("UIRender",function(){var a=d.elWrap;b.attr(e,{"aria-owns":a[0].id}),d.on("focus",function(b){var c=b.data,e=d.getElement(c);a.attr(n,e?e.id:i)})}),a.on("change",function(){b.attr(d.elWrap,n,i)})}};return a.augment(g,a.EventTarget,{_init:function(b){var c=a.merge(k,b);this.cfg=c,c.srcNode&&this._buildWrap(c.srcNode),this._data=new e({selected:c.selectedItem,mulSelect:c.mulSelect}),this._view=new f(this._data,{format:c.format,mulSelect:c.mulSelect}),this._bindControl(),this._timer={hide:null},this._matchMap={}},render:function(){function c(a){var b=d._dataFactory(a);g.setDataSource("",b)}var d=this,e=d.cfg,f=d.elWrap,g=d._data;if(f||(d._buildWrap(),f=d.elWrap,elTrigger=d.elTrigger),!b.parent(f)){var h=e.insertion;a.isFunction(h)?h(f):h.appendChild?h.appendChild(f):a.isString(h)&&(h=b.get(h),h&&h.appendChild&&h.appendChild(f)),e.mulSelect&&elTrigger&&b.remove(elTrigger)}this._bindElement(),o.bind(this,e.ariaLabel);var i=e.dataSource;a.isArray(i)?c(i):a.isString(i)?this._fetch({url:i},function(a){c(a)}):a.isPlainObject(i)?this._fetch(i,function(a){c(a)}):a.isFunction(i)&&i(function(a){c(a)})},doWith:function(a,b,c){var d=this,e=d._grepMethods(a,b,c);d._runWithMatch(e,a,d.getSelectedData())},_grepMethods:function(a,b,c){var d=this,e=d._matchMap[a];e||(e=d._matchMap[a]={match:[],mismatch:[]});var f=d._mergeMethods(e.match,b),g=d._mergeMethods(e.mismatch,c);return{match:f,mismatch:g}},_mergeMethods:function(b,c){var d=[];return a.each(a.makeArray(c),function(c){a.inArray(c,b)||(b.push(c),d.push(c))}),d},removeMatch:function(a){var b=this._matchMap[a];b&&(b.match.length=0,b.mismatch.length=0)},selectByValue:function(a){var b=this._data,c=b.getDataByValue(a);void 0!==a&&!c&&this.cfg.freedom&&(c=this.getCustomData()),b.select(c)},selectByData:function(a){var b=this._data,c=a?b.getDataByValue(a.value):void 0;void 0!==a&&!c&&this.cfg.freedom&&(c=a),b.select(c)},getSelectedData:function(){return this._data.getSelectedData()},getCustomData:function(){var a=this.cfg.customData||{},b={};return b.text=void 0!==a.text?a.text:this.elText.value,b.value=void 0!==a.value?a.value:b.text,b},hide:function(){var a=this._view;a&&a.visible(!1),this.fire("hide")},show:function(){var a=this._view,b=this.elWrap;a.align({node:b,points:["bl","tl"],offset:[0,0]}),a.visible(!0),this.fire("show")},destroy:function(){this.fire("destroy"),b.remove(this.elWrap),this._view.destroy(),this._view=null,this._data=null},_dataFactory:function(a){var b=this.cfg.fnDataAdapter(a);return this._data.dataFactory(b)},_bindControl:function(){var d=this,e=this._view,f=this._data;e.on("UIRender",function(){var a=e.elWrap;b.unselectable(a),c.on(a,"mousedown",function(a){a.preventDefault()})}),e.on("itemSelect",function(a){d._data.select(a.id)}),e.on("focus",function(a){d.cfg.mulSelect?d.elText.value=a.data?a.data.text:"":d._fillText(a.data||d.getSelectedData())}),f.on("selected",function(a){e.select(a.data),d._fillText(a.data),f.saveData(a.data),d.fire("change",{data:a.data,value:d.getValue()}),d.hide()}),d.on("change",function(b){var c=d._matchMap;a.each(c,function(a,c){d._runWithMatch(a,c,b.data)})})},_buildWrap:function(c){var d=this.cfg;if(c=b.get(c),!c){var e=a.substitute(l.wrap,{isMultiple:d.mulSelect?"droplist-multiple":"",droplistCls:d.droplistCls?d.droplistCls:"",placeholder:d.placeholder});c=b.create(e)}var f=b.get("."+l.triggerCls,c),g=b.get("."+l.textCls,c),h=b.get("."+l.valueCls,c),i=b.get("."+l.placeholderCls,c),j=d.fieldName,k=d.inputName||j+"-text";j&&(b.attr(h,"name",j),b.attr(g,"name",k)),this.elPlaceholder=i,this.elWrap=c,this.elValue=h,this.elText=g,this.elTrigger=f},_bindElement:function(){{var d=this,e=(this.cfg,this.elText),f=this.elValue;d._view,d._data}c.on(this.elTrigger,"click",function(){c.fire(e,"focus")}),b.unselectable(this.elTrigger),f&&d.on("change",function(){d.getSelectedData();f.value=d.getValue()});var g=this.elPlaceholder;!h&&c.on(e,"valuechange",function(){var c=b.val(e);""===a.trim(c)?b.show(g):b.hide(g)}),d._bindInput(e)},_bindInput:function(b){var d=this,e=this.elText,f=d.cfg,g=d._data,h=d._view;c.on(b,"click",function(){var a=d._view.getVisible();a||c.fire(e,"focus")}),c.on(b,"focus",function(){var a=d._view.getVisible();d._stopHideTimer(),a?d.hide():(h.render(g.getDataSource()),d.show())}),c.on(b,"blur",function(){var c,e=b.value;f.autoMatch&&(c=d._autoMatchByText(e),c&&d.getSelectedData()&&a.inArray(c,d.getSelectedData())&&(c=void 0)),!f.mulSelect&&void 0===c&&f.freedom&&e!==i&&(c=d.getCustomData()),c?d._data.select(c):(d._fillText(null),d.fire("change",{data:void 0,value:d.getValue()})),d._latencyHide()}),c.on(b,"keydown",function(a){var b=a.keyCode;return 9==b||27==b?void d.hide():38==b||40==b?(a.preventDefault(),d._view.getVisible()?void(40===b?h.focusNext():h.focusPrevious()):(h.render(g.getDataSource()),void d.show())):void(13==b&&(a.preventDefault(),h.selectFocused()))}),c.on(b,"keyup",function(c){function e(b){if(!f.mulSelect){var c=d.getSelectedData();g.selected=void 0,void 0!==c&&d.fire("change",{data:void 0,value:d.getValue()})}if(h.focused=void 0,0===b.length){var e="";a.isFunction(f.emptyFormat)?e=f.emptyFormat(j):a.isString(f.emptyFormat)&&(e=f.emptyFormat),h.emptyRender(e)}else h.render(b);d.show()}var i=c.keyCode;if(!(a.inArray(i,m)||i>=112&&123>=i)){var j=b.value;return j?void(f.remote?d._remoteFilter(j,e):d._syncFilter(j,e)):(h.render(g.getDataSource()),void d.show())}})},_fetch:function(b,c){var e=this,f=a.now();if(e._lastModify=f,!b.url)throw new Error("there is no data");var g=a.merge({type:"GET",dataType:"json",error:function(){alert("\u8bf7\u6c42\u6570\u636e\u53d1\u751f\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002")}},b),h=e.cfg.fnReceive,i=b.success||j;g.success=function(a){if(!(f<e._lastModify)){var b=h(a);b&&(i(b),b.result?c&&c(b.list):alert(b.msg))}},d(g)},_runWithMatch:function(b,c,d){d||(d={}),c==d.value?a.each(b.match,function(a){a&&a({data:d})}):a.each(b.mismatch,function(a){a&&a({data:d})})},_autoMatchByText:function(a){var b=this._data,c=b.getDataByText(a);return c},_fillText:function(a){{var b=this.elText;this.elPlaceholder}this.cfg.mulSelect?(a&&this._addChosen(a),b.value=i):b.value=a?a.text:i},_addChosen:function(c){var d=this.elText,e='<div class="search-choice"><span>{text}</span><a class="search-choice-close" data-id="{__id}"></a></div>',f=a.substitute(e,c);cOption=b.create(f),b.insertBefore(cOption,d),this._bindDelChosen(cOption),this._autoMatchInputWidth()},_bindDelChosen:function(a){var d=this,e=b.get("a",a);c.on(e,"click",function(c){c.preventDefault(),b.remove(a);var e=b.attr(this,"data-id");d._data.delData(e),d._autoMatchInputWidth(),d.fire("change",{data:void 0,value:d.getValue()})})},_autoMatchInputWidth:function(){var a=this.elText,c=b.siblings(a),d=b.width(b.parent(a)),e=0;if(c.length){for(var f=0;f<c.length;f++){var g=b.outerWidth(c[f])+parseInt(b.css(c[f],"marginLeft"))+parseInt(b.css(c[f],"marginRight"));e+=g,e>d&&(e=g)}b.css(a,"width",50>d-e-3?"100%":d-e-3),b.removeAttr(a,"placeholder"),!h&&b.hide(elPlaceholder)}else b.css(a,"width","100%"),b.attr(a,"placeholder",this.cfg.placeholder),!h&&b.show(elPlaceholder)},_remoteFilter:function(b,c){var d=this,e=d.cfg,f=e.remote||{};f.data=a.merge(f.data,{text:b});var g=f;d._fetch(g,function(a){var e=d._dataFactory(a);d._data.setDataSource(b,e),c&&c(e)})},_syncFilter:function(b,c){var d=this,e=d._data,f=[];a.each(e.getDataSource(),function(a){-1!==a.text.indexOf(b)&&f.push(a)}),c&&c(f)},_stopHideTimer:function(){var a=this._timer;a.hide&&(a.hide.cancel(),a.hide=null)},_latencyHide:function(){var b=this,c=b._timer;b._stopHideTimer(),c.hide=a.later(function(){b.hide()},b.cfg.hideDelay)},getValue:function(){var a=this.getSelectedData();if(this.cfg.mulSelect){var b=[];if(a&&a.length)for(var c=0;c<a.length;c++)b.push(a[c].value);return b.join(",")}return a?a.value:""}}),g},{requires:["dom","event","ajax","./datalist","./viewscroll"]}),KISSY.add("gallery/droplist/0.5/index",function(a,b,c,d){return d.decorate=function(c,e){var f=[],g=e&&e.attributes||{},h=e.mulSelect?[]:"";a.each(c.options,function(c){var d={text:c.text,value:c.value};a.each(g,function(a,e){d[e]=b.attr(c,a)}),f.push(d),"true"==b.attr(c,"data-default")&&(e.mulSelect?h.push(d):h=d)}),e.mulSelect?h.length||h.push(f[0]):h||(h=f[0]);var i=a.merge({selectedItem:h,placeholder:b.attr(c,"placeholder"),fieldName:b.attr(c,"name"),mulSelect:b.attr(c,"multiple")?!0:!1,dataSource:f,autoMatch:!0,insertion:function(a){try{b.replaceWith(c,a)}catch(d){b.insertBefore(a,c),b.remove(c)}}},e);return new d(i)},d.multiple=function(b){function c(){this.init()}if(b&&b.dataSource&&b.dataSource.length)return a.augment(c,a.EventTarget,{data:[],arrDoWith:[],init:function(){this.createDropList(b.dataSource)},doWith:function(a,b,c,d){this.data[a]&&this.data[a].doWith(b,c,d),this.arrDoWith[a]=arguments},fireChange:function(a){for(var b=this,c=[],d=0;d<a.length;d++)a[d]._data.selected&&c.push(a[d]._data.selected);b.fire("change",{data:c})},createDropList:function(c){var e=this,f=this.data,g=[];b.subConfig==b.subConfig||[],b.subConfig[f.length]=b.subConfig[f.length]||{};for(var h=a.merge({droplistCls:b.droplistCls,insertion:b.insertion,dataSource:g,freedom:b.freedom,mulSelect:b.mulSelect},b.subConfig[f.length]),i=h.mulSelect?[]:"",j=0;j<c.length;j++){var k={text:c[j][b.paramText],value:c[j][b.paramValue],dataSource:c[j][b.paramSubcat]||[]};g.push(k),!h.selectedItem&&c[j].isDefault&&(h.mulSelect?i.push(k):i=k)}h.selectedItem=h.selectedItem||i,droplist=new d(h),f.push(droplist),droplist.deep=f.length,e.arrDoWith[f.length-1]&&droplist.doWith(e.arrDoWith[f.length-1][1],e.arrDoWith[f.length-1][2],e.arrDoWith[f.length-1][3]),droplist.on("change",function(a){function c(){if(b.isShowSub&&b.subcatDeep)for(;b.subcatDeep-f.length;)e.createDropList([])}for(var d=a.currentTarget,g=d._data.selected;f.length>d.deep;)f.pop().destroy();if(!b.subcatDeep||f.length!=b.subcatDeep){if(d.cfg.mulSelect){var h=[];if(g&&g.length)for(var i=0;i<g.length;i++)g[i].dataSource.length&&(h=h.concat(g[i].dataSource));h.length&&e.createDropList(h),(!a.data||h.length)&&c()}else a.data&&a.data.dataSource&&a.data.dataSource.length&&e.createDropList(a.data.dataSource),(!a.data||a.data.dataSource.length)&&c();e.fireChange(f)}}),droplist.render(),b.isShowSub&&b.subcatDeep&&f.length<b.subcatDeep&&e.createDropList([])}}),new c},d},{requires:["dom","event","./droplist","./index.less.css"]}),KISSY.add("gallery/droplist/0.5/mini",function(a,b){return b},{requires:["./index"]});