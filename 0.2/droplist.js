/**
 * @fileoverview
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/
KISSY.add(function (S, D, E, IO, DataList, View) {
    var EMPTY = '',
        def = {
            hideDelay: 100,
//            placeholder: "placeholder",
            fieldName: "",
            // droplist容器的append处理逻辑
            insertion: document.body,
//            remote:
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
            '<div class="drop-wrap">' +
            '<input class="drop-text" type="text" name="{name}-text" />' +
            '</div>' +
            '<input class="drop-value" type="hidden" />' +
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
            this._view = new View(this._data);

            this._bindControl();

            this.timer = {
                search: null,
                hide: null
            };
        },
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

            // render时才做初始化数据处理。
            var ds = cfg.dataSource;

            function setDataSource(data) {
                var dt = self.dataFactory(data);
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
        dataFactory: function(data) {
            var dt = this.cfg.fnDataAdapter(data);
            return this._data.dataFactory(dt);
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

                if(!returnValue) return;

                if(returnValue.result) {
                    callback && callback(returnValue.list);
                }else {
                    alert(returnValue.msg);
                }
            }

            IO(ajaxParam);
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
            this._view.visible(false);
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
        },
        _bindInput: function(elInput) {
            var self = this,
                cfg = self.cfg,
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
                    }
                }

                if(cfg.remote) {
                    self._remoteFilter(kw, render);
                }else {
                    self._syncFilter(kw, render);
                }
            });
        },
        _remoteFilter: function(kw, callback) {
            var self = this,
                cfg = self.cfg;

            var ajaxParam = S.merge({}, cfg.remote, {
                data: {
                    text: kw
                }
            });

            self._fetch(ajaxParam, function(data) {
                var dt = self.dataFactory(data);
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
                var html = S.substitute(TEMPLATES.wrap);
                elWrap = D.create(html);
            }

            var elTrigger = D.get('.' + TEMPLATES.triggerCls, elWrap),
                elText = D.get('.' + TEMPLATES.textCls, elWrap),
                elValue = D.get('.' + TEMPLATES.valueCls, elWrap),
                fieldName = this.cfg.fieldName;

            // 设置value表单域的name值
            if(fieldName) {
                D.attr(elValue, 'name', fieldName);
            }

            this.elWrap = elWrap;
            this.elValue = elValue;
            this.elText = elText;
            this.elTrigger = elTrigger;
        }
    });

    return DropList;

}, {requires:['dom', 'event', 'ajax', './datalist', './viewscroll']});

/*
 ToDo
 - ARIA
 - input placeholder
 - selection range
 - different view
 - custom template
 - 目前只支持枚举不可输入，需要支持枚举可输入。
 - remote data?
 - doWith method. more useful for dev
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



