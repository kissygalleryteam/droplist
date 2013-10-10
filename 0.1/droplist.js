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
KISSY.add(function (S, D, E, DataList, View) {
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



