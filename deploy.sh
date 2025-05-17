#!/bin/bash

# Build the server
cd server
npm run build
cd ..

# Deploy to Elastic Beanstalk
eb deploy 