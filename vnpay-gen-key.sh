#! /usr/bin/env bash

# remove if exists and create a new dir
rm -rf $HOME/vnpay_prod
mkdir $HOME/vnpay_prod

# generate private key
openssl genrsa -out $HOME/vnpay_prod/private-k.pem 2048

# generate public
openssl rsa -in $HOME/vnpay_prod/private-k.pem -out $HOME/vnpay_prod/public-k.pem --outform PEM -pubout

# generate cert
printf 'VN\nHN\nHN\nEMDDI\nEMDDI\nEMDDI\nemddijsc@emddi.com' | openssl req -new -x509 -nodes -sha256 -days 3000 -key $HOME/vnpay_prod/private-k.pem -out $HOME/vnpay_prod/vnpay_public_cert.cer
