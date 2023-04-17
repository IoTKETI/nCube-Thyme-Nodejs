#!/usr/bin/sh

OS=$(cat /etc/*release* | grep -w VERSION_CODENAME | cut -d '=' -f 2)

if [ $OS = "bullseye" ];then
  wget http://repo.mosquitto.org/debian/mosquitto-repo.gpg.key
  sudo apt-key add mosquitto-repo.gpg.key
  cd /etc/apt/sources.list.d/
  sudo wget http://repo.mosquitto.org/debian/mosquitto-bullseye.list 
  sudo apt-get update
  sudo apt-get install -y mosquitto
elif [ $OS = "buster" ];then
  wget http://repo.mosquitto.org/debian/mosquitto-repo.gpg.key
  sudo apt-key add mosquitto-repo.gpg.key
  cd /etc/apt/sources.list.d/
  sudo wget http://repo.mosquitto.org/debian/mosquitto-buster.list 
  sudo apt-get update
  sudo apt-get install -y mosquitto
elif [ $OS = "bionic" ];then
  sudo apt-get install -y mosquitto
fi
