/**
 * @fileoverview
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/

/**
 * 选择操作的执行路径
 * A: view.event.itemSelect
 * B: datalist.select()
 * C: droplist.event.change
 * D: droplist.elInput.event.blur (autoMatch = false)
 * E: droplist.elInput.event.keyup (输入内容/搜索)
 * F: droplist.elInput.event.keydown (回车选择)
 * G: view.elWrap.event.click (鼠标选择)
 * H: droplist.elInput.event.blur (autoMatch = true)
 *
 * 1. G -> A -> B -> C
 * 2. D -> C
 * 3. E -> C
 * 4. F -> A -> B -> C
 * 5. H -> B -> C
 */
KISSY.add(function (S, D, E, IO, DataList, View) {

    var supportPlaceholder = "placeholder" in document.createElement("input");

    var EMPTY = '',
        fnNoop = function() {},
        def = {
            hideDelay: 100,
            fieldName: "",
            inputName: "",
            ariaLabel: "",
            // droplist容器的append处理逻辑
            insertion: document.body,
            placeholder: "",
            freedom: false,
            // 若非undefined，则直接用customValue作为自定义内容的value值。
            // 若是undefined，则用当前输入框的值作为自定义内容的value
            // freedom配置为true时有效。
            customValue: undefined,
            autoMatch: false,
//            emptyFormat: function(query) {return "没有搜索结果"},
            // format: function(data) {return data;},
            fnDataAdapter: function(data) {
                return data;
            },
            fnReceive: function(data) {
                return data;
            }
        },

    TEMPLATES = {
        wrap: ['<div class="droplist">' +
            '<div class="drop-trigger"><i class="caret"></i></div>' +
            '<div class="drop-wrap">',
            supportPlaceholder ? undefined : '<label class="drop-placeholder">{placeholder}</label>',
            '<input class="drop-text" type="text" placeholder="{placeholder}" />' +
            '</div>' +
            '<input class="drop-value" type="hidden" />' +
        '</div>'].join(EMPTY),
        textCls: "drop-text",
        valueCls: "drop-value",
        triggerCls: "drop-trigger",
        placeholderCls: 'drop-placeholder'
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

    var ACTIVEDESCENDANT = 'aria-activedescendant',
    ARIA = {
        bind: function(instance, label) {
            var listbox = instance._view,
                elInput = instance.elText;

            D.attr(instance.elWrap, {
                "role": 'combobox'
            });
            D.attr(elInput, {
                "role": "textbox"
            });
            D.attr(elInput, {
                "aria-autocomplete": "list",
                "aria-haspopup": "true",
                "aria-label": label
            });

            instance.on('hide show', function(ev) {
                D.attr(elInput, 'aria-expanded', ev.type === 'show');
            });

            listbox.on('UIRender', function(ev) {
                var elWrap = listbox.elWrap;
                D.attr(elInput, {
                    "aria-owns": elWrap[0].id
                });

                listbox.on('focus', function(ev) {
                    var data = ev.data,
                        el = listbox.getElement(data);

                    elWrap.attr(ACTIVEDESCENDANT, el ? el.id : EMPTY);
                });
            });

            instance.on('change', function() {
                D.attr(listbox.elWrap, ACTIVEDESCENDANT, EMPTY);
            });
        }
    };

    /**
     *
     * @class DropList
     * @constructor
     * @extends Base
     */
    function DropList() {

        this._init.apply(this, arguments);
    }
    S.augment(DropList, S.EventTarget, /** @lends DropList.prototype*/{
        _init: function(config) {
            var cfg = S.merge(def, config);
            this.cfg = cfg;

            if(cfg.srcNode) {
                this._buildWrap(cfg.srcNode);
            }

            this._data = new DataList({
                selected: cfg.selectedItem
            });
            this._view = new View(this._data, {
                format: cfg.format
            });

            this._bindControl();

            this._timer = {
                hide: null
            };

            this._matchMap = {}
        },
        // 渲染结构以及事件绑定等等
        render: function() {
            var self = this,
                cfg = self.cfg,
                elWrap = self.elWrap,
                datalist = self._data;

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

            // 在数据初始化之前绑定
            ARIA.bind(this, cfg.ariaLabel);

            // render时才做初始化数据处理。
            var ds = cfg.dataSource;

            function setDataSource(data) {
                // 预处理数据
                var dt = self._dataFactory(data);
                // 缓存数据
                datalist.setDataSource("", dt);
            }

            if(S.isArray(ds)) {

                setDataSource(ds)

            }else if(S.isString(ds)) {

                this._fetch({
                    url: ds
                }, function(data) {

                    setDataSource(data);
                });

            }else if(S.isPlainObject(ds)) {

                this._fetch(ds, function(data) {

                    setDataSource(data);
                });

            }else if(S.isFunction(ds)) {

                ds(function(data) {

                    setDataSource(data);
                });

            }
        },
        /**
         * 设置匹配到一个值或不匹配时对应的处理函数。
         * @param value <String> 用来匹配的值
         * @param fnMatch <Function> 若当前选择项的值与参数value一致，则执行该函数。
         * @param fnMismatch <Function> 若当前选择项的值与参数value不一致，则执行该函数。
         */
        doWith: function(value, fnMatch, fnMismatch, cfg) {
            var self = this,
                map = self._matchMap[value];

            if(!map) {
                map = self._matchMap[value] = {
                    match: [],
                    mismatch: []
                }
            }

            map.match.push(fnMatch);
            map.mismatch.push(fnMismatch);
            map.setting = cfg;

            // 设置的时候，根据当前选择的项立即执行一次。
            self._runWithMatch(map, value, self.getSelectedData());
        },
        // 程序调用的选择操作，是从droplist对象中触发的。
        selectByValue: function(value) {
            var datalist = this._data;
            var data = datalist.getDataByValue(value);
            this._data.select(data);
        },
        getSelectedData: function() {
            return this._data.getSelectedData();
        },
        hide: function() {
            this._view.visible(false);
            this.fire("hide");
        },
        show: function() {
            var view = this._view,
                elWrap = this.elWrap;

            view.align({
                node: elWrap,
                points: ['bl','tl'],
                offset: [0, 0]
            });
            view.visible(true);

            this.fire("show");
        },
        destroy: function() {

            D.remove(this.elWrap);
            this._data = null;
            this._view = null;

            this.fire("destroy");
        },
        _dataFactory: function(data) {
            var dt = this.cfg.fnDataAdapter(data);
            return this._data.dataFactory(dt);
        },
        _bindControl: function() {
            var self = this,
                view = this._view,
                datalist = this._data;

            view.on('UIRender', function(ev) {
                var elWrap = view.elWrap;

                // 设置列表浮层不可选择。使得点击操作不会获取焦点。
                D.unselectable(elWrap);
                // chrome和firefox下，还需要阻止掉mousedown默认事件。
                E.on(elWrap, 'mousedown', function(ev) {
                    ev.preventDefault();
                });
            });

            // 列表的鼠标点击操作和键盘回车选择操作是从view对象中触发的。
            view.on('itemSelect', function(ev) {
                var _id = ev.id;

                self._data.select(_id);
            });

            // 键盘聚焦项操作
            view.on('focus', function(ev) {
                var data = ev.data;

                // 将当前聚焦项填充到输入框中
                if(data) {
                    self._fillText(data);
                }else {
                    // 没有聚焦项时，显示选择项即可。
                    self._fillText(self.getSelectedData());
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

            // doWith注册的逻辑处理
            self.on('change', function(ev) {
                var data = ev.data;

                var map = self._matchMap;

                S.each(map, function(d, v) {
                    self._runWithMatch(d, v, data);
                });

            });
        },
        _buildWrap: function(elWrap) {
            var cfg = this.cfg;
            elWrap = D.get(elWrap);

            if(!elWrap) {
                var html = S.substitute(TEMPLATES.wrap, {
                    placeholder: cfg.placeholder
                });
                elWrap = D.create(html);
            }

            var elTrigger = D.get('.' + TEMPLATES.triggerCls, elWrap),
                elText = D.get('.' + TEMPLATES.textCls, elWrap),
                elValue = D.get('.' + TEMPLATES.valueCls, elWrap),
                elPlaceholder = D.get('.' + TEMPLATES.placeholderCls, elWrap),
                fieldName = cfg.fieldName,
                inputName = cfg.inputName;

            // 设置value表单域的name值
            if(fieldName) {
                D.attr(elValue, 'name', fieldName);
                D.attr(elText, 'name', inputName);
            }

            this.elPlaceholder = elPlaceholder;
            this.elWrap = elWrap;
            this.elValue = elValue;
            this.elText = elText;
            this.elTrigger = elTrigger;
        },
        _bindElement: function() {
            var self = this,
                elText = this.elText,
                elValue = this.elValue,
                view = self._view,
                datalist = self._data;

            E.on(this.elTrigger, 'click', function(ev) {
                ev.preventDefault();
                var isVisible = self._view.getVisible();

                self._stopHideTimer();
                // focus会触发事件：若列表是隐藏的，则会显示出来。
                self._keepFocus();

                if(!isVisible) {
                    view.render(datalist.getDataSource());
                    self.show();
                }else {
                    self.hide();
                }
            });

            D.unselectable(this.elTrigger);

            // 同步数据用。
            elValue && self.on('change', function(ev) {
                var data = ev.data;

                elValue.value = data ? data.value : "";
            });

            // 模拟placeholder的功能
            var elPlaceholder = this.elPlaceholder;
            elPlaceholder && E.on(elText, 'valuechange', function(ev) {
                var val = D.val(elText);

                if(S.trim(val) === "") {
                    D.show(elPlaceholder);
                }else {
                    D.hide(elPlaceholder);
                }
            });

            self._bindInput(elText);
        },
        _bindInput: function(elInput) {
            var self = this,
                cfg = self.cfg,
                datalist = self._data,
                view = self._view;

            E.on(elInput, 'blur', function() {
                var data = self.getSelectedData(),
                    inputText = elInput.value;

                // 在失去焦点的时候，自动匹配当前输入值相同的项。
                if(cfg.autoMatch && self._autoMatchByText(inputText)) {
                    if(self._view.getVisible()) {
                        self.hide();
                    }
                    return;
                }

                // 若支持自定义输入内容，且输入的内容不为空，且当前没有选择的项
                // 则设置一个默认的值，这个值不记录到程序中。只是显示和同步数据。
                if(cfg.freedom &&
                    inputText !== EMPTY &&
                    data === undefined) {

                    data = {
                        value: cfg.customValue === undefined ? inputText : cfg.customValue,
                        text: inputText,
                        freedom: true
                    };
                }

                // 因为聚焦时会填充聚焦项的内容。失去焦点的时候需要重新设置为选择项的内容。
                self._data.select(data);

                self._latencyHide();
            });

            // keydown时检测操作
            E.on(elInput, 'keydown', function(ev) {
                var keyCode = ev.keyCode;

                // esc & tab
                if(keyCode == 9 || keyCode == 27) {
                    self._fillText(self.getSelectedData());
                    self.hide();
                    return;
                }

                // 上下键操作
                if(keyCode == 38 || keyCode == 40) {
                    ev.preventDefault();

                    if(!self._view.getVisible()) {
                        view.render(datalist.getDataSource());
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
                    // 表单里面，输入框的回车默认触发表单提交。阻止掉
                    ev.preventDefault();
                    view.selectFocused();
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
                    view.render(datalist.getDataSource());
                    self.show();
                    return;
                }

                function render(list) {
                    // 如果进行搜索，则表示当前选择项失效。
                    // 直接设置数据为空即可。若通过select方法来取消选择，会联动数据回填，导致输入框的内容不符合预期。
                    var prevData = self.getSelectedData();
                    datalist.selected = view.focused = undefined;

                    // 但是若数据变化了，还是需要触发外部事件，便于响应处理
                    if(prevData !== undefined) {
                        self.fire('change', {data: undefined});
                    }

                    if(list.length === 0) {
                        var html = "";
                        if(S.isFunction(cfg.emptyFormat)) {
                            html = cfg.emptyFormat(kw);
                        }else if(S.isString(cfg.emptyFormat)) {
                            html = cfg.emptyFormat;
                        }

                        view.emptyRender(html);
                    }else {
                        view.render(list);
                    }
                    self.show();
                }

                if(cfg.remote) {
                    self._remoteFilter(kw, render);
                }else {
                    self._syncFilter(kw, render);
                }
            });
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
                fnReceive = self.cfg.fnReceive,
                fnSuccess = param.success || fnNoop;

            ajaxParam.success = function(data) {
                // 过期数据丢弃。
                if(lastModify < self._lastModify) {
                    return;
                }

                var returnValue = fnReceive(data);

                if(!returnValue) return;

                fnSuccess(returnValue);

                if(returnValue.result) {
                    callback && callback(returnValue.list);
                }else {
                    alert(returnValue.msg);
                }
            }

            IO(ajaxParam);
        },
        _keepFocus: function() {
            E.fire(this.elText, 'focus');
        },
        _runWithMatch: function(map, value, data) {
            if(!data) return;

            if(value == data.value) {
                S.each(map.match, function(fn) {
                    fn && fn({data: data});
                });
            }else {
                S.each(map.mismatch, function(fn){
                    fn && fn({data: data});
                });
            }
        },
        _autoMatchByText: function(text) {
            var datalist = this._data,
                data = datalist.getDataByText(text);

            datalist.select(data);

            return !!data;
        },
        _fillText: function(data) {
            var elText = this.elText,
                text = data ? data.text : EMPTY;

            elText.value = text;
        },
        _remoteFilter: function(kw, callback) {
            var self = this,
                cfg = self.cfg;

            var param = cfg.remote || {};

            param.data = S.merge(param.data, {
                text: kw
            });

            var ajaxParam = param;

            self._fetch(ajaxParam, function(data) {
                var dt = self._dataFactory(data);
                self._data.setDataSource(kw, dt);
                callback && callback(dt);
            });
        },
        _syncFilter: function(kw, callback) {
            var self = this,
                datalist = self._data,
                result = [];

            // 筛选出符合的元素
            S.each(datalist.getDataSource(), function(it) {
                if(it.text.indexOf(kw) !== -1) {
                    result.push(it);
                }
            });

            // 异步回调处理。
            callback && callback(result);
        },
        _stopHideTimer: function() {
            var timer = this._timer;
            // 确定取消计时器的运行
            if(timer.hide) {
                timer.hide.cancel();
                timer.hide = null;
            }
        },
        _latencyHide: function() {
            var self = this,
                timer = self._timer;
            self._stopHideTimer();

            timer.hide  = S.later(function() {
                self.hide();
            }, self.cfg.hideDelay);
        }
    });

    return DropList;

}, {requires:['dom', 'event', 'ajax', './datalist', './viewscroll']});

/*
 ToDo
 - selection range
 - different view
 - option disable status
 - optgroup support
*/


