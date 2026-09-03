# Setup-Script: Erstellt das GitHub-Repo und pusht die Dateien
param(
    [string]$GitHubUser = "georgeskhouriberlin-66",
    [string]$RepoName = "television"
)

$ErrorActionPreference = "Stop"

# gh in den PATH aufnehmen
$env:Path += ";C:\Program Files\GitHub CLI"

# Prüfen ob gh authentifiziert ist
$status = & "gh" auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ GitHub CLI nicht authentifiziert. Bitte anmelden:" -ForegroundColor Red
    Write-Host "   gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Erstelle Repository $GitHubUser/$RepoName ..."
& "gh" repo create "$GitHubUser/$RepoName" --public --description "Ultimate IPTV Automation – Automatisch generierte IPTV-Playlisten" --remote origin --push --source .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Repository erstellt und Push erfolgreich!" -ForegroundColor Green
    Write-Host "🌐 https://github.com/$GitHubUser/$RepoName" -ForegroundColor Cyan
} else {
    # Push zu existierendem Repo
    Write-Host "⚠️ Repo existiert womöglich bereits, versuche Push..." -ForegroundColor Yellow
    git remote add origin "https://github.com/$GitHubUser/$RepoName.git" 2>$null
    git push -u origin main
}

Write-Host ""
Write-Host "📋 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "   1. GitHub Actions aktivieren: https://github.com/$GitHubUser/$RepoName/actions"
Write-Host "   2. Workflow manuell triggern: Actions > Update IPTV Playlists > Run workflow"
Write-Host "   3. Playlisten-URLs:"
$files = @("arabic", "gulf", "usa", "eastblock", "germany")
foreach ($f in $files) {
    $url = "https://raw.githubusercontent.com/$GitHubUser/$RepoName/main/$f.m3u"
    Write-Host "      $f.m3u → $url" -ForegroundColor Gray
}
