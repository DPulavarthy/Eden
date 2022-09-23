@echo off
git pull
docker build . -t eden
docker-compose up -d