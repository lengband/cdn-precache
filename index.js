const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { request } = require('./request');
const { projectWhiteList, cdnBaseUrl, hkCdnBaseUrl } = require('./strategy');

const axiosInstance = axios.create();
class Precache {

  dataDir = 'data';

  lock = false;

  projectContentwebMap = {
    'okfe/p2p': true, // https://static.coinall.ltd/cdn/assets/okfe/p2p/contentweb/9.2.304/asset-manifest.json
    'okfe/login': true,
  }

  async start() {
    if (this.lock) {
      return;
    }
    this.lock = true;
    try {
      const projectVersion = await axiosInstance.get(
        `${hkCdnBaseUrl}/projectVerson.json?v=${+new Date()}}`
      );
      const targetProjects = projectWhiteList.reduce((acc, cur) => {
        acc[cur] = projectVersion.data[cur];
        return acc;
      }, {});

      // 与本地文件对比
      const localProjectVersion = this.readJsonFile(path.join(__dirname, `${this.dataDir}/projectVersion.json`));
      const diffProjects = Object.keys(targetProjects).filter((project) => {
        return targetProjects[project] !== localProjectVersion[project];
      });

      const allDiffRes = await Promise.all(diffProjects.map(async (project) => {
        const { diffFiles, manifestRes } = await this.diffProjectManifest(project, targetProjects[project]);
        return { diffFiles, manifestRes, project };
      }));

      const taskList = [];
      for (let i = 0; i < allDiffRes.length; i++) {
        const { diffFiles, manifestRes, project } = allDiffRes[i];
        for (let j = 0; j < diffFiles.length; j++) {
          const file = diffFiles[j];
          taskList.push({
            assetUrl: this.getAssetUrl({ version: targetProjects[project], project, file, enableContentHashBuild: manifestRes.enableContentHashBuild })
          })
        }
      }

      if (taskList.length > 0) {
        console.log(`total taskList(${taskList.length}), starting`);
      }

      await request.requestEntry(taskList)
      await fs.writeFileSync(`${this.dataDir}/projectVersion.json`, JSON.stringify(targetProjects, null, 2), 'utf-8'); // DEBUG
    } catch (error) {
      console.error('error:', error?.cause || error?.message);
    }
    this.lock = false;
  }

  async diffProjectManifest(projectName, version) {
    const url = `${hkCdnBaseUrl}/okfe/${projectName}/${version}/asset-manifest.json`;
    const { data: manifestRes } = await axiosInstance.get(url);
    // 与本地文件对比，对比 files: string[] 字段
    const localManifest = this.readJsonFile(path.join(__dirname, `${this.dataDir}/${projectName}.json`), { files: [] });
    const diffFiles = manifestRes.files.filter(
      (file) => !localManifest.files.includes(file)
    );
    await fs.writeFileSync(`${this.dataDir}/${projectName}.json`, JSON.stringify(manifestRes, null, 2),'utf-8'); // DEBUG
    return { diffFiles, manifestRes };
  }

  getAssetUrl({ version, enableContentHashBuild, project, file }) {
    const isContentweb = this.projectContentwebMap[project];
    let versionPrefix = `/${version}`;
    // 兼容 ./index.js 情况
    let filename = file.startsWith('./') ? file.slice(2) : file;
    filename = filename.replace('/./', '/'); // 兼容：9.1.16/./index.media_lg_min-1024px.css
    if (enableContentHashBuild === true || enableContentHashBuild === 'true') {
      versionPrefix = '';
    }
    if (isContentweb) {
      versionPrefix = '/contentweb';
    }
    const assetUrl = `${cdnBaseUrl}/okfe/${project}${versionPrefix}/${filename}`;
    return assetUrl
  }

  readJsonFile(filepath, defailtValue = {}) {
    if (!fs.existsSync(filepath)) {
      // 如果目录不存在，创建目录
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.writeFileSync(filepath, JSON.stringify(defailtValue, null, 2), { encoding: 'utf-8' });
      return defailtValue;
    }
    return JSON.parse(
      fs.readFileSync(filepath, 'utf-8')
    );
  }
}


const job = new Precache();

setInterval(() => {
  job.start();
}, 10000)
