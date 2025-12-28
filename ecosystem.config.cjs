module.exports = {
  apps: [
    {
      name: 'tokanA',
      script: 'npx',
      args: 'serve -s dist -l 10103',
      cwd: '.',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: '10103',
      },
    },
  ],
}
