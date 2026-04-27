# list-firebase-files.ps1
# Lists files from Firebase Storage / Google Cloud Storage bucket.
# Requires Google Cloud CLI:
#   https://cloud.google.com/sdk/docs/install
#
# Login first:
#   gcloud auth login
#   gcloud config set project trendzact-partners-001

$Bucket = "gs://trendzact-partners-001.firebasestorage.app"
$OutputFile = "firebase-storage-files.csv"

Write-Host "Listing files from $Bucket ..."

# Get recursive file list
$files = gcloud storage ls --recursive $Bucket 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to list bucket files."
    Write-Host $files
    exit 1
}

# Convert to objects
$results = $files |
    Where-Object {
        $_ -and
        $_.Trim() -ne "" -and
        $_ -notmatch "/$"
    } |
    ForEach-Object {
        $fullPath = $_.Trim()

        $relativePath = $fullPath -replace [regex]::Escape("$Bucket/"), ""

        $folder = ""
        $fileName = $relativePath

        if ($relativePath -match "/") {
            $folder = Split-Path $relativePath -Parent
            $fileName = Split-Path $relativePath -Leaf
        }

        $extension = [System.IO.Path]::GetExtension($fileName)

        [PSCustomObject]@{
            BucketPath   = $fullPath
            RelativePath = $relativePath
            Folder       = $folder
            FileName     = $fileName
            Extension    = $extension
        }
    }

# Display
$results | Format-Table -AutoSize

# Export CSV
$results | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "Done. File list exported to:"
Write-Host $OutputFile