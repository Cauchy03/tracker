(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Tracker = factory());
})(this, (function () { 'use strict';

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

  // dom 事件
  const MouseEventList = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover'];
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
      setUerId(uuid) {
          this.data.uuid = uuid;
      }
      setExtra(extra) {
          this.data.extra = extra;
      }
      // 用户手动上报
      sendTracker(data) {
          this.reportTracker(data);
      }
      // dom事件点击上报
      targetKeyReport() {
          MouseEventList.forEach(event => {
              window.addEventListener(event, (e) => {
                  // 获取事件对象
                  const target = e.target;
                  const targetKey = target.getAttribute('target-key');
                  // 判断是否存在 自定义 target-key
                  if (targetKey) {
                      // 如果存在 就上报后台
                      this.reportTracker({
                          event,
                          targetKey
                      });
                  }
              });
          });
      }
      // 捕获器 监听事件函数
      captureEvent(mouseEventList, targetKey, data) {
          mouseEventList.forEach(event => {
              window.addEventListener(event, () => {
                  console.log('监听到了', event);
                  // 自动上报
                  this.reportTracker({
                      event,
                      targetKey,
                      data
                  });
              });
          });
      }
      // 初始化函数
      installTracker() {
          if (this.data.historyTracker) {
              this.captureEvent(['pushState', 'replaceState', 'popstate'], 'history-pv');
          }
          if (this.data.hashTracker) {
              this.captureEvent(['hashchange'], 'hash-pv');
          }
          if (this.data.domTracker) {
              this.targetKeyReport();
          }
          if (this.data.jsError) {
              this.jsError();
          }
      }
      jsError() {
          this.errorEvent();
          this.promiseReject();
      }
      errorEvent() {
          window.addEventListener('error', (event) => {
              console.log(event);
              this.sendTracker({
                  event: 'error',
                  targetKey: 'message',
                  message: event.message
              });
          });
      }
      promiseReject() {
          window.addEventListener('unhandledrejection', (event) => {
              console.log(event);
              event.promise.catch((error) => {
                  this.reportTracker({
                      event: 'promise_reject',
                      targetKey: 'message',
                      message: error
                  });
              });
          });
      }
      // 上报后台
      reportTracker(data) {
          const params = Object.assign(this.data, data, { time: new Date().getTime() });
          let headers = {
              type: 'application/x-www-form-urlencoded'
          };
          let blob = new Blob([JSON.stringify(params)], headers);
          navigator.sendBeacon(this.data.requestUrl, blob); // navigator.sendBeacon() 只能传post
      }
  }

  return Tracker;

}));
