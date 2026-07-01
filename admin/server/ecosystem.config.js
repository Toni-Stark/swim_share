module.exports = {
  apps: [{
    name: 'swim-admin',
    script: './src/index.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
