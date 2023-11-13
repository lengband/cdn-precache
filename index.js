const axios = require('axios');
const test = require('socks-proxy-agent');
const { SocksProxyAgent } = test;

const getip = axios.create();

const sleep = (s) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, s * 1000)
  })
}

getip.get('https://api.smartproxy.cn/web_v1/ip/get-ip-v3?app_key=5d884abaf2ac978d71f6e2c9987e1508&pt=9&num=5&ep=&cc=SG&state=&city=&life=30&protocol=1&format=json&lb=%5Cr%5Cn')
  .then((res) => {
    console.log(res.data, 'res.data', typeof res.data);
    // res.data 是 类似下面的数据
    // 23.139.224.203:13692
    // 23.139.224.203:13693
    // 23.139.224.203:13694
    const agentList = res.data.data.list;
    // const testUrl = 'https://www.okx.com/cdnpre/assets/okfe/inner/assets-system-test/0.0.5/d.js';
    const testUrl = 'https://static.okx.com/cdnpre/assets/okfe/inner/assets-system-test/0.0.5/d.js';
    console.log({ agentList, testUrl });
    agentList.forEach(async (item, index) => {
      agentList[index] = 'socks5://' + item;
      const agent = new SocksProxyAgent('socks5://' + item);
      const instance = axios.create({
        httpAgent: agent,
        httpsAgent: agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        }
      });
      // 发送请求
      const { data: { data } } = await instance.get('http://143.92.61.72/utils/getRequestIpInfo')
      console.log({ ipInfo: data });
      instance.get(testUrl)
        .then(response => {
          console.log({ status: response.status, cloudfrontHit: response.headers['x-cache'], CloudflareHit: response.headers['cf-cache-status'], statusText: response.statusText });
          if (index === 0) {
            console.log(response.data, 'resssssssss');
          }
        })
        .catch(error => {
          console.error('get URL error:', error);
        });
    })
  }).catch(error => {
    console.error('wrap error:', error);
  });
