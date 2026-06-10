#!/usr/bin/env pwsh
# Backup script for Nuvix PostgreSQL database
# Usage: .\scripts\backup.ps1 [-OutputDir ".\backups"] [-KeepDays 30]
# Requires: pg_dump (PostgreSQL client tools)

param(
  [string]$OutputDir = ".\backups",
  [int]$KeepDays = 30
)

$EnvFile = ".env"
if (-not (Test-Path $EnvFile)) {
  Write-Error "Arquivo .env não encontrado. Execute o script da raiz do projeto."
  exit 1
}

# Read DATABASE_URL from .env
$DbUrl = (Select-String -Path $EnvFile -Pattern "^DATABASE_URL=").Line -replace "^DATABASE_URL=", ""
if (-not $DbUrl) {
  Write-Error "DATABASE_URL não encontrada no .env"
  exit 1
}

# Parse URL (postgresql://user:pass@host:port/db)
$Uri = [System.Uri]$DbUrl
$User = $Uri.UserInfo -replace ":.*$", ""
$Pass = $Uri.UserInfo -replace "^.*:", ""
$Hostname = $Uri.Host
$Port = $Uri.Port
$Db = $Uri.AbsolutePath -replace "^/", ""

# Create output directory
if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$Filename = "nuvix_backup_$Timestamp.sql.gz"
$Filepath = Join-Path $OutputDir $Filename

Write-Host "=== Nuvix Database Backup ===" -ForegroundColor Cyan
Write-Host "Banco: $Db em $Hostname`:$Port"
Write-Host "Arquivo: $Filepath"
Write-Host ""

# Set password env var for pg_dump
$env:PGPASSWORD = $Pass

# Run pg_dump with compression
Write-Host "Executando pg_dump..." -ForegroundColor Yellow
$DumpArgs = @(
  "--host=$Hostname"
  "--port=$Port"
  "--username=$User"
  "--dbname=$Db"
  "--no-owner"
  "--no-acl"
  "--format=custom"
  "--compress=9"
  "--file=$Filepath"
)

$Process = Start-Process -FilePath "pg_dump" -ArgumentList $DumpArgs -NoNewWindow -Wait -PassThru

if ($Process.ExitCode -ne 0) {
  Write-Error "pg_dump falhou com código $($Process.ExitCode)."
  Write-Host "Certifique-se de ter o pg_dump instalado (PostgreSQL client tools)." -ForegroundColor Red
  Remove-Item $Filepath -ErrorAction SilentlyContinue
  exit 1
}

# Verify file
$FileInfo = Get-Item $Filepath
$SizeMB = [Math]::Round($FileInfo.Length / 1MB, 2)
Write-Host "Backup concluído: $SizeMB MB" -ForegroundColor Green

# Remove old backups
Write-Host ""
Write-Host "Removendo backups mais antigos que $KeepDays dias..." -ForegroundColor Yellow
$Cutoff = (Get-Date).AddDays(-$KeepDays)
$OldFiles = Get-ChildItem $OutputDir -Filter "nuvix_backup_*.sql.gz" | Where-Object { $_.CreationTime -lt $Cutoff }

foreach ($OldFile in $OldFiles) {
  Remove-Item $OldFile.FullName -Force
  Write-Host "  Removido: $($OldFile.Name)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Backup finalizado com sucesso!" -ForegroundColor Green
Write-Host "Arquivo: $Filepath ($SizeMB MB)"
Write-Host "Total de backups: $(@(Get-ChildItem $OutputDir -Filter "nuvix_backup_*.sql.gz").Count)"
