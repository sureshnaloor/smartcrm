#!/bin/bash

# Create a temporary directory
mkdir -p deploy_temp

# Build the server
cd server
npm run build
cd ..

# Copy necessary files to temp directory
cp -r server deploy_temp/
cp -r shared deploy_temp/
cp -r .ebextensions deploy_temp/
cp .npmrc deploy_temp/
cp Procfile deploy_temp/

# Create the zip file
cd deploy_temp
zip -r ../server-deploy.zip .
cd ..

# Clean up
rm -rf deploy_temp

echo "Deployment package created: server-deploy.zip"