# Pre-Install components
 ```sh
 curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
 apt-get install -y nodejs
 apt-get install -y mariadb
 apt-get install -y mosquitto mosquitto-clients
 npm install pm2 -g
 ```

# Install system
 ```sh
 git clone https://github.com/SymbolCsaba/ThinkingHome.git .  
 npm install --production --unsafe-perm  
 NODE_ENV=production pm2 start ./index.js --name ThinkingHome
 ```

# Update system
 ```sh
 pm2 stop ThinkingHome  
   
 git reset --hard HEAD  
 git pull  
 npm update --production --unsafe-perm  
   
 pm2 start ThinkingHome  
```
