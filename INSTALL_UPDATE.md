# Initialize RPi components
 ```sh
 passwd
 sudo
 raspi-config -> extend filesystem
 raspi-config -> set timezone
 systemctl disable dphys-swapfile.service
 apt-get update
 apt-get dist-upgrade
 apt-get install -y mc zip unzip telnet git wget curl
 apt-get autoclean
 /boot/config.txt -> dtoverlay=disable-wifi
 /boot/config.txt -> dtoverlay=disable-bt
 /etc/dhcpcd.conf -> setup fix IP
 /etc/hostname -> any
 /etc/hosts -> same
 ```

# Pre-Install components
 ```sh
 apt-get install -y nmap
 curl -sL https://deb.nodesource.com/setup_15.x | sudo -E bash -
 apt-get install -y nodejs
 node -v && npm -v
 npm config set unsafe-perm true
 apt-get install -y mariadb-server
 mysql_secure_installation
 [mysql:] CREATE DATABASE ThinkingHome;
 [mysql:] CREATE USER 'root'@'%' IDENTIFIED WITH mysql_native_password USING '*1111...2222'; =PASSWORD('???')
 [mysql:] GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
 [mysql:] DROP USER 'root'@'localhost';
 /etc/mariadb.conf -> bind_address 0.0.0.0
 apt-get install -y mosquitto mosquitto-clients
 echo "user:pass" /etc/mosquitto/mosquitto.passwd
 mosquitto_passwd -U /etc/mosquitto/mosquitto.passwd
 service mosquitto restart
 npm install pm2 -g
 apt-get install -y certbot
 ```

# Install system
 ```sh
 mkdir & cd to your favorite folder
 git clone https://github.com/BCsabaEngine/ThinkingHome.git .
 npm install --production
 cp ./config.js.sample ./config.js
 NODE_ENV=production pm2 start ./index.js --name ThinkingHome
 pm2 save
 pm2 startup

# SSL cert (webrrot mode - recommended)
 certbot certonly --webroot -d yourdomain.tld

# SSL cert (standalone/manual)
 pm2 stop ThinkingHome
 certbot certonly --standalone -d yourdomain.tld
 pm2 start ThinkingHome
 ```

# Install zigbee2mqtt
 ```sh
 mkdir & cd to your favorite folder 2
 git clone https://github.com/Koenkk/zigbee2mqtt.git .
 npm ci
 edit /zigbee2mqtt/data/configuration.yaml
 optionally create service file
 npm start
 ```

# Update system
 ```sh
 pm2 stop ThinkingHome
 
 git reset --hard HEAD
 git pull
 npm update --production
 
 pm2 start ThinkingHome
```
# Update SSL cert in every 3 months
 certbot renew
