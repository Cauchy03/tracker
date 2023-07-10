import { DefaultOptions, TrackerConfig, Options } from "../types/index";
import { createHistoryEvent } from "../utils/pv";

export default class Tracker {
  public data: Options

  constructor(options: Options) {
    // 用户传的属性与默认的属性合并
    this.data = Object.assign(this.initDef(), options)
    this.installTracker()
  }

  // 初始化传递的参数
  private initDef(): DefaultOptions {
    window.history['pushState'] = createHistoryEvent('pushState')
    window.history['replaceState'] = createHistoryEvent('replaceState')
    return <DefaultOptions>{
      sdkVersion: TrackerConfig.version,
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false
    }
  }

  public setUerId<T extends DefaultOptions['uuid']>(uuid: T) {
    this.data.uuid = uuid
  }

  public setExtra<T extends DefaultOptions['extra']>(extra: T) {
    this.data.extra = extra
  }

  // 用户手动上报
  public sendTracker<T>(data: T) {
    this.reportTracker({data})
  }

  // 捕获器 监听事件函数
  private captureEvent<T>(mouseEventList: string[], targetKey: string, data?: T) {
    mouseEventList.forEach(event => {
      window.addEventListener(event, () => {
        console.log('监听到了', event)
        // 自动上报
        this.reportTracker({
          event,
          targetKey,
          data
        })
      })
    })
  }

  // 初始化函数
  private installTracker() {
    if (this.data.historyTracker) {
      this.captureEvent(['pushState', 'replaceState', 'popstate'], 'history-pv')
    }
    if (this.data.hashTracker) {
      this.captureEvent(['hashchange'], 'hash-pv')
    }
  }

  // 上报后台
  private reportTracker<T>(data: T) {
    const params = Object.assign(this.data, data, { time: new Date().getTime() })
    let headers = {
      type: 'application/x-www-form-urlencoded'
    }
    let blob = new Blob([JSON.stringify(params)], headers)
    navigator.sendBeacon(this.data.requestUrl, blob) // navigator.sendBeacon() 只能传post
  }

}