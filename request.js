const axios = require('axios');
const proxy = require('socks-proxy-agent');
const { countryWhiteList } = require('./strategy');
const { SocksProxyAgent } = proxy;


class Request {

  appKey = '5d884abaf2ac978d71f6e2c9987e1508';

  getProxyUrl(num = 10, cc) {
    return `https://api.smartproxy.cn/web_v1/ip/get-ip-v3?app_key=${this.appKey}&pt=9&num=${num}&ep=&cc=${cc}&state=&city=&life=30&protocol=1&format=json&lb=%5Cr%5Cn`
  }

  async proxy(targetUrl, { cc, num })  {
    let agentList = [];
    try {
      const { data: resData } = await axios.get(this.getProxyUrl(num, cc));
      agentList = resData.data.list;
    } catch (error) {
      console.error('get proxy error:', error?.cause || error?.message);
    }
    // targetUrl = 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js';
    await Promise.all(agentList.map((agentUrl, i) => this.singleFetch(targetUrl, agentUrl, { showContent: i === -1, showIp: false })))
  }

  async requestEntry(taskList) {
    this.taskList = taskList;
    return this.asyncPool(10, taskList, this.requestByCountry.bind(this));
  }

  async requestByCountry({ assetUrl }, i) {
    for (const key in countryWhiteList) {
      await this.proxy(assetUrl, {
        cc: key,
        num: countryWhiteList[key].number
      })
    }
    console.log(`requestByCountry: ${i} / ${this.taskList.length} assetUrl(${assetUrl}) done`)
  }

  async singleFetch(targetUrl, agentUrl, { showContent, showIp } = {}) {
    const agent = new SocksProxyAgent('socks5://' + agentUrl);
    const instance = axios.create({
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 agent/cdn-precache'
      }
    });
  
    const startTime = Date.now();
    const promiseList = [instance.get(targetUrl)];
    if (showIp) {
      promiseList.push(instance.get('http://143.92.61.72/utils/getRequestIpInfo'))
    }
    try {
      const [response, ipdata] = await Promise.all(promiseList)
      // console.log({
      //   status: response.status,
      //   CloudflareHit: response.headers['cf-cache-status'],
      //   statusText: response.statusText,
      //   cfRay: response.headers['cf-ray'],
      //   ipInfo: ipdata?.data?.data,
      //   time: Date.now() - startTime,
      // });
      if (showContent) {
        console.log(response.data, 'resssssssss');
      }
    } catch (error) {
      console.error('get URL error:', error?.cause || error?.message);
    }
  }

  /**
   * 并发控制器函数
   * @param {number} poolLimit 并发限制数
   * @param {T[]} array 需要进行并发控制的任务数组
   * @param {(item: T) => Promise<R>} iteratorFn 每个队列任务完成后的回调
   * @return {Promise<R[]>} 返回所有队列的回调的返回结果
   */
    async asyncPool(poolLimit, array, iteratorFn) {
      const ret = [];
      const executing = [];
      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        // 对每个元素执行迭代器函数，返回一个 Promise
        const p = Promise.resolve().then(() => iteratorFn(item, i));
        ret.push(p);
        // 当数组长度大于等于设定的并发限制时，开始进行并发控制
        if (poolLimit <= array.length) {
          // 当 Promise p 完成时，从 executing 数组中移除它
          const e = p.then(() => executing.splice(executing.indexOf(e), 1));
          executing.push(e);
  
          if (executing.length >= poolLimit) {
            await Promise.race(executing);
          }
        }
      }
      return Promise.all(ret);
    }
}


module.exports = {
  request: new Request()
}