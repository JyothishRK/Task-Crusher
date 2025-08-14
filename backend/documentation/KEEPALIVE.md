# Service Keepalive Setup Guide

## Overview
This guide explains how to configure the service keepalive system that prevents your Render free tier service from spinning down due to inactivity.

## Components
- **Health API Endpoint**: `/health` - Lightweight endpoint that responds with service status
- **GitHub Actions Workflow**: Automatically pings the health endpoint every 2 minutes

## Setup Instructions

### 1. Repository Secret Configuration
You need to add your production service URL as a repository secret:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SERVICE_URL`
5. Value: Your Render service URL (e.g., `https://your-app-name.onrender.com`)

### 2. Workflow Configuration
The workflow is already configured in `.github/workflows/keepalive.yml` with:
- **Schedule**: Every 2 minutes (`*/2 * * * *`)
- **Manual trigger**: Available for testing
- **Error handling**: Continues running even if requests fail
- **Detailed logging**: Shows success/failure status and response times

### 3. Testing the Setup

#### Test Health Endpoint Locally
```bash
# Start your server
npm run dev

# Test health endpoint
curl http://localhost:3000/health
```

#### Test GitHub Actions Workflow
1. Push your changes to GitHub
2. Go to **Actions** tab in your repository
3. Find "Service Keepalive" workflow
4. Click **Run workflow** to test manually
5. Check the logs to verify it's working

### 4. Monitoring
- Check GitHub Actions logs for workflow execution status
- Health endpoint logs appear in your server console
- Workflow runs every 2 minutes automatically once configured#
# Customization Options

### Adjusting Ping Frequency
To change the ping frequency, edit `.github/workflows/keepalive.yml`:
```yaml
schedule:
  # Change this cron expression (currently every 2 minutes)
  - cron: '*/2 * * * *'
```

Common cron patterns:
- Every minute: `* * * * *`
- Every 5 minutes: `*/5 * * * *`
- Every 10 minutes: `*/10 * * * *`

### Environment Variables
- `SERVICE_URL`: Your production service URL (required)
- Fallback: `http://localhost:3000` (for testing)

## Troubleshooting

### Workflow Not Running
- Ensure repository secret `SERVICE_URL` is set correctly
- Check if workflow file is in `.github/workflows/` directory
- Verify cron syntax is correct

### Health Endpoint Issues
- Test endpoint locally: `curl http://localhost:3000/health`
- Check server logs for errors
- Verify health router is properly integrated

### Service Still Spinning Down
- Confirm workflow is running every 2 minutes in Actions tab
- Check workflow logs for failed requests
- Verify SERVICE_URL points to correct Render service

## Health Endpoint Response Format
```json
{
  "status": "ok",
  "timestamp": "2025-01-13T10:30:00.000Z",
  "uptime": 3600.5,
  "service": "task-app"
}
```

## Running Tests
```bash
# Run health endpoint tests
npm test
```

The tests verify:
- Correct HTTP status codes
- JSON response format
- Response time under 100ms
- Proper error handling
- Content-Type headers