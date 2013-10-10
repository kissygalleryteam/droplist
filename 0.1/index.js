/**
 * @fileoverview 
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/

KISSY.add(function (S, D, E, DropList) {
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



