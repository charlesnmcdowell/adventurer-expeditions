$ErrorActionPreference = 'Stop'
$cleanupRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$reportRoot = Join-Path $cleanupRoot 'docs/cleanup-audit-20261017'
$cleanupPlan = Get-Content -LiteralPath (Join-Path $reportRoot 'safe-cleanup-plan.json') -Raw | ConvertFrom-Json
$ledgerPath = Join-Path $reportRoot 'cleanup-removals.jsonl'
$trackedPaths = @{}
git -C $cleanupRoot ls-files | ForEach-Object { $trackedPaths[$_] = $true }
foreach ($entry in $cleanupPlan.files) {
    $relative = [string]$entry.path
    if (($relative.Split('/') -contains '..') -or $relative.Contains('\') -or $relative.Contains(':')) { throw 'Noncanonical relative path refused' }
    if ($relative -notmatch '^(dist/site-demo/|dist/site-demo-verified\.json$|test/reports/|tools/.*/?__pycache__/|tools/__pycache__/)') { throw "Outside allowed cleanup outputs: $relative" }
    $target = [IO.Path]::GetFullPath((Join-Path $cleanupRoot $relative))
    if (-not $target.StartsWith($cleanupRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Target escaped project' }
    if ($trackedPaths.ContainsKey($relative)) { throw "Tracked output must be retained: $relative" }
    git -C $cleanupRoot check-ignore -q -- $relative
    if ($LASTEXITCODE -ne 0) { throw "Output is not ignored: $relative" }
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { continue }
    $namedStreams = @(Get-Item -LiteralPath $target -Stream '*' | Where-Object { $_.Stream -ne ':$DATA' })
    if ($namedStreams.Count -gt 0) { Write-Warning "Named streams present; retained: $relative"; continue }
    $ancestor = Get-Item -LiteralPath $target
    while ($ancestor -and $ancestor.FullName -ne $cleanupRoot) {
        if ($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked path refused: $relative" }
        $ancestor = if ($ancestor.PSIsContainer) { $ancestor.Parent } else { $ancestor.Directory }
    }
    $hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $entry.sha256) { Write-Warning "Changed since inventory; retained: $relative"; continue }
    if ($entry.keeper) {
        $keeper = [IO.Path]::GetFullPath((Join-Path $cleanupRoot $entry.keeper))
        if (-not $keeper.StartsWith($cleanupRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Keeper escaped project' }
        if (-not (Test-Path -LiteralPath $keeper -PathType Leaf)) { throw "Duplicate keeper is absent: $relative" }
        if ((Get-FileHash -LiteralPath $keeper -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hash) { throw "Duplicate keeper differs: $relative" }
    }
    # Individual file deletion only, after absolute-path, link, tracking,
    # ignore and content checks. No recursive delete and no cross-shell move.
    Remove-Item -LiteralPath $target
    $entry | ConvertTo-Json -Compress | Add-Content -LiteralPath $ledgerPath -Encoding utf8
}
Write-Output 'Safe cleanup complete; exact file ledger saved.'
