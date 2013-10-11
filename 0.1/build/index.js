/*
combined files : 

gallery/droplist/0.1/datalist
gallery/droplist/0.1/lap
gallery/droplist/0.1/viewscroll
gallery/droplist/0.1/droplist
gallery/droplist/0.1/index

*/
/**
 * 默认，单页scroll式的数据。
 * 初次异步获取数据，或直接使用数据源或每次都异步获取数据。
 */

KISSY.add('gallery/droplist/0.1/datalist',function(S) {
    var UNIQUEKEY = "_id",
        QUEUEINDEX = '_index',

        def = {
            dataSource: null
        };

    function DataList() {
        this._init.apply(this, arguments);
    }

    S.augment(DataList, S.EventTarget, {
        _init: function(cfg) {

            cfg = this.cfg = S.merge(def, cfg);

            this._initSelected = cfg.selected;
        },
        dataFactory: function(list) {
            this._dataFactory(list);
        },
        getDataByValue: function(value) {
            if(!this._list) {
                return;
            }

            var result;
            S.each(this._list, function(it) {
                if(it.value === value) {
                    result = it;
                    return false;
                }
            });
            return result;
        },
        filter: function(data, callback) {
            var self = this,
                result = [];

            // 筛选出符合的元素
            S.each(self._list, function(it) {
                var yep = false;
                S.each(data, function(val, key) {
                    if(it[key].indexOf(val) !== -1) {
                        yep = true;
                        return false;
                    }
                });

                if(yep) {
                    result.push(it);
                }
            });

            // 异步回调处理。
            callback && callback(result);
        },
        select: function(id) {
            var data;
            if(id != undefined) {
                data = this._dataMap[id];
            }

            var prevData = this.selected;
            // 同一个选项，就不需要再次处理了。
            if(prevData == data ||
                prevData && data && data.value === prevData.value) {
                return;
            }

            this.selected = data;
            this.fire('selected', {data: data});
        },
        getSelectedData: function() {
            return this.selected || this._initSelected;
        },
        // 根据新数据，重新构造数据。
        _dataFactory: function(list) {
            var self = this,
                prevSelected = self.getSelectedData(),
                result = [],
                map = this._dataMap = {};

            self.selected = undefined;

            S.each(list, function(it, idx) {
                var _id = S.guid();
                if(it[UNIQUEKEY] === undefined) {
                    it[UNIQUEKEY] = _id;
                }

                it[QUEUEINDEX] = idx;
                map[_id] = it;
                result.push(it);

                // 匹配新数据中的选择项
                // 模拟原生select，只以value值为准即可。
                if(prevSelected && it.value == prevSelected.value) {
                    self.select(_id);
                }
            });

            delete self._initSelected;

            this._list = result;
        }
    });

    return DataList;
});
/**
 * Large Array Processor (LAP)
 * @author ake<ake.wgk@taobao.com | wgk1987@gmail.com>
 */
KISSY.add('gallery/droplist/0.1/lap',function(S) {

    function invoke() {
        var args = S.makeArray(arguments);
        S.each(args.shift(), function(fn) {
            fn.apply(null, args);
        });
    }

//    var timer = null,
//        runningLap = null,
      var defConfig = {
            duration: 300,
            delay: 50
        },
        lapQueue = [];

    function Process(data, config) {
        var self = this,
            cfg = S.merge(defConfig, config);

        self.handleData = [].concat(data);
        self.cfg = cfg;
        self.doIndex = -1;
        self.fnHandlers = [];
        self.fnBatches = [];
        self.fnCallbacks = [];
        self.duration = cfg.duration || 300;
        self.delay = cfg.delay || 30;
        self.isPause = false;
        self.isStop = false;
    }

    S.augment(Process, S.EventTarget, {
        // 每一项数据的处理函数
        handle: function(handler) {
            this.fnHandlers.push(handler);
        },
        // 每一批数据的处理函数
        batch: function(handler) {
            this.fnBatches.push(handler);
        },
        // 所有数据都处理完成以后要执行的回调
        then: function(callback) {
            this.fnCallbacks.push(callback);
        },
        start: function() {
            var self = this;
            if(self.isStop) {
                throw new Error("the task has complete.");
            }
            self.isPause = false;
            setTimeout(function() {
                self._process();
            }, 0);
        },
        process: function() {
            // 避免直接进入while操作，导致锁定线程。
            S.later(this._process, 0);
        },
        pause: function() {
            this.isPause = true;
        },
        stop: function() {
            if(!this.isStop) {
                this._stop();
            }
        },
        _stop: function() {
            this.isStop = true;
            invoke(this.fnCallbacks);
        },
        // 分批处理 主体函数
        // 在指定的时间范围内循环处理数据，
        // 如果处理时间超过，则在一定的间隔之后继续处理余下的数据。
        _process: function() {
            var self = this,
                handleData = self.handleData,
                fnHandlers = self.fnHandlers;
            if(self.isStop || (self.isPause && handleData.length > 0)) return;

            var end = +new Date + self.duration,
                localIndex = -1;
            // 至少执行一次，避免duration设置的太小，无法执行函数。。
            do{
                var _data = handleData.shift();
                if(_data === undefined) continue;

                self.doIndex ++;
                localIndex ++;

                invoke(fnHandlers, _data, self.doIndex, localIndex);
            } while(handleData.length > 0 && end > +new Date && !self.isPause && !self.isStop);

            invoke(self.fnBatches, self.doIndex/*, batchIndex*/);

            if (handleData.length == 0 && !self.isStop) {
                self._stop();
            } else{
                setTimeout(function() {
                    self._process();
                }, self.delay);
            }
        }
    });

    return function(data, cfg) {
        var lap = new Process(data, cfg);
        lapQueue.push(lap);

        return lap;
    }
});
/**
 * 单页 scroll式的浮层。没有分页，没有分组。
 */

KISSY.add('gallery/droplist/0.1/viewscroll',function(S, Overlay, Template, Lap) {
    var D = S.DOM, E = S.Event;

    var EMPTY = "",
        TEMPLATES = {
            selectedCls: "selected",
            focusCls: "focus",
            itemCls: "drop-menuitem",
            prefixId: "dropmenu-item",
            menuItem: '<li class="drop-menuitem" id="dropmenu-item{{_id}}" data-id="{{_id}}">{{text}}</li>'
        };

    function View() {
        this.init.apply(this, arguments);
    }

    S.augment(View, S.EventTarget, {
        init: function(datalist) {
            var self = this,
                layer = new Overlay({
                    prefixCls: "dropmenu-"
                });

            self.layer = layer;
            self.elList = D.create('<ul></ul>')
            self.datalist = datalist;

            layer.on('afterRenderUI', function() {
                self._UIRender();
            });

            this.on('hide', function() {
                self.focused = undefined;
            })
        },
        /**
         * @public 渲染指定的数据
         * TODO 完善+限定高度的渲染。
         * @param list
         * @return boolean 若返回值为false，则列表元素隐藏。其他情况下显示
         */
        render: function(list) {
            if(!list || list.length == 0) {
                return false;
            }

            var self = this,
                lap = self.lap,
                fragment = document.createDocumentFragment();

            lap && lap.stop();

            // self.lap变量在这里指向的对象可能在lap.stop()方法执行后被改变了。
            // 而变量lap还是指向原有的lap对象的，所以这里应该以self.lap来做判断。
            if(self.lap) {
                S.later(function() {
                    self.render(list);
                }, 20);
                return true;
            }

            D.html(self.elList, EMPTY);

            lap = self.lap = Lap(list, {duration: 30});
            self._list = list;

            // 每一条记录的事件响应
            lap.handle(function(item, globalIndex) {
                var elItem = self._itemRender(item);
                elItem && fragment.appendChild(elItem);
            });

            // 每一批次数据的事件响应
            lap.batch(function() {
                D.append(fragment, self.elList);
            });

            // 数据完成以后的事件响应。
            lap.then(function() {
                D.append(fragment, self.elList);

                self.lap = null;
            });

            lap.start();

            return true;
        },
        _itemRender: function(data) {
            if(!data) return null;
            var html = Template(TEMPLATES.menuItem).render(data),
                el = D.create(html),
                selected = this.datalist.selected;

            if(selected && selected.value === data.value) {
                this._selectByElement(el, data);
            }

            return el;
        },
        _UIRender: function() {
            var self = this,
                layer = self.layer,
                elList = self.elList;

            var elWrap = layer.get('el'),
                elContent = layer.get('contentEl');

            elContent.append(elList);

            self._bindList();

            /**
             * @public 在渲染列表容器的时候触发。droplist对象用来进行焦点控制。
             * @requires this.elWrap this.fire('UIRender');
             */
            self.elWrap = elWrap;
            self.fire('UIRender');
        },
        _bindList: function() {
            var self = this,
                elList = self.elList;

            E.on(elList, 'click', function(ev) {
                var target = ev.target;
                if(!D.hasClass(target, TEMPLATES.itemCls)) {
                    target = D.parent(target, TEMPLATES.itemCls);
                }

                if(!target) return;
                ev.stopPropagation();

                var _id = D.attr(target, 'data-id');
                self.fire('itemSelect', {id: _id})
            });
        },
        /**
         * @public 根据data._id获取元素，选择指定的元素。若不存在，则取消选择
         * @param data
         */
        select: function(data) {
            var id = data ? data._id : false,
                elItem = (id !== false) && D.get('#' + TEMPLATES.prefixId + id, this.elList);
            if(!elItem) {
                elItem = data = undefined;
            }

            this._selectByElement(elItem, data);

            this.fire('select', {data: data});
        },
        _selectByElement: function(elItem, data) {
            this._setElementClass(elItem, this.selected, TEMPLATES.selectedCls);

            this.selected = data;
            this.focused = data;
        },
        /**
         * @public 根据clientId 聚焦指定的元素。若不存在，则取消聚焦
         * @param id
         */
        _focus: function(data) {
            var id = data ? data._id : false,
                elItem = (id !== false) && D.get('#' + TEMPLATES.prefixId+id, this.elList);

            // TODO 列表未渲染出来时如何处理？
            if(!elItem) {
                elItem = data = undefined;
            }

            this._setElementClass(elItem, this.focused, TEMPLATES.focusCls);

            this.focused = data;
            this.fire('focus', {data: data});
        },
        _setElementClass: function(el, data, cls) {
            if(data) {
                var elItem = D.get('#' + TEMPLATES.prefixId + data._id, this.elList);
                elItem && D.removeClass(elItem, cls);
            }
            el && D.addClass(el, cls);
        },
        focusNext: function() {
            var focused = this.focused,
                newFocus;
            if(focused) {
                var index = 0;
                S.each(this._list, function(item, idx) {
                    if(item.value == focused.value) {
                        index = idx;
                        return false;
                    }
                });
                newFocus = this._list[index + 1];
            }else {
                newFocus = this._list[0];
            }

            this._focus(newFocus);
        },
        focusPrevious: function() {
            var focused = this.focused,
                newFocus;
            if(focused) {
                var index = 0;
                S.each(this._list, function(item, idx) {
                    if(item.value == focused.value) {
                        index = idx;
                        return false;
                    }
                });
                newFocus = this._list[index - 1];
            }else {
                newFocus = this._list[this._list.length - 1];
            }

            this._focus(newFocus);
        },
        selectFocused: function() {
            // 通过事件触发，而不是直接调用view的方法触发。
            // 因为对整个组件来说，选择操作除了表现层的改变，还有datalist数据层的处理。
            // 若focus为空的时候，并不等于取消选择。保持选择即可。
            if(this.focused) {
                this.fire('itemSelect', {id: this.focused._id});
            }
        },
        emptyRender: function() {
            this.visible(false);
        },
        /**
         * @public 显示和隐藏
         * @param isVisible
         */
        visible: function(isVisible) {
            if(isVisible) {
                this.layer.show();
                this.fire('show');
            }else {
                this.layer.hide();
                this.fire('hide');
            }
        },
        /**
         * @public 浮层的定位。按照overlay的align定义。
         * @param align
         */
        align: function(align) {
            this.layer.set('align', align);
        },
        /**
         * TODO 指定项显示在当前可视视图内
         */
        scrollIntoView: function() {

        }
    });

    return View;
}, {
    requires: ['overlay', 'template', './lap']
});
/**
 * @fileoverview
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/
KISSY.add('gallery/droplist/0.1/droplist',function (S, D, E, DataList, View) {
    var EMPTY = '',
        def = {
            hideDelay: 100,
            placeholder: "placeholder",
            fieldName: "",
            // droplist容器的append处理逻辑
            insertion: document.body,
            fnDataAdapter: function(data) {
                return data;
            },
            fnReceive: function(data) {
                return data;
            }
        },

    TEMPLATES = {
        wrap: '<div class="droplist">' +
            '<div class="drop-trigger"><i class="caret"></i></div>' +
            '<input class="drop-text" type="text" name="{name}-text" />' +
            '<input class="drop-value" type="hidden" name="{name}" />' +
        '</div>',
        textCls: "drop-text",
        valueCls: "drop-value",
        triggerCls: "drop-trigger"
    },

    // no operation key code
    opKeyCode = [
        9, // tab
        13,// enter
        16,// shift
        17,// ctrl
        18,// alt
        20,// caps lock
        27,// esc
        33,// page up
        34,// page down
        35,// end
        36,// home
        37,// left arrow
        38,// up arrow
        39,// right arrow
        40,// down arrow
        45,// insert
        91,// left window/command key
        93 // right window/command key
    ];

    /**
     *
     * @class DropList
     * @constructor
     * @extends Base
     */
    function DropList() {
//        var self = this;
        //调用父类构造函数
//        DropList.superclass.constructor.apply(self, comConfig);

        this._init.apply(this, arguments);
    }
    S.augment(DropList, S.EventTarget, /** @lends DropList.prototype*/{
        _init: function(config) {
            var cfg = S.merge(def, config);

            if(cfg.srcNode) {
                this._buildWrap(cfg.srcNode);
            }

            this.cfg = cfg;
            this._data = new DataList({
                selected: cfg.selectedItem
            });
            this._view = new View(this._data);

            this._bindControl();

            this.isVisible = false;

            this.timer = {
                search: null,
                hide: null
            };
        },
        render: function() {
            var self = this,
                cfg = self.cfg,
                elWrap = self.elWrap;

            if(!elWrap) {
                self._buildWrap();
                elWrap = self.elWrap;
            }

            if(!D.parent(elWrap)) {
                var insertion = cfg.insertion;

                if(S.isFunction(insertion)) {

                    insertion(elWrap);
                }else if(insertion.appendChild){

                    insertion.appendChild(elWrap);
                }else if(S.isString(insertion)) {

                    insertion = D.get(insertion);
                    if(insertion && insertion.appendChild) {
                        insertion.appendChild(elWrap);
                    }
                }
            }

            this._bindElement();

            // render时才做初始化数据处理。
            var ds = cfg.dataSource;

            if(S.isArray(ds)) {

                self.dataFactory(ds);


            }else if(S.isString(ds)) {

                this._fetch({
                    url: ds
                }, function(data) {
                    self.dataFactory(data);
                });


            }else if(S.isPlainObject(ds)) {
                this._fetch(ds, function(data) {
                    self.dataFactory(data);
                });


            }else if(S.isFunction(ds)) {

                ds(function(data) {
                    self.dataFactory(data);
                });

            }
        },
        dataFactory: function(data) {
            var dt = this.cfg.fnDataAdapter(data);
            this._data.dataFactory(dt);
        },
        _fetch: function(param, callback) {
            var self = this,
                lastModify = S.now();

            self._lastModify = lastModify;

            if(!param.url) {
                throw new Error("there is no data");
            }

            var ajaxParam = S.merge({
                    type: "GET",
                    dataType: "json",
                    error: function() {
                        alert("请求数据发生错误，请稍后重试。");
                    }
                }, param),
                fnSuccess = param.success || self.cfg.fnReceive;

            ajaxParam.success = function(data) {
                var returnValue = fnSuccess(data);

                if(returnValue.result) {
                    callback && callback(returnValue.list);
                }
            }

            S.io(ajaxParam);
        },
        _bindElement: function() {
            var self = this,
                elText = this.elText,
                elValue = this.elValue,
                view = self._view,
                datalist = self._data;

            self.on('toggle', function() {
                var isVisible = self.isVisible;
                // focus会触发事件：若列表是隐藏的，则会显示出来。
                self._keepFocus();
                // 若当前已经显示的情况下，需要隐藏一下。
                if(isVisible) {
                    self.hide();
                }
            });

            E.on([this.elTrigger], 'click', function(ev) {
                self.fire('toggle');
            });

            E.on(elText, 'focus', function() {
                self._stopHideTimer();
                if(!self.isVisible) {
                    view.render(datalist._list);
                    self.show();
                }
            });

            elValue && self.on('change', function(ev) {
                var data = ev.data,
                    value = data ? data.value : "";

                elValue.value = value;
            });

            self._bindInput(elText);
        },
        _bindControl: function() {
            var self = this,
                view = this._view,
                datalist = this._data;

            view.on('UIRender', function(ev) {
                var elWrap = view.elWrap;
                E.on(elWrap, 'click', function() {
                    self._stopHideTimer();
                    self._keepFocus();
                });

                S.UA.chrome && E.on(elWrap, 'scroll', function(ev) {
                    self._stopHideTimer();
                    try{
                        self._keepFocus();
                    }catch(ex) {}
                });
            });

            // 列表的鼠标点击操作和键盘回车选择操作是从view对象中触发的。
            view.on('itemSelect', function(ev) {
                var _id = ev.id;

                self._data.select(_id);
            });

            view.on('focus', function(ev) {
                var data = ev.data;

                // 将当前聚焦项填充到输入框中
                if(data) {
                    self._fillText(data);
                }else {
                    // 没有聚焦项时，显示选择项即可。
                    self._fillText(datalist.selected);
                }
            });

            // 初始化的选择是从datalist中触发的。
            datalist.on('selected', function(ev) {
                var data = ev.data;

                // 所以要联动view层的操作
                view.select(data);

                self._fillText(data);

                self.fire('change', {data: data});
                // 选择操作完成以后，默认关闭浮层。
                self.hide();
            });
        },
        _keepFocus: function() {
            E.fire(this.elText, 'focus');
        },
        // 程序调用的选择操作，是从droplist对象中触发的。
        selectByValue: function(value) {
            var data = this.getDataByValue(value);
            this._data.select(data && data._id);
        },
        getDataByValue: function(value) {
            return this._data.getDataByValue(value);
        },
        getSelectedData: function() {
            return this._data.getSelectedData();
        },
        _fillText: function(data) {
            var elText = this.elText,
                text = data ? data.text : EMPTY;

            elText.value = text;
        },
        hide: function() {
            this._view.visible(this.isVisible = false);
        },
        show: function() {
            var view = this._view,
                elText = this.elText;

            view.align({
                node: elText,
                points: ['bl','tl'],
                offset: [0, 0]
            });
            view.visible(this.isVisible = true);
        },
        _bindInput: function(elInput) {
            var self = this,
                datalist = self._data,
                view = self._view;

            E.on(elInput, 'blur', function() {
                self._fillText(datalist.selected);
                self._latencyHide();
            });

            // keydown时检测操作
            E.on(elInput, 'keydown', function(ev) {
                var keyCode = ev.keyCode;

                // esc & tab
                if(keyCode == 9 || keyCode == 27) {
                    self._fillText(datalist.selected);
                    self.hide();
                    return;
                }

                // 上下键操作
                if(keyCode == 38 || keyCode == 40) {
                    ev.preventDefault();

                    if(!self.isVisible) {
                        view.render(datalist._list);
                        self.show();
                        return;
                    }

                    if(keyCode === 40) {
                        view.focusNext();
                    }else {
                        view.focusPrevious();
                    }
                    return;
                }

                // 回车操作
                if(keyCode == 13) {
                    view.selectFocused();
                    return;
                }
            });

            // keyup 进行搜索和输入操作
            E.on(elInput, 'keyup', function(ev) {
                var keyCode = ev.keyCode;
                // 空操作，如home/end等键的响应。
                if(S.inArray(keyCode, opKeyCode)
                    || keyCode >= 112 && keyCode <= 123) {
                    return;
                }

                // 其他有效输入

                // 如果值为空，则显示完整的列表
                var kw = elInput.value;
                if(!kw) {
                    view.render(datalist._list);
                    self.show();
                    return;
                }

                datalist.filter({
                    text: kw
                }, function(list) {
                    // 如果进行搜索，则表示当前选择项失效。
                    // 直接设置数据为空即可。若通过select方法来取消选择，会联动数据回填，导致输入框的内容不符合预期。
                    var prevData = datalist.selected;
                    datalist.selected = view.focused = undefined;
                    // 但是若数据变化了，还是需要触发外部事件，便于响应处理
                    if(prevData !== undefined) {
                        self.fire('change', {data: undefined});
                    }

                    if(list.length === 0) {
                        view.emptyRender();
                    }else {
                        view.render(list);
                        self.show();
                    }
                });
            });
        },
        _stopHideTimer: function() {
            var timer = this.timer;
            // 确定取消计时器的运行
            if(timer.hide) {
                timer.hide.cancel();
                timer.hide = null;
            }
        },
        _latencyHide: function() {
            var self = this,
                timer = self.timer;
            self._stopHideTimer();

            timer.hide  = S.later(function() {
                self.hide();
            }, self.cfg.hideDelay);
        },
        _buildWrap: function(elWrap) {
            elWrap = D.get(elWrap);
            if(!elWrap) {
                var html = S.substitute(TEMPLATES.wrap, {
                        name: this.cfg.fieldName || ""
                    });
                elWrap = D.create(html);
            }

            var elTrigger = D.get('.' + TEMPLATES.triggerCls, elWrap),
                elText = D.get('.' + TEMPLATES.textCls, elWrap),
                elValue = D.get('.' + TEMPLATES.valueCls, elWrap);

            this.elWrap = elWrap;
            this.elValue = elValue;
            this.elText = elText;
            this.elTrigger = elTrigger;
        }
    });

    return DropList;

}, {requires:['dom', 'event', './datalist', './viewscroll']});

/*
 ToDo
 - ARIA
 - input placeholder
 - selection range
 - different view
 - custom template
 - 目前只支持枚举不可输入，需要支持枚举可输入。
 - remote data?
*/

/*
ChangeLog
 0.1
   - 一次性远程获取数据或本地数据进行列表渲染。
   - 支持键盘的操作。方向键聚焦选项，回车键选择，esc关闭列表。
   - 支持可输入和不可输入（输入目前代表的是搜索功能）。
   - 支持多种渲染方式
     - 从符合条件的结构渲染
     - 从select节点渲染模拟select
     - 脚本动态渲染
   - 支持数据定制。(fnDataAdapter/fnReceive)
 */




/**
 * @fileoverview 
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/

KISSY.add('gallery/droplist/0.1/index',function (S, D, E, DropList) {

    DropList.decorate = function(el, config) {
        var data = [];

        S.each(el.options, function(elOption) {
            data.push({
                text: elOption.text,
                value: elOption.value
            });
        });

        var selected = el.options[el.selectedIndex],
            cfg = S.merge({
                selectedItem: {
                    value: selected.value,
                    text: selected.text
                },
                fieldName: D.attr(el, 'name'),
                dataSource: data,
                insertion: function(elWrap) {
                    D.replaceWith(el, elWrap);
                }
            }, config);

        return new DropList(cfg);
    };

    return DropList;

}, {requires:['dom', 'event', './droplist']});




