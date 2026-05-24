#requires -Version 5
<#
.SYNOPSIS
  Build + deploy AI Recruitment Agent to GCP Cloud Run from Windows.
.EXAMPLE
  ./scripts/gcp-deploy.ps1 ai-recruitment-agent-496912
#>
param(
  [Parameter(Mandatory)][string] $ProjectId,
  [string] $Region = 'us-central1',
  [string] $SqlConnection = ''
)

$ErrorActionPreference = 'Stop'

if (-not $SqlConnection) {
  $SqlConnection = (gcloud sql instances describe agent-db --project=$ProjectId --format='value(connectionName)' 2>$null)
  if (-not $SqlConnection) { throw "Couldn't auto-discover Cloud SQL connection. Pass -SqlConnection explicitly." }
}

Write-Host "Deploying to project=$ProjectId region=$Region sql=$SqlConnection..." -ForegroundColor Cyan

gcloud builds submit `
  --project=$ProjectId `
  --config=cloudbuild.yaml `
  --substitutions="_REGION=$Region,_CLOUDSQL_CONN=$SqlConnection" `
  .

$url = gcloud run services describe ai-recruitment-agent `
  --project=$ProjectId --region=$Region --format='value(status.url)'

Write-Host ""
Write-Host "Deployed: $url"   -ForegroundColor Green
Write-Host "Health  : $url/api/health"
Write-Host "Admin   : $url/admin"
