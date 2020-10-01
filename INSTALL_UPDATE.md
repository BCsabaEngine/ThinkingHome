# Install system
 git clone https://github.com/SymbolCsaba/ThinkingHome.git .
 npm install --production --unsafe-perm

# Update system
 pm2 stop ThinkingHome
 git reset --hard HEAD
 git pull
 npm update --production --unsafe-perm
 pm2 start ThinkingHome
