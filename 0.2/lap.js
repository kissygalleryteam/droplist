/**
 * Large Array Processor (LAP)
 * @author ake<ake.wgk@taobao.com | wgk1987@gmail.com>
 */
KISSY.add(function(S) {

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