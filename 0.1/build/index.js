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
    var D = S.DOM, E = S.Event,
        EMPTY = "",
        UNIQUEKEY = "_id",
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
            var self = this;
//            // 如果还没有数据，则异步获取数据。
//            if(!this._list) {
//                this.fetch(undefined, function() {
//                    self.filter(data, callback);
//                });
//                return;
//            }

            var result = [];
//                partial = cfg.partial;

            // 筛选出符合的元素
            S.each(self._list, function(it) {
                var yep = false;
                S.each(data, function(val, key) {
                    if(val === it[key]) {
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
//        getSelected: function() {
//            return this.selected;
//        },
//        setSelected: function(selected) {
//            this.selected = S.makeArray(selected);
//        },
//        setSelectedById: function(id) {
//            var self = this,
//                result = [];
//            S.each(S.makeArray(id), function(i) {
//                result.push(self._dataMap[i]);
//            });
//
//            self.setSelected(result);
//        },
        select: function(id) {
            var data;
            if(id != undefined) {
                data = this._dataMap[id];
            }

            var prevData = this.selected;
            // 同一个选项，就不需要再次处理了。
            if(prevData && data.value === prevData.value) {
                return;
            }

            this.selected = data;
            this.fire('selected', {data: data});
        },
        focus: function(id) {
            var data;
            if(id != undefined) {
                data = this._dataMap[id];
            }

            this.focused = data;
            this.fire('focus', {data: data});
        },
        _getIndex: function(id) {
            var data = this._dataMap[id];

            return data[QUEUEINDEX];
        },
        nextSibling: function(id) {
            var idx = this._getIndex(id);

            return this._list[idx + 1];
        },
        previousSibling: function(id) {
            var idx = this._getIndex(id);

            return this._list[idx - 1];
        },
        // 根据新数据，重新构造数据。
        _dataFactory: function(list) {
            var self = this,
                prevSelected = self.selected || self._initSelected,
                result = [],
                map = this._dataMap = {};

            self.focused = self.selected = undefined;

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
                    self.focus(_id);
                }
            });

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
                this._selectElement(el);
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

                var _id = D.attr(target, 'data-id');
                self.fire('itemClick', {id: _id})
            });
        },
        /**
         * @public 根据clientId 选择指定的元素。若不存在，则取消选择
         * @param id
         */
        select: function(id) {
            var elItem = D.get('#' + TEMPLATES.prefixId+id, this.elList);

            this._selectElement(elItem);
        },
        _selectElement: function(elItem) {
            D.removeClass(this.selectedItem, TEMPLATES.selectedCls);
            D.addClass(elItem, TEMPLATES.selectedCls);
            this.selectedItem = elItem;
        },
        /**
         * @public 根据clientId 聚焦指定的元素。若不存在，则取消聚焦
         * @param id
         */
        focus: function(id) {
            var elItem = D.get('#' + TEMPLATES.prefixId+id, this.elList);

            D.removeClass(this.focusItem, TEMPLATES.focusCls);
            D.addClass(elItem, TEMPLATES.focusCls);
            this.focusItem = elItem;
        },
        /**
         * @public 显示和隐藏
         * @param isVisible
         */
        visible: function(isVisible) {
            if(isVisible) {
                this.layer.show();
            }else {
                this.layer.hide();
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

/**
 * combobox
 * TODO 搜索结果列表键盘操作的问题
 * 目前只支持枚举不可输入，需要支持枚举可输入。
 */
KISSY.add('gallery/droplist/0.1/droplist',function (S, D, E, DataList, View) {
    var EMPTY = '',
        def = {
            hideDelay: 100,
            placeholder: "placeholder",
            fnAppend: function(el) {
                document.body.appendChild(el);
            }
        },

    TEMPLATES = {
        wrap: '<div class="dropmenu">' +
            '<div class="drop-trigger"></div>' +
            '<input class="drop-text" type="text" value="{text}" />' +
        '</div>',
        textCls: "drop-text",
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

        this.init.apply(this, arguments);
    }
    S.augment(DropList, S.EventTarget, /** @lends DropList.prototype*/{
        init: function(config) {
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
            if(!this.elWrap) {
                this._buildWrap();
            }

            var cfg = this.cfg,
                datalist = this._data;

            if(!D.parent(this.elWrap)) {
                var fnAppend = cfg.fnAppend;

                S.isFunction(fnAppend) && fnAppend(this.elWrap);
            }

            this._bindElement();

            // render时才做初始化数据处理。
            if(S.isArray(cfg.dataSource)) {
                datalist.dataFactory(cfg.dataSource);
            }else if(S.isString(cfg.dataSource)) {
                this.fetch(cfg.dataSource, function(data) {
                    datalist.dataFactory(data);
                });
            }
        },
        fetch: function(url, callback) {
            var self = this,
                lastModify = S.now();

            self._lastModify = lastModify;

            S.io({
                url: url,
                type: "GET",
                dataType: "json",
                data: {
                },
                success: function(data) {
                    // 若数据过期了，则抛弃之
                    if(lastModify < self._lastModify) {
                        return;
                    }

                    if(!data.result) {
                        alert(data.msg);
                        return;
                    }

                    callback && callback(data.list);
                }
            });
        },
        _bindElement: function() {
            var self = this,
                elText = this.elText,
                view = self._view,
                datalist = self._data;

            self.on('toggle', function() {
                self._stopHideTimer();
                self._keepFocus();
                if(self.isVisible) {
                    self.hide();
                }else {
                    view.render(datalist._list);
                    self.show();
                }
            });

            E.on([this.elTrigger, elText], 'click', function(ev) {
                self.fire('toggle');
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
            });

            view.on('itemClick', function(ev) {
                var _id = ev.id;

                self._select(_id);
            });

            datalist.on('selected', function(ev) {
                var data = ev.data;
                view.select(data && data._id);
                datalist.focus(data && data._id);

                self.fire('change', {data: datalist.selected});
            });

            datalist.on('focus', function(ev) {
                var data = ev.data;
                view.focus(data && data._id);

                // 将当前聚焦项填充到输入框中
                if(data) {
                    self._fillText(data);
                }else {
                    self._fillText(datalist.selected);
                }
            });
        },
        _keepFocus: function() {
            E.fire(this.elText, 'focus');
        },
        _select: function(id) {
            var datalist = this._data;
            datalist.select(id);

            var data = datalist.selected;

            this._fillText(data);
        },
        selectByValue: function(value) {
            var data = this.getDataByValue(value);
            this._select(data._id);
        },
        getDataByValue: function(value) {
            return this._data.getDataByValue(value);
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
                var selected = datalist.selected;
                self._select(selected && selected._id);
                self._latencyHide();
            });

            // keydown时检测操作
            E.on(elInput, 'keydown', function(ev) {
                var keyCode = ev.keyCode;

                // esc & tab
                if(keyCode == 9 || keyCode == 27) {
                    var selected = datalist.selected;
                    self._select(selected && selected._id);
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

                    var current = datalist.focused,
                        direction_down = keyCode === 40,
                        newFocus;

                    if(current) {
                        newFocus = direction_down ? datalist.nextSibling(current._id) : datalist.previousSibling(current._id);
                    }else {
                        newFocus = datalist._list[direction_down ? 0 : datalist._list.length -1];
                    }

                    datalist.focus(newFocus && newFocus._id);
                    return;
                }

                // 回车操作
                if(keyCode == 13) {
                    var focus = datalist.focused;
                    self._select(focus && focus._id);
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
                    if(view.render(list) === false) {
                        self.hide();
                    }else{
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
                var datalist = this._data,
                    selected = datalist.selected || datalist._initSelected,
                    html = S.substitute(TEMPLATES.wrap, {text: selected && selected.text});
                elWrap = D.create(html);
            }

            var elTrigger = D.get('.' + TEMPLATES.triggerCls, elWrap),
                elText = D.get('.' + TEMPLATES.textCls, elWrap);

            this.elWrap = elWrap;
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
 - remote data
 - different view
*/

/*
ChangeLog
 0.2
   - 一次性远程获取数据或本地数据进行列表渲染。
   - 支持键盘的操作。方向键聚焦选项，回车键选择，esc关闭列表。
   - 支持可输入和不可输入（输入目前代表的是搜索功能）。
   - 从select节点渲染模拟combo box
 */




/**
 * @fileoverview 
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/

KISSY.add('gallery/droplist/0.1/index',function (S, D, E, DropList) {
    var EMPTY = '';

    DropList.decorate = function(el, cfg) {
        var data = [],
            drop;

        S.each(el.options, function(elOption) {
            data.push({
                text: elOption.text,
                value: elOption.value
            });
        });

        var selected = el.options[el.selectedIndex];

        drop = new DropList({
            selectedItem: {
                value: selected.value,
                text: selected.text
            },
            dataSource: data,
            fnAppend: function(elWrap) {
                D.replaceWith(el, elWrap);
            }
        });

        return drop;
    };

    return DropList;

}, {requires:['dom', 'event', './droplist']});




