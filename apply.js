const { request } = require('./request');

request.requestEntry([
  {
    assetUrl: 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js'
  },
  {
    assetUrl: 'https://www.okx.com/cdn/assets/okfe/okx-nav/common/877.a675dc50.js'
  },
  {
    assetUrl: 'https://www.okx.com/cdn/assets/okfe/okx-nav/global/index.df395dc7.js'
  },
  {
    assetUrl: 'https://www.okx.com/cdn/assets/okfe/okx-nav/okxGlobal/index.918112a4.js'
  },
  {
    assetUrl: 'https://www.okx.com/cdn/assets/okfe/okx-nav/vendor/index.9c7a6959.js'
  }
])