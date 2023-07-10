### 什么是埋点

通过数据的采集-数据处理-数据分析和挖掘，如用户停留时间，用户哪个按钮点的多等

使用ts主要是在编译过程中发现问题，减少生产代码的错误，

使用rollup 应为 rollup打包干净，而webpack非常臃肿，可读性差，所以rollup非常适合开发SDK和一些框架，webpack 适合开发一些项目

### 安装依赖

```
npm install rollup -D
npm install rollup-plugin-dts -D
npm install rollup-plugin-typescript2 -D
npm install typescript -D
```

配置rollup

```js
import ts from 'rollup-plugin-typescript2'
import path from 'path'
import dts from 'rollup-plugin-dts';
export default [{
    //入口文件
    input: "./src/core/index.ts",
    output: [
        //打包esModule
        {
            file: path.resolve(__dirname, './dist/index.esm.js'),
            format: "es"
        },
        //打包common js
        {
            file: path.resolve(__dirname, './dist/index.cjs.js'),
            format: "cjs"
        },
        //打包 AMD CMD UMD
        {
            input: "./src/core/index.ts",
            file: path.resolve(__dirname, './dist/index.js'),
            format: "umd",
            name: "tracker"
        }

    ],
    //配置ts
    plugins: [
        ts(),
    ]

}, {
    //打包声明文件
    input: "./src/core/index.ts",
    output:{
        file: path.resolve(__dirname, './dist/index.d.ts'),
        format: "es",
    },
    plugins: [dts()]
}] 
```

### src type定义类型

```ts
/**
 * @requestUrl 接口地址
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker 携带Tracker-key 点击事件上报
 * @sdkVersionsdk版本
 * @extra透传字段
 * @jsError js 和 promise 报错异常上报
 */
export interface DefaultOptons {
    uuid: string | undefined,
    requestUrl: string | undefined,
    historyTracker: boolean,
    hashTracker: boolean,
    domTracker: boolean,
    sdkVersion: string | number,
    extra: Record<string, any> | undefined,
    jsError:boolean
}
 
//必传参数 requestUrl
export interface Options extends Partial<DefaultOptons> {
    requestUrl: string,
}
 
//版本
export enum TrackerConfig {
    version = '1.0.0'
}
//上报必传参数
export type reportTrackerData = {
    [key: string]: any,
    event: string,
    targetKey: string
}
```

### src core 核心功能

**PV：页面访问量，即PageView，用户每次对网站的访问均被记录**

主要监听了 history 和 hash

history API  go back  forward pushState  replaceState  

history 无法通过 popstate 监听 pushState replaceState  只能重写其函数 在utils/pv

hash 使用hashchange 监听

**UV(独立访客)：即Unique Visitor，访问您网站的一台电脑客户端为一个访客**

用户唯一表示 可以在登录之后通过接口返回的id 进行设置值 提供了setUserId

也可以使用canvas 指纹追踪技术 Vue3 + vite + Ts + pinia + 实战 + 源码 +全栈_哔哩哔哩_bilibili

**本章重点 navigator.sendBeacon**

为什么要使用这个去上报

这个上报的机制 跟 XMLHttrequest 对比  navigator.sendBeacon 即使页面关闭了 也会完成请求 而XMLHTTPRequest 不一定

**DOM事件监听**

主要是给需要监听的元素添加一个属性 用来区分是否需要监听 target-key

**js报错上报 error 事件  promise报错 unhandledrejection**

```ts
import { DefaultOptions, TrackerConfig, Options } from "../types/index";
import { createHistoryEvent } from "../utils/pv";

// dom 事件
const MouseEventList: string[] = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover']

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
        this.reportTracker(data)
    }

    // dom事件点击上报
    private targetKeyReport() {
        MouseEventList.forEach(event => {
            window.addEventListener(event, (e) => {
                // 获取事件对象
                const target = e.target as HTMLElement
                const targetKey = target.getAttribute('target-key')
                // 判断是否存在 自定义 target-key
                if (targetKey) {
                    // 如果存在 就上报后台
                    this.reportTracker({
                        event,
                        targetKey
                    })
                }
            })
        })
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
        if (this.data.domTracker) {
            this.targetKeyReport()
        }
        if (this.data.jsError) {
            this.jsError()
        }
    }

    private jsError() {
        this.errorEvent()
        this.promiseReject()
    }

    //捕获js报错
    private errorEvent() {
        window.addEventListener('error', (event) => {
            console.log(event)
            this.sendTracker({
                event: 'error',
                targetKey: 'message',
                message: event.message
            })
        })
    }

    //捕获promise 错误
    private promiseReject() {
        window.addEventListener('unhandledrejection', (event) => {
            console.log(event)
            event.promise.catch((error) => {
                this.reportTracker({
                    event: 'promise_reject',
                    targetKey: 'message',
                    message: error
                })
            })
        })
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
```

### 工具函数 src/utils/pv

```ts
export const createHistoryEvent = <T extends keyof History>(type: T) => {
    // 保存原来的History事件
    const origin = history[type]

    return function (this: any) {
        // 调用原先事件获取返回值
        const res = origin.apply(this, arguments)
        // 创建事件
        const e = new Event(type)
        // 派发事件
        window.dispatchEvent(e)

        return res
    }
}
```

### 设置package.json

main module 分别设置对应的js文件

files 设置打包之后的目录 我这儿是dist 具体看rollup config .js

```json
{
  "name": "tracker-cauchy",
  "version": "1.0.0",
  "description": "",
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "browser": "dist/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build": "rollup -c --bundleConfigAsCjs"
  },
  "keywords": ["埋点","tracker"],
  "author": "",
  "files": ["dist"],
  "license": "ISC",
  "devDependencies": {
    "rollup": "^3.26.0",
    "rollup-plugin-dts": "^5.3.0",
    "rollup-plugin-typescript2": "^0.35.0",
    "typescript": "^5.1.6"
  }
}
```

