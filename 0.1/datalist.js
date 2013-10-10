/**
 * 默认，单页scroll式的数据。
 * 初次异步获取数据，或直接使用数据源或每次都异步获取数据。
 */

KISSY.add(function(S) {
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