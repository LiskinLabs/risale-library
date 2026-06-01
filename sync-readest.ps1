$repoPath = "C:\Users\silvestr.liskin\Desktop\risale-ai-studio"
$logFile = "C:\Users\silvestr.liskin\Desktop\risale-ai-studio\sync-log.txt"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp : $Message" | Out-File -FilePath $logFile -Append
}

cd $repoPath
Write-Log "Starting daily sync check..."

try {
    # Fetch from both remotes
    git fetch origin main
    git fetch gitlab main

    $local = git rev-parse HEAD
    $remoteOrigin = git rev-parse origin/main
    $remoteGitlab = git rev-parse gitlab/main

    if ($local -ne $remoteOrigin) {
        Write-Log "New updates found on GitHub. Pulling changes..."
        git pull origin main
        git submodule update --init --recursive
        Write-Log "Sync with GitHub completed."
    } elseif ($local -ne $remoteGitlab) {
        Write-Log "New updates found on GitLab. Pulling changes..."
        git pull gitlab main
        git submodule update --init --recursive
        Write-Log "Sync with GitLab completed."
    } else {
        Write-Log "Already up to date. No action needed."
    }

    # Push to both remotes to keep them in sync
    if ($local -ne $remoteOrigin) {
        git push origin main
        Write-Log "Pushed to GitHub."
    }
    if ($local -ne $remoteGitlab) {
        git push gitlab main
        Write-Log "Pushed to GitLab."
    }

    # Install dependencies and setup vendors
    pnpm install
    cd apps/readest-app
    pnpm setup-vendors
    cd $repoPath
    Write-Log "Sync and install completed successfully."
} catch {
    Write-Log "ERROR during sync: $_"
}
