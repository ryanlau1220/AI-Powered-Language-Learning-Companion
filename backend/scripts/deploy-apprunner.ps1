# AWS App Runner Deployment Script for Windows PowerShell
param(
    [string]$Stage = "dev",
    [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir

Write-Host "Starting AWS App Runner deployment..." -ForegroundColor Green
Write-Host "Backend directory: $BackendDir" -ForegroundColor Cyan
Write-Host "Stage: $Stage" -ForegroundColor Cyan
Write-Host "Environment file: $EnvFile" -ForegroundColor Cyan

# Check if .env file exists
$EnvPath = Join-Path $BackendDir $EnvFile
if (-not (Test-Path $EnvPath)) {
    Write-Host "Environment file not found: $EnvPath" -ForegroundColor Red
    Write-Host "Please create a .env file based on env.example" -ForegroundColor Cyan
    exit 1
}

# Load environment variables
Write-Host "Loading environment variables..." -ForegroundColor Yellow
$EnvContent = Get-Content $EnvPath
$EnvVars = @{}
foreach ($line in $EnvContent) {
    $trimmedLine = $line.Trim()
    if ($trimmedLine -and -not $trimmedLine.StartsWith("#")) {
        $parts = $trimmedLine.Split("=", 2)
        if ($parts.Length -eq 2) {
            $EnvVars[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
}

# Validate required variables
$RequiredVars = @("AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "JWT_SECRET")
foreach ($var in $RequiredVars) {
    if (-not $EnvVars.ContainsKey($var) -or [string]::IsNullOrEmpty($EnvVars[$var])) {
        Write-Host "Required environment variable missing: $var" -ForegroundColor Red
        exit 1
    }
}

# Set derived variables
$ServiceName = "ai-language-learning-backend-$Stage"
$Region = $EnvVars["AWS_REGION"]

Write-Host "Environment variables loaded successfully" -ForegroundColor Green
Write-Host "AWS Region: $Region" -ForegroundColor Cyan
Write-Host "Service Name: $ServiceName" -ForegroundColor Cyan

# Get AWS Account ID
Write-Host "Getting AWS Account ID..." -ForegroundColor Yellow
try {
    $AccountId = (aws sts get-caller-identity --query Account --output text --region $Region).Trim()
    Write-Host "AWS Account ID: $AccountId" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to get AWS Account ID. Please check your AWS credentials." -ForegroundColor Red
    exit 1
}

# Change to backend directory
Set-Location $BackendDir

# Create ECR repository if it doesn't exist
Write-Host "Creating ECR repository..." -ForegroundColor Yellow
try {
    aws ecr create-repository --repository-name $ServiceName --region $Region --image-scanning-configuration scanOnPush=true 2>$null
    Write-Host "ECR repository created" -ForegroundColor Green
} catch {
    Write-Host "ECR repository already exists" -ForegroundColor Yellow
}

# Get ECR login token and login
Write-Host "Logging into ECR..." -ForegroundColor Yellow
$LoginCommand = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com"
Invoke-Expression $LoginCommand

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t $ServiceName .

# Tag and push image
Write-Host "Pushing Docker image to ECR..." -ForegroundColor Yellow
$ImageUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ServiceName:latest"
docker tag "$ServiceName:latest" $ImageUri
docker push $ImageUri

Write-Host "Docker image pushed successfully" -ForegroundColor Green

# Create App Runner service configuration
Write-Host "Creating App Runner service..." -ForegroundColor Yellow

# Create JSON configuration manually to avoid PowerShell conversion issues
$ConfigJson = @"
{
    "ServiceName": "$ServiceName",
    "SourceConfiguration": {
        "ImageRepository": {
            "ImageIdentifier": "$ImageUri",
            "ImageConfiguration": {
                "Port": "3000",
                "RuntimeEnvironmentVariables": {
                    "NODE_ENV": "production",
                    "AWS_REGION": "$($EnvVars["AWS_REGION"])",
                    "AWS_ACCESS_KEY_ID": "$($EnvVars["AWS_ACCESS_KEY_ID"])",
                    "AWS_SECRET_ACCESS_KEY": "$($EnvVars["AWS_SECRET_ACCESS_KEY"])",
                    "JWT_SECRET": "$($EnvVars["JWT_SECRET"])",
                    "USERS_TABLE": "ai-language-learning-backend-$Stage-users",
                    "CONVERSATIONS_TABLE": "ai-language-learning-backend-$Stage-conversations",
                    "BEDROCK_MODEL_ID": "$(if ($EnvVars["BEDROCK_MODEL_ID"]) { $EnvVars["BEDROCK_MODEL_ID"] } else { "amazon.nova-pro-v1:0" })",
                    "BEDROCK_REGION": "$(if ($EnvVars["BEDROCK_REGION"]) { $EnvVars["BEDROCK_REGION"] } else { "us-east-1" })",
                    "TRANSCRIBE_LANGUAGE_CODE": "$(if ($EnvVars["TRANSCRIBE_LANGUAGE_CODE"]) { $EnvVars["TRANSCRIBE_LANGUAGE_CODE"] } else { "en-US" })",
                    "TRANSCRIBE_REGION": "$(if ($EnvVars["TRANSCRIBE_REGION"]) { $EnvVars["TRANSCRIBE_REGION"] } else { "ap-southeast-1" })",
                    "POLLY_VOICE_ID": "$(if ($EnvVars["POLLY_VOICE_ID"]) { $EnvVars["POLLY_VOICE_ID"] } else { "Joanna" })",
                    "POLLY_REGION": "$(if ($EnvVars["POLLY_REGION"]) { $EnvVars["POLLY_REGION"] } else { "ap-southeast-1" })",
                    "COMPREHEND_REGION": "$(if ($EnvVars["COMPREHEND_REGION"]) { $EnvVars["COMPREHEND_REGION"] } else { "ap-southeast-1" })",
                    "TRANSLATE_REGION": "$(if ($EnvVars["TRANSLATE_REGION"]) { $EnvVars["TRANSLATE_REGION"] } else { "ap-southeast-1" })",
                    "S3_BUCKET_NAME": "ai-language-learning-backend-$Stage-audio-files",
                    "S3_REGION": "$(if ($EnvVars["S3_REGION"]) { $EnvVars["S3_REGION"] } else { "ap-southeast-1" })"
                }
            },
            "ImageRepositoryType": "ECR"
        },
        "AutoDeploymentsEnabled": true
    },
    "InstanceConfiguration": {
        "Cpu": "1024",
        "Memory": "2048"
    },
    "HealthCheckConfiguration": {
        "Protocol": "HTTP",
        "Path": "/health",
        "Interval": 10,
        "Timeout": 5,
        "HealthyThreshold": 1,
        "UnhealthyThreshold": 5
    },
    "Tags": [
        {
            "Key": "Environment",
            "Value": "$Stage"
        },
        {
            "Key": "Project",
            "Value": "AI-Language-Learning"
        }
    ]
}
"@

# Save config to temporary file
$ConfigPath = Join-Path $ScriptDir "apprunner-config.json"
$ConfigJson | Out-File -FilePath $ConfigPath -Encoding UTF8

# Create or update App Runner service
$ServiceArn = "arn:aws:apprunner:$Region" + ":$AccountId" + ":service/$ServiceName"
try {
    aws apprunner describe-service --service-arn $ServiceArn --region $Region 2>$null
    Write-Host "Service already exists, updating..." -ForegroundColor Yellow
    $UpdateConfig = @{
        ServiceArn = $ServiceArn
        SourceConfiguration = @{
            ImageRepository = @{
                ImageIdentifier = $ImageUri
                ImageConfiguration = @{
                    Port = "3000"
                    RuntimeEnvironmentVariables = @{
                        NODE_ENV = "production"
                        AWS_REGION = $EnvVars["AWS_REGION"]
                        AWS_ACCESS_KEY_ID = $EnvVars["AWS_ACCESS_KEY_ID"]
                        AWS_SECRET_ACCESS_KEY = $EnvVars["AWS_SECRET_ACCESS_KEY"]
                        JWT_SECRET = $EnvVars["JWT_SECRET"]
                        USERS_TABLE = "ai-language-learning-backend-$Stage-users"
                        CONVERSATIONS_TABLE = "ai-language-learning-backend-$Stage-conversations"
                        BEDROCK_MODEL_ID = if ($EnvVars["BEDROCK_MODEL_ID"]) { $EnvVars["BEDROCK_MODEL_ID"] } else { "amazon.nova-pro-v1:0" }
                        BEDROCK_REGION = if ($EnvVars["BEDROCK_REGION"]) { $EnvVars["BEDROCK_REGION"] } else { "us-east-1" }
                        TRANSCRIBE_LANGUAGE_CODE = if ($EnvVars["TRANSCRIBE_LANGUAGE_CODE"]) { $EnvVars["TRANSCRIBE_LANGUAGE_CODE"] } else { "en-US" }
                        TRANSCRIBE_REGION = if ($EnvVars["TRANSCRIBE_REGION"]) { $EnvVars["TRANSCRIBE_REGION"] } else { "ap-southeast-1" }
                        POLLY_VOICE_ID = if ($EnvVars["POLLY_VOICE_ID"]) { $EnvVars["POLLY_VOICE_ID"] } else { "Joanna" }
                        POLLY_REGION = if ($EnvVars["POLLY_REGION"]) { $EnvVars["POLLY_REGION"] } else { "ap-southeast-1" }
                        COMPREHEND_REGION = if ($EnvVars["COMPREHEND_REGION"]) { $EnvVars["COMPREHEND_REGION"] } else { "ap-southeast-1" }
                        TRANSLATE_REGION = if ($EnvVars["TRANSLATE_REGION"]) { $EnvVars["TRANSLATE_REGION"] } else { "ap-southeast-1" }
                        S3_BUCKET_NAME = "ai-language-learning-backend-$Stage-audio-files"
                        S3_REGION = if ($EnvVars["S3_REGION"]) { $EnvVars["S3_REGION"] } else { "ap-southeast-1" }
                    }
                }
                ImageRepositoryType = "ECR"
            }
            AutoDeploymentsEnabled = $true
        }
    } | ConvertTo-Json -Depth 10
    
    $UpdateConfigPath = Join-Path $ScriptDir "apprunner-update-config.json"
    $UpdateConfig | Out-File -FilePath $UpdateConfigPath -Encoding UTF8
    aws apprunner update-service --cli-input-json file://$UpdateConfigPath --region $Region
    Write-Host "App Runner service updated successfully" -ForegroundColor Green
    Remove-Item $UpdateConfigPath
} catch {
    Write-Host "Creating new App Runner service..." -ForegroundColor Yellow
    aws apprunner create-service --cli-input-json file://$ConfigPath --region $Region
    Write-Host "App Runner service created successfully" -ForegroundColor Green
}

# Clean up
Remove-Item $ConfigPath

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your backend will be available at: https://$ServiceName.$AccountId.$Region.awsapprunner.com" -ForegroundColor Cyan

# Wait for service to be ready and show status
Write-Host "Waiting for service to be ready..." -ForegroundColor Yellow
try {
    aws apprunner wait service-deployed --service-arn $ServiceArn --region $Region
    Write-Host "Service is now ready!" -ForegroundColor Green
} catch {
    Write-Host "Service deployment is in progress. Check AWS Console for status." -ForegroundColor Yellow
}

Write-Host "You can monitor your service at: https://console.aws.amazon.com/apprunner/home?region=$Region#/services" -ForegroundColor Cyan
