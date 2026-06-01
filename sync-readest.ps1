$repoPath = "C:\Users\silvestr.liskin\Desktop\Readest-source"
$logFile = "C:\Users\silvestr.liskin\Desktop\Readest-source\sync-log.txt"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp : $Message" | Out-File -FilePath $logFile -Append
}

cd $repoPath
Write-Log "Starting daily sync check..."

try {
    git fetch origin main
    $local = git rev-parse HEAD
    $remote = git rev-parse origin/main

    if ($local -ne $remote) {
        Write-Log "New updates found. Pulling changes..."
        git pull origin main
        git submodule update --init --recursive
        pnpm install
        cd apps/readest-app
        pnpm setup-vendors
        Write-Log "Sync and install completed successfully."
    } else {
        Write-Log "Already up to date. No action needed."
    }
} catch {
    Write-Log "ERROR during sync: $_"
}
