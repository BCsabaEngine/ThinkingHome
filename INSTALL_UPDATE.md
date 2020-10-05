# Initialize RPi components
 ```sh
 passwd
 apt-get update
 apt-get dist-upgrade
 raspi-config -> extend filesystem
 raspi-config -> set timezone
 systemctl disable dphys-swapfile.service
 apt-get install -y mc zip unzip telnet git
 /boot/config.txt -> dtoverlay=disable-wifi
 /boot/config.txt -> dtoverlay=disable-bt
 /etc/dhcpcd.conf -> setup fix IP
 /etc/hostname -> any
 /etc/hosts -> same
 ```

# Pre-Install components
 ```sh
 apt-get install - y nmap
 curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
 apt-get install -y nodejs
 node -v && npm -v
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
 ```

# Install system
 ```sh
 mkdir & cd to your favorite folder
 git clone https://github.com/BCsabaEngine/ThinkingHome.git .
 npm install --production --unsafe-perm
 cp ./config.js.sample ./config.js
 NODE_ENV=production pm2 start ./index.js --name ThinkingHome
 pm2 save
 ```

# Update system
 ```sh
 pm2 stop ThinkingHome
 
 git reset --hard HEAD
 git pull
 npm update --production --unsafe-perm
 
 pm2 start ThinkingHome
```
