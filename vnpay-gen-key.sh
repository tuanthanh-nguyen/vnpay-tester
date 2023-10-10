#! /usr/bin/env bash

# remove if exists and create a new dir
rm -rf $HOME/vnpay_prod
mkdir $HOME/vnpay_prod

# generate private key
openssl genrsa -out $HOME/vnpay_prod/private-k.pem 2048

# generate public
openssl rsa -in $HOME/vnpay_prod/private-k.pem -out $HOME/vnpay_prod/public-k.pem --outform PEM -pubout

# generate cert
openssl req \
-new \
-x509 \
-nodes \
-sha256 \
-days 3000 \
-subj "/C=VN/ST=HN/L=HN/O=EMDDI/CN=EMDDI" \
-key $HOME/vnpay_prod/private-k.pem \
-out $HOME/vnpay_prod/emddi_cert \
