export const createHistoryEvent = <T extends keyof History>(type: T) => {
  console.log(type)
  console.log(history)

  const origin = history[type]

  return function (this: any) {
    const res = origin.apply(this, arguments)

    const e = new Event(type)
    console.log(e)

    window.dispatchEvent(e)

    return res
  }
}