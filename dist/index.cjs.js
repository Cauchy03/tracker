'use strict';

//版本
var TrackerConfig;
(function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
})(TrackerConfig || (TrackerConfig = {}));

const createHistoryEvent = (type) => {
    // 保存原来的History事件
    const origin = history[type];
    return function () {
        // 调用原先事件获取返回值
        const res = origin.apply(this, arguments);
        // 创建事件
        const e = new Event(type);
        // 派发事件
        window.dispatchEvent(e);
        return res;
    };
};

class Tracker {
    constructor(options) {
        // 用户传的属性与默认的属性合并
        this.data = Object.assign(this.initDef(), options);
        this.installTracker();
    }
    // 初始化传递的参数
    initDef() {
        window.history['pushState'] = createHistoryEvent('pushState');
        window.history['replaceState'] = createHistoryEvent('replaceState');
        return {
            sdkVersion: TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        };
    }
    // 捕获器 监听事件函数
    captureEvent(mouseEventList, targetKey, data) {
        mouseEventList.forEach(event => {
            window.addEventListener(event, () => {
                console.log('监听到了', event);
            });
        });
    }
    // 初始化函数
    installTracker() {
        if (this.data.historyTracker) {
            this.captureEvent(['pushState', 'replaceState', 'popsState'], 'history-pv');
        }
    }
}

module.exports = Tracker;
