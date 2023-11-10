const resolve =require('@rollup/plugin-node-resolve');
const commonjs =require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const tersser = require('@rollup/plugin-terser');

module.exports = {
  input:'./index.js', // 入口文件
  output:{
    file:'./dist/index.js', // 输出文件
    format: 'cjs', // 输出格式 amd / es / cjs / iife / umd / system
    sourcemap:true  // 生成bundle.js.map文件，方便调试
  },
  plugins: [
    tersser(),
    json(),
    resolve(),
    commonjs()
  ]
}