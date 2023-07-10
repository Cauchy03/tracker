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