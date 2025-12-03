#!/bin/sh

# Install playwright and its dependencies (Chromium only for lighter deployment)
npx -y playwright@1.50.1 install --with-deps chromium

# Install node modules
npm install
