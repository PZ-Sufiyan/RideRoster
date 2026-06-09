// Optional PM2 config for production on your self-hosted server.
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'rideroster-push',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
