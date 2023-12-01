const request = require('request-promise');
const { countryWhiteList } = require('./strategy');


class Request {

  fetchState = {
    total: 0,
    success: 0,
    error: 0,
    successPercent: 0
  }

  getProxyUrl(num = 10, cc) {
    return `http://api.proxy.ipidea.io/getBalanceProxyIp?num=${num}&return_type=json&lb=1&sb=0&flow=1&regions=${cc}&protocol=socks5&spec=1`
  }

  async proxyByApi(targetUrl, { cc, num })  {
    let agentList = [];
    try {
      const res = await request(this.getProxyUrl(num, cc));
      agentList = JSON.parse(res).data || [];
      console.log(`cc(${cc}) get proxy success: res(${res})`);
    } catch (error) {
      console.error(`cc(${cc})get proxy error:`, error?.cause || error?.message);
    }
    // targetUrl = 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js';
    await Promise.all(agentList.map((agent, i) => this.singleFetch(targetUrl, `socks5://${agent.ip}:${agent.port}`, { showContent: i === -1, showIp: false })))
  }

  async proxyByAccount(targetUrl, { cc, num })  {
    let agentList = new Array(num).fill(0);
    const proxy = `http://okfe_cdn_precache-zone-custom-region-${cc}:Wp257207@proxy.ipidea.io:2336`;
    // targetUrl = 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js';
    await Promise.all(agentList.map((_, i) => this.singleFetch(targetUrl, proxy, { showContent: i === -1, showIp: false })))
  }

  async requestEntry(taskList) {
    // taskList = taskList.slice(0, 2); // DEBUG
    this.taskList = taskList;
    return this.asyncPool(10, taskList, this.requestByCountry.bind(this));
  }

  async requestByCountry({ assetUrl }, i) {
    for (const key in countryWhiteList) {
      await this.proxyByAccount(assetUrl, {
        cc: key,
        num: countryWhiteList[key].number
        // num: 1
      })
      // console.log(`
      //   requestByCountry: ${i}cc(${key}) / ${this.taskList.length} assetUrl(${assetUrl}) done
      //   fetchState(total[${this.fetchState.total}] success[${this.fetchState.success}] error[${this.fetchState.error}] successPercent[${this.fetchState.successPercent})
      // `)
    }
    console.log(`
      requestByCountry: ${i} / ${this.taskList.length} assetUrl(${assetUrl}) done
      fetchState(total[${this.fetchState.total}] success[${this.fetchState.success}] error[${this.fetchState.error}] successPercent[${this.fetchState.successPercent})
    `)
  }

  async singleFetch(targetUrl, proxy, { showContent, showIp } = {}) {
    this.fetchState.total++;
    // const startTime = +Date.now();
    const promiseList = [request({ url: targetUrl, proxy, resolveWithFullResponse: true, timeout: 5000 })];
    if (showIp) {
      promiseList.push(request({ url: 'https://ipinfo.io', proxy }))
    }
    try {
      const [response, ipdata] = await Promise.all(promiseList)
      // console.log({
      //   targetUrl,
      //   proxy,
      //   CloudflareHit: response.headers['cf-cache-status'],
      //   cfRay: response.headers['cf-ray'],
      //   ipInfo: JSON.parse(typeof ipdata === 'object' ? ipdata : '{}'),
      //   time: Date.now() - typeof startTime === 'number' ? startTime : 0,
      // });
      this.fetchState.success++;
      this.fetchState.successPercent = this.fetchState.success / this.fetchState.total;
      if (showContent) {
        console.log(response.body, 'resssssssss');
      }
    } catch (error) {
      this.fetchState.error++;
      // console.log("error:", error)
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