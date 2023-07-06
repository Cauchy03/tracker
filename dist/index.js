(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.tracker = factory());
})(this, (function () { 'use strict';

  //版本
  var TrackerConfig;
  (function (TrackerConfig) {
      TrackerConfig["version"] = "1.0.0";
  })(TrackerConfig || (TrackerConfig = {}));

  const createHistoryEvent = (type) => {
      console.log(type);
      console.log(history);
      const origin = history[type];
      return function () {
          const res = origin.apply(this, arguments);
          const e = new Event(type);
          console.log(e);
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

  return Tracker;

}));
