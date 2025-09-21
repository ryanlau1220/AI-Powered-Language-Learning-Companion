# AWS App Runner Setup Script for Windows PowerShell
param(
    [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir

Write-Host "Setting up AWS App Runner deployment environment..." -ForegroundColor Green

# Check if .env file exists
$EnvPath = Join-Path $BackendDir $EnvFile
if (-not (Test-Path $EnvPath)) {
    Write-Host "Creating .env file from env.example..." -ForegroundColor Yellow
    $ExamplePath = Join-Path $BackendDir "env.example"
    if (Test-Path $ExamplePath) {
        Copy-Item $ExamplePath $EnvPath
        Write-Host ".env file created! Please edit it with your AWS credentials and configuration." -ForegroundColor Green
        Write-Host "Required variables to update in .env:" -ForegroundColor Cyan
        Write-Host "   - AWS_ACCESS_KEY_ID" -ForegroundColor White
        Write-Host "   - AWS_SECRET_ACCESS_KEY" -ForegroundColor White
        Write-Host "   - JWT_SECRET" -ForegroundColor White
        Write-Host "   - AWS_ACCOUNT_ID (your AWS account ID)" -ForegroundColor White
        Write-Host ""
        Write-Host "You can get your AWS Account ID by running:" -ForegroundColor Cyan
        Write-Host "   aws sts get-caller-identity --query Account --output text" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter to continue after updating your .env file"
    } else {
        Write-Host "env.example file not found!" -ForegroundColor Red
        exit 1
    }
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Visit: https://docs.docker.com/get-docker/" -ForegroundColor Cyan
    exit 1
}

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI is not installed. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" -ForegroundColor Cyan
    exit 1
}

# Check AWS CLI configuration
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "AWS CLI is properly configured" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI is not configured or credentials are invalid." -ForegroundColor Red
    Write-Host "Please run: aws configure" -ForegroundColor Cyan
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
        Write-Host "Please update your .env file with the missing variable." -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "All required environment variables are set" -ForegroundColor Green

# Test Docker build (optional - Docker Desktop might not be running)
Write-Host "Testing Docker build..." -ForegroundColor Yellow
Set-Location $BackendDir
try {
    docker build -t ai-language-learning-backend-test . 2>&1 | Out-Null
    Write-Host "Docker build test successful" -ForegroundColor Green
    
    # Clean up test image
    docker rmi ai-language-learning-backend-test 2>&1 | Out-Null
} catch {
    Write-Host "Docker build test skipped (Docker Desktop might not be running)" -ForegroundColor Yellow
    Write-Host "Make sure Docker Desktop is running before deployment" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your .env file has all required variables" -ForegroundColor White
Write-Host "2. Run deployment with: npm run deploy:apprunner" -ForegroundColor White
Write-Host "3. Or for production: npm run deploy:apprunner:prod" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   - Test locally: npm run docker:run" -ForegroundColor White
Write-Host "   - Build Docker image: npm run docker:build" -ForegroundColor White
Write-Host "   - Deploy to dev: npm run deploy:apprunner" -ForegroundColor White
Write-Host "   - Deploy to prod: npm run deploy:apprunner:prod" -ForegroundColor White
