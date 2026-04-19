<#
.SYNOPSIS
  Project-scoped installer for the red-team pack.

.DESCRIPTION
  Copies agents and skills into ./.claude/ so the pack is available only in
  this project, not at user level. Optionally copies one stack adapter.

.EXAMPLE
  cd your-project
  iwr -useb https://raw.githubusercontent.com/inanded/red-team/main/scripts/install.ps1 | iex

.EXAMPLE
  # From a local clone:
  pwsh C:\path\to\red-team\scripts\install.ps1 -Adapter supabase-stripe-nextjs

.PARAMETER Adapter
  Stack adapter slug to also copy. Valid slugs: supabase-stripe-nextjs,
  auth0-postgres, clerk-prisma, firebase, aws-cognito-dynamodb, paddle,
  mongodb-mongoose.

.PARAMETER Source
  Install from a local clone of the repo instead of fetching from GitHub.

.PARAMETER Ref
  Branch or tag to install from (default: main).
#>

[CmdletBinding()]
param(
  [string] $Adapter = "",
  [string] $Source = "",
  [string] $Ref = "main"
)

$ErrorActionPreference = "Stop"

$RepoUrl = if ($env:RED_TEAM_REPO_URL) { $env:RED_TEAM_REPO_URL } else { "https://github.com/inanded/red-team" }
if ($env:RED_TEAM_REF) { $Ref = $env:RED_TEAM_REF }

if (-not (Test-Path -Path "." -PathType Container)) {
  throw "current directory not found"
}

# Acquire a source tree.
$CleanupTmp = $null
if ($Source) {
  if (-not (Test-Path "$Source/agents/red-team") -or -not (Test-Path "$Source/skills")) {
    throw "--Source $Source does not look like a red-team clone"
  }
  $Src = $Source
} else {
  $Tmp = Join-Path $env:TEMP ("red-team-install-" + [System.Guid]::NewGuid())
  New-Item -ItemType Directory -Path $Tmp | Out-Null
  $CleanupTmp = $Tmp
  Write-Host "fetching red-team@$Ref from $RepoUrl..."
  if (Get-Command git -ErrorAction SilentlyContinue) {
    & git clone --depth 1 --branch $Ref $RepoUrl (Join-Path $Tmp "red-team") 2>&1 | Out-Null
    $Src = Join-Path $Tmp "red-team"
  } else {
    $Tarball = "$RepoUrl/archive/$Ref.zip"
    $Zip = Join-Path $Tmp "red-team.zip"
    Invoke-WebRequest -Uri $Tarball -OutFile $Zip
    Expand-Archive -Path $Zip -DestinationPath $Tmp
    $Src = Get-ChildItem -Path $Tmp -Directory | Where-Object { $_.Name -like "red-team-*" } | Select-Object -First 1 -ExpandProperty FullName
  }
}

# Prepare destination.
New-Item -ItemType Directory -Path ".claude/agents/red-team" -Force | Out-Null
New-Item -ItemType Directory -Path ".claude/skills" -Force | Out-Null

Write-Host "copying agents -> .claude/agents/"
Copy-Item -Force "$Src/agents/red-team-coordinator.md" ".claude/agents/"
Copy-Item -Force "$Src/agents/recon-scout.md"          ".claude/agents/"
Copy-Item -Force -Recurse "$Src/agents/red-team/*"     ".claude/agents/red-team/"

Write-Host "copying skills -> .claude/skills/"
$Skills = @(
  "attack-hypothesis", "severity-scoring", "effort-estimation",
  "confirmed-safe-tracking", "threat-modeling", "exploit-chain-mapping",
  "attack-surface-discovery"
)
foreach ($s in $Skills) {
  New-Item -ItemType Directory -Path ".claude/skills/$s" -Force | Out-Null
  Copy-Item -Force "$Src/skills/$s/SKILL.md" ".claude/skills/$s/SKILL.md"
}

# Optional adapter.
if ($Adapter) {
  $AdapterSrc = "$Src/adapters/$Adapter"
  if (-not (Test-Path $AdapterSrc)) {
    Write-Warning "adapter '$Adapter' not found; skipping"
  } else {
    Write-Host "copying adapter '$Adapter' -> .claude/red-team-adapters/$Adapter/"
    New-Item -ItemType Directory -Path ".claude/red-team-adapters" -Force | Out-Null
    $Dest = ".claude/red-team-adapters/$Adapter"
    if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
    Copy-Item -Recurse $AdapterSrc $Dest
  }
}

# Clean up.
if ($CleanupTmp) { Remove-Item -Recurse -Force $CleanupTmp }

Write-Host ""
Write-Host "installed. project-scoped — nothing written outside $((Get-Location).Path)\.claude\"
Write-Host ""
Write-Host "next steps:"
Write-Host "  1. open this project in claude code"
Write-Host "  2. run the coordinator:"
Write-Host ""
Write-Host "       > run the red-team-coordinator against this project"
Write-Host ""
Write-Host "  the consolidated report will be written to docs/red-team-<date>.md"
Write-Host "  and per-persona reports under docs/red-team-<date>/."
Write-Host ""
Write-Host "uninstall: remove .claude/agents/red-team-coordinator.md, .claude/agents/recon-scout.md, .claude/agents/red-team, .claude/skills, .claude/red-team-adapters"
