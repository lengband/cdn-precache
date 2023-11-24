const request = require('request-promise');
const { countryWhiteList } = require('./strategy');


class Request {

  appKey = '5d884abaf2ac978d71f6e2c9987e1508';

  fetchState = {
    total: 0,
    success: 0,
    error: 0,
    successPercent: 0
  }

  getProxyUrl(num = 10, cc) {
    return `http://api.proxy.ipidea.io/getBalanceProxyIp?num=${num}&return_type=json&lb=1&sb=0&flow=1&regions=${cc}&protocol=socks5`
  }

  async proxy(targetUrl, { cc, num })  {
    let agentList = [];
    try {
      const res = await request(this.getProxyUrl(num, cc));
      agentList = JSON.parse(res).data || [];
    } catch (error) {
      console.error('get proxy error:', error?.cause || error?.message);
    }
    // targetUrl = 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js';
    await Promise.all(agentList.map((agent, i) => this.singleFetch(targetUrl, `${agent.id}:${agent.port}`, { showContent: i === -1, showIp: false })))
  }

  async requestEntry(taskList) {
    this.taskList = taskList;
    return this.asyncPool(1, taskList, this.requestByCountry.bind(this));
  }

  async requestByCountry({ assetUrl }, i) {
    for (const key in countryWhiteList) {
      await this.proxy(assetUrl, {
        cc: key,
        // num: countryWhiteList[key].number
        num: 1
      })
    }
    console.log(`
      requestByCountry: ${i} / ${this.taskList.length} assetUrl(${assetUrl}) done
      fetchState(total[${this.fetchState.total}] success[${this.fetchState.success}] error[${this.fetchState.error}] successPercent[${this.fetchState.successPercent})
    `)
  }

  async singleFetch(targetUrl, agentUrl, { showContent, showIp } = {}) {
    this.fetchState.total++;
    // const startTime = Date.now();
    const promiseList = [request({ url: targetUrl, proxy: `socks5://${agentUrl}`, })];
    if (showIp) {
      promiseList.push(request({ url: 'https://ipinfo.io', proxy: `socks5://${agentUrl}` }))
    }
    try {
      const [response, ipdata] = await Promise.all(promiseList)
      console.log({
        status: response.status,
        CloudflareHit: response.headers['cf-cache-status'],
        statusText: response.statusText,
        cfRay: response.headers['cf-ray'],
        ipInfo: ipdata,
        time: Date.now() - startTime,
      });
      this.fetchState.success++;
      this.fetchState.successPercent = this.fetchState.success / this.fetchState.total;
      if (showContent) {
        console.log(response.data, 'resssssssss');
      }
    } catch (error) {
      this.fetchState.error++;
      // const msg = error?.cause || error?.message;
      // if (!msg.includes('timeout')) {
      //   console.error('get URL error:', );
      // }
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