console.log('000');
const axios = require('axios');
const test = require('socks-proxy-agent');
const { SocksProxyAgent } = test;
console.log('-------');

const getip = axios.create();

getip.get('https://api.smartproxy.cn/web_v1/ip/get-ip-v3?app_key=a7f64f068513075d0a4014d7195d80f2&pt=9&num=3&ep=&cc=US&state=&city=&life=30&protocol=1&format=txt&lb=%5Cr%5Cn')
    .then(res => {
      // res.data 是 下面的三行数据
      // 23.139.224.203:13692
      // 23.139.224.203:13693
      // 23.139.224.203:13694
      console.log('11111');
      const agentList = res.data.split('\r\n');
      console.log({ agentList });
      agentList.forEach((item, index) => {
        agentList[index] = 'socks5://' + item;
        const agent = new SocksProxyAgent('socks5://' + item);
        const instance = axios.create({
          httpAgent: agent,
          httpsAgent: agent
      });
      // 发送请求
      instance.get('http://143.92.61.72/utils/getRequestIpInfo')
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error('error:', error);
        });
      })
    }).catch(error => {
      console.error('wrap error:', error);
    });
