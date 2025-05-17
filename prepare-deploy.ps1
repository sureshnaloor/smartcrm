# Create a temporary directory
New-Item -ItemType Directory -Force -Path "deploy_temp"

# Build the server
cd server
npm run build
cd ..

# Copy necessary files to temp directory
Copy-Item -Path "server" -Destination "deploy_temp/server" -Recurse
Copy-Item -Path "shared" -Destination "deploy_temp/shared" -Recurse
Copy-Item -Path ".ebextensions" -Destination "deploy_temp/.ebextensions" -Recurse
Copy-Item -Path ".npmrc" -Destination "deploy_temp/.npmrc"
Copy-Item -Path "Procfile" -Destination "deploy_temp/Procfile"

# Create the zip file
cd deploy_temp
Compress-Archive -Path * -DestinationPath "../server-deploy.zip" -Force
cd ..

# Clean up
Remove-Item -Path "deploy_temp" -Recurse -Force

Write-Host "Deployment package created: server-deploy.zip" 