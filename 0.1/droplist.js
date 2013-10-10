/**
 * @fileoverview
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/
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
                this._fetch(cfg.dataSource, function(data) {
                    datalist.dataFactory(data);
                });
            }
        },
        _fetch: function(url, callback) {
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

            // 列表的鼠标点击操作和键盘回车选择操作是从view对象中触发的。
            view.on('itemSelect', function(ev) {
                var _id = ev.id;

                self._select(_id);
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

                self.fire('change', {data: data});
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
        // 程序调用的选择操作，是从droplist对象中触发的。
        selectByValue: function(value) {
            var data = this.getDataByValue(value);
            this._select(data && data._id);
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
 - different view
 - 目前只支持枚举不可输入，需要支持枚举可输入。
 - remote data?
*/

/*
ChangeLog
 0.2
   - 一次性远程获取数据或本地数据进行列表渲染。
   - 支持键盘的操作。方向键聚焦选项，回车键选择，esc关闭列表。
   - 支持可输入和不可输入（输入目前代表的是搜索功能）。
   - 从select节点渲染模拟combo box
 */



