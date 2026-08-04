param(
    [string]$DatabaseURL = $env:TEST_DATABASE_URL,
    [string]$PsqlPath = 'C:\Program Files\PostgreSQL\17\bin\psql.exe',
    [int]$APIPort = 18081
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($DatabaseURL)) {
    throw 'DatabaseURL or TEST_DATABASE_URL is required'
}
if (-not (Test-Path -LiteralPath $PsqlPath)) {
    throw "psql was not found at $PsqlPath"
}

$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$runtime = Join-Path $tempRoot ("avitosha-pet-smoke-" + [guid]::NewGuid().ToString('N'))
$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$binary = Join-Path $runtime 'avitosha-api.exe'
$stdout = Join-Path $runtime 'stdout.log'
$stderr = Join-Path $runtime 'stderr.log'
$process = $null
$expectedPetName = [Text.Encoding]::UTF8.GetString(
    [Convert]::FromBase64String('0JDQstC40YLQvtGI0LA=')
)

New-Item -ItemType Directory -Path $runtime | Out-Null

try {
    $env:DATABASE_URL = $DatabaseURL
    $env:APP_ENV = 'test'
    $env:HTTP_ADDR = "127.0.0.1:$APIPort"
    $env:FRONTEND_ORIGIN = 'http://localhost:3000'
    $env:JWT_SIGNING_KEY = 'integration-smoke-signing-key'
    $env:JWT_ISSUER = 'avitosha-smoke'
    $env:JWT_AUDIENCE = 'avitosha-web-smoke'
    $env:LOG_LEVEL = 'info'

    Push-Location $backendRoot
    try {
        go build -o $binary ./cmd/api
        if ($LASTEXITCODE -ne 0) {
            throw 'API build failed'
        }
    }
    finally {
        Pop-Location
    }

    $process = Start-Process -FilePath $binary `
        -WorkingDirectory $backendRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -PassThru

    $baseURL = "http://127.0.0.1:$APIPort"
    $ready = $null
    $deadline = (Get-Date).AddSeconds(20)
    while ((Get-Date) -lt $deadline) {
        if ($process.HasExited) {
            $errorLog = Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue
            throw "API exited before readiness: $errorLog"
        }
        try {
            $ready = Invoke-RestMethod -Method Get -Uri "$baseURL/health/ready" -TimeoutSec 2
        }
        catch {
            $ready = $null
        }
        if ($null -ne $ready -and $ready.status -eq 'ok') {
            break
        }
        Start-Sleep -Milliseconds 200
    }
    if ($null -eq $ready -or $ready.status -ne 'ok') {
        throw 'API readiness timeout'
    }

    $email = "pet-smoke-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.com"
    $credentials = @{ email = $email; password = 'password123' } | ConvertTo-Json
    $registration = Invoke-RestMethod -Method Post `
        -Uri "$baseURL/api/auth/register" `
        -ContentType 'application/json' `
        -Body $credentials
    $headers = @{ Authorization = "Bearer $($registration.access_token)" }
    $snapshot = Invoke-RestMethod -Method Get -Uri "$baseURL/api/pet" -Headers $headers

    $userID = $registration.user.id
    $petID = $snapshot.data.pet.id
    $itemIDs = @(
        [guid]::NewGuid().ToString(),
        [guid]::NewGuid().ToString(),
        [guid]::NewGuid().ToString()
    )
    $sourceIDs = @(
        [guid]::NewGuid().ToString(),
        [guid]::NewGuid().ToString(),
        [guid]::NewGuid().ToString()
    )
    $seedItems = @"
INSERT INTO inventory_items (id, user_id, item_type, status, source_type, source_id, idempotency_key)
VALUES
    ('$($itemIDs[0])', '$userID', 'FOOD', 'AVAILABLE', 'SMOKE', '$($sourceIDs[0])', 'smoke-food-$userID'),
    ('$($itemIDs[1])', '$userID', 'TOY',  'AVAILABLE', 'SMOKE', '$($sourceIDs[1])', 'smoke-toy-$userID'),
    ('$($itemIDs[2])', '$userID', 'BOOK', 'AVAILABLE', 'SMOKE', '$($sourceIDs[2])', 'smoke-book-$userID');
"@
    & $PsqlPath $DatabaseURL -v ON_ERROR_STOP=1 -c $seedItems | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Inventory seed failed'
    }

    $careResult = $null
    foreach ($itemID in $itemIDs) {
        $careResult = Invoke-RestMethod -Method Post `
            -Uri "$baseURL/api/pet/items/$itemID/use" `
            -Headers $headers
    }

    $yesterday = [DateTime]::UtcNow.Date.AddDays(-1).ToString('yyyy-MM-dd')
    $dailyID = [guid]::NewGuid().ToString()
    $seedPreviousDay = @"
INSERT INTO pet_daily_states
    (id, pet_id, date, satiety, mood, curiosity, state, happy_xp_granted, ecstatic_xp_granted, starting_growth_xp)
VALUES
    ('$dailyID', '$petID', '$yesterday', 90, 90, 50, 'HAPPY', TRUE, FALSE, 80);
"@
    & $PsqlPath $DatabaseURL -v ON_ERROR_STOP=1 -c $seedPreviousDay | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Previous-day seed failed'
    }
    $summary = Invoke-RestMethod -Method Get `
        -Uri "$baseURL/api/pet/daily-summary" `
        -Headers $headers

    if ($snapshot.data.pet.name -ne $expectedPetName) {
        throw "Unexpected pet name: $($snapshot.data.pet.name)"
    }
    if ($careResult.data.daily_state.state -ne 'ECSTATIC' -or $careResult.data.pet.growth_xp -ne 40) {
        throw "Unexpected final care result: $($careResult | ConvertTo-Json -Depth 8 -Compress)"
    }
    if ($summary.data.ending_state -ne 'HAPPY' -or $summary.data.earned_growth_xp -ne 30) {
        throw "Unexpected summary: $($summary | ConvertTo-Json -Depth 8 -Compress)"
    }

    [pscustomobject]@{
        Ready              = $ready.status
        PetName            = $snapshot.data.pet.name
        FinalState         = $careResult.data.daily_state.state
        GrowthXP           = $careResult.data.pet.growth_xp
        ItemsUsed          = $itemIDs.Count
        SummaryDate        = $summary.data.date
        SummaryEndingState = $summary.data.ending_state
        SummaryEarnedXP    = $summary.data.earned_growth_xp
    }
}
finally {
    if ($null -ne $process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
        if (-not $process.WaitForExit(5000)) {
            throw "API process $($process.Id) did not exit during cleanup"
        }
    }
    if (Test-Path -LiteralPath $runtime) {
        $resolvedRuntime = (Resolve-Path -LiteralPath $runtime).Path
        if (-not $resolvedRuntime.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -or
            -not (Split-Path $resolvedRuntime -Leaf).StartsWith('avitosha-pet-smoke-')) {
            throw "Refusing to remove unexpected runtime directory: $resolvedRuntime"
        }
        Remove-Item -LiteralPath $resolvedRuntime -Recurse -Force
    }
}
