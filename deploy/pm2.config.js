module.exports = {
  apps: [
    {
      name: 'socialapp-signaling',
      script: './signaling/server.js',
      cwd: '/workspaces/codespaces-react',
      instances: 1,          // Socket.io 需要 sticky session，先用單進程
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env: {
        PORT: 3001,
        NODE_ENV: 'production',
      },
      error_file: '/var/log/socialapp/signaling-error.log',
      out_file: '/var/log/socialapp/signaling-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
