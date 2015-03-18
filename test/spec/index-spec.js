KISSY.add(function (S, Node,Demo) {
    var $ = Node.all;
    describe('droplist', function () {
        it('Instantiation of components',function(){
            var demo = new Demo();
            expect(S.isObject(demo)).toBe(true);
        })
    });

},{requires:['node','kg/droplist/2.0.1/']});