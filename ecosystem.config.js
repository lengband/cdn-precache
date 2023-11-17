module.exports = {
  apps: [{
    name: 'cdn-precache',
    script: 'index.js',
    watch: true,
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '2G',
  }],
  deploy: {
    production: {
      user: 'root',
      host: '144.34.183.167',
      ref: 'origin/V1',
      repo: 'https://github.com/lengband/cdn-precache',
      path: '/root/okfe',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};