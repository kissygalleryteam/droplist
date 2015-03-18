/**
 * 默认，单页scroll式的数据。
 * 初次异步获取数据，或直接使用数据源或每次都异步获取数据。
 */
KISSY.add(function(S, require, exports, module) {
    var UNIQUEKEY = "__id",
        QUEUEINDEX = '__index',
        def = {
            dataSource: null
        };
    function DataList() {
        this._init.apply(this, arguments);
    }

    S.augment(DataList, S.EventTarget, {
        _init: function(cfg) {
            cfg = this.cfg = S.merge(def, cfg);
            this.cache = {};
            this._dataMap = {};
            this._initSelected = cfg.selected;
            this.mulSelect = cfg.mulSelect;
        },
        getDataByValue: function(value) {
            if(!this.getDataSource()) {
                return;
            }
            var result;
            S.each(this.getDataSource(), function(it) {
                if(it.value === value) {
                    result = it;
                    return false;
                }
            });
            return result;
        },
        getClientId: function(data) {
            return data && data[UNIQUEKEY];
        },
        getDataByText: function(text) {
            if(!this.getDataSource()) {
                return;
            }
            var result;
            S.each(this.getDataSource(), function(it) {
                if(it.text === text) {
                    result = it;
                    return false;
                }
            });
            return result;
        },
        select: function(id) {
            var data = id;
            if(!S.isPlainObject(id) && id != undefined) {
                data = this._dataMap[id];
            }
            this._selectByData(data);
        },
        _selectByData: function(data) {
            if(this.mulSelect){
                if(this.selected && data && S.inArray(data,this.selected)) return;
            }else{
                // 同一个选项，就不需要再次处理了。
                if(this.selected && data && data.value === this.selected.value) return;
            }
            this.fire('selected', {data:data});
        },
        saveData: function(data){
            if(this.mulSelect){
                this.selected = this.selected || [];
                this.selected.push(data);
            }else{
                this.selected = data;
            }
            // console.log(this.selected);
        },
        delData:function(id){
            for (var i = 0; i < this.selected.length; i++) {
                if(this.selected[i].__id == id){
                    this.selected.splice(i,1);
                    break;
                }
            };
        },
        getSelectedData: function() {
            return this.selected || this._initSelected;
        },
        setDataSource: function(kw, data) {
            this.cache[kw] = data;
            this._list = data;
        },
        getDataSource: function(kw) {
            kw = kw || "";
            return this.cache[kw];
        },
        // 根据新数据，重新构造数据。
        dataFactory: function(list) {
            var self = this,
                prevSelected = self.getSelectedData(),
                result = [],
                map = this._dataMap;

            self.selected = undefined;

            S.each(list, function(it, idx) {
                var _id = S.guid();
    //                if(it[UNIQUEKEY] === undefined) {
                    it[UNIQUEKEY] = _id;
    //                }

                it[QUEUEINDEX] = idx;
                map[_id] = it;
                result.push(it);

                // 匹配新数据中的选择项
                // 模拟原生select，只以value值为准即可。
                if(self.cfg.mulSelect){
                    if(prevSelected && prevSelected.length){
                        for (var i = 0; i < prevSelected.length; i++) {
                            if(prevSelected[i] && it.value == prevSelected[i].value) {
                                self.select(_id);
                                break;
                            }
                        }
                    }
                }else{
                    if(prevSelected && it.value == prevSelected.value) {
                        self.select(_id);
                    }
                }
            });

            delete self._initSelected;

            return result;
        }
    });

    module.exports = DataList;
});