module.exports = {
  apps: [
    {
      name: 'plants-frontend',
      script: 'bash',                                                                                                                                      
      args: '-c "npm start"',
      instances: 1,
      env: {
        PORT: 3007,
        NODE_ENV: 'production'
      }
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: '77.37.49.238',
      ref: 'origin/main',
      repo: 'https://github.com/alesikivan/plants',
      path: '/root/apps/plants-frontend',

      'post-deploy': `
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

        npm install
        npm run build
        pm2 restart plants-frontend || pm2 start npm --name plants-frontend -- start
        pm2 save --force
      `
    }
  }
};
