$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outputDir = "c:\Users\baodh\OneDrive\Desktop\Projects\SpendWise\screenshots"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$targets = @(
    @{ name="home-desktop"; url="http://localhost:4173/"; size="1280,800" },
    @{ name="home-mobile"; url="http://localhost:4173/"; size="390,844" },
    @{ name="login-desktop"; url="http://localhost:4173/login"; size="1280,800" },
    @{ name="login-mobile"; url="http://localhost:4173/login"; size="390,844" },
    @{ name="signup-desktop"; url="http://localhost:4173/signup"; size="1280,800" },
    @{ name="signup-mobile"; url="http://localhost:4173/signup"; size="390,844" },
    @{ name="dashboard-desktop"; url="http://localhost:4173/dashboard"; size="1280,800" },
    @{ name="dashboard-mobile"; url="http://localhost:4173/dashboard"; size="390,844" },
    @{ name="investments-desktop"; url="http://localhost:4173/investments"; size="1280,800" },
    @{ name="investments-mobile"; url="http://localhost:4173/investments"; size="390,844" },
    @{ name="analytics-desktop"; url="http://localhost:4173/analytics"; size="1280,800" },
    @{ name="analytics-mobile"; url="http://localhost:4173/analytics"; size="390,844" }
)

foreach ($t in $targets) {
    $outFile = "$outputDir\$($t.name).png"
    $tempProfile = "$env:TEMP\ch_snap_$($t.name)"
    Write-Host "Capturing $($t.name)..."
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--user-data-dir=$tempProfile", "--window-size=$($t.size)", "--screenshot=$outFile", "$($t.url)" -Wait
    if (Test-Path $outFile) {
        $size = (Get-Item $outFile).Length / 1KB
        Write-Host "  -> Captured $outFile ($([math]::Round($size, 1)) KB)"
    } else {
        Write-Warning "  -> Failed to capture $($t.name)"
    }
    Remove-Item -Recurse -Force $tempProfile -ErrorAction SilentlyContinue
}

Write-Host "All screenshots captured."

