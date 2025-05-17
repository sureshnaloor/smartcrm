#!/bin/bash

# Create a temporary directory for deployment
echo "Creating deployment directory..."
DEPLOY_DIR="deploy_temp"
mkdir -p $DEPLOY_DIR

# Copy server files
echo "Copying server files..."
cp -r server/dist $DEPLOY_DIR/
cp server/package.json $DEPLOY_DIR/
cp server/package-lock.json $DEPLOY_DIR/
cp server/Procfile $DEPLOY_DIR/

# Create shared directory and copy shared files
echo "Copying shared files..."
mkdir -p $DEPLOY_DIR/shared
cp -r shared/* $DEPLOY_DIR/shared/

# Copy .ebextensions from root
echo "Copying Elastic Beanstalk configuration files..."
mkdir -p $DEPLOY_DIR/.ebextensions
cp -r .ebextensions/* $DEPLOY_DIR/.ebextensions/

# Create .npmrc with timeout settings
echo "Creating .npmrc file..."
cat > $DEPLOY_DIR/.npmrc << EOL
fetch-timeout=300000
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
EOL

# Create the zip file
echo "Creating deployment zip file..."
zip -r server-deploy.zip $DEPLOY_DIR

# Clean up
echo "Cleaning up..."
rm -rf $DEPLOY_DIR

echo "Deployment package created: server-deploy.zip"