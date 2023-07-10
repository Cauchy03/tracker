import path from "path"
import ts from "rollup-plugin-typescript2"
import dts from "rollup-plugin-dts"
export default [
  {
    input: "./src/core/index.ts", // 入口文件
    output: [ // 出口文件
      {
        file: path.resolve(__dirname, './dist/index.esm.js'), // 输出位置
        format: "es" // 输出格式
      },
      {
        file: path.resolve(__dirname, './dist/index.cjs.js'), // 输出位置
        format: "cjs" // 输出格式
      },
      {
        input: "./src/core/index.ts",
        file: path.resolve(__dirname, './dist/index.js'), // 输出位置
        format: "umd", // 输出格式
        name: "Tracker"
      }
    ],
    plugins: [
      ts() // 默认读取tsconfig.json 文件
    ]
  },
  // 第二个对象 输出生命文件
  {
    input: "./src/core/index.ts",
    output: {
      file: path.resolve(__dirname, './dist/index.d.ts'),
      format: "es"
    },
    plugins: [dts.default()] // 调用插件生成生命文件
  }
]