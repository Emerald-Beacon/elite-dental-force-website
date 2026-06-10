# Renders blog cover art (1200x675) from cover-*.html via headless Chrome.
# Output: images/blog/cover-<slug>.png
# Usage: powershell -File generate-covers.ps1

$root = 'C:\Users\elite\elite-dental-force-website'
$srcDir = Join-Path $root 'images\blog\og-templates\covers'
$outDir = Join-Path $root 'images\blog'
$chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"

Add-Type -AssemblyName System.Drawing

function ConvertTo-Jpeg($pngPath, $jpgPath, $quality) {
  $img = [System.Drawing.Image]::FromFile($pngPath)
  try {
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
    $img.Save($jpgPath, $codec, $params)
  } finally {
    $img.Dispose()
  }
}

Get-ChildItem $srcDir -Filter 'cover-*.html' | ForEach-Object {
  $name = $_.BaseName
  $pngPath = Join-Path $outDir "$name.png"
  $jpgPath = Join-Path $outDir "$name.jpg"
  $url = 'file:///' + ($_.FullName.Replace('\', '/'))
  & $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1200,675 --screenshot="$pngPath" $url 2>$null | Out-Null
  if (Test-Path $pngPath) {
    ConvertTo-Jpeg $pngPath $jpgPath 82
    Remove-Item $pngPath
    $kb = [math]::Round((Get-Item $jpgPath).Length / 1KB)
    Write-Output "$name.jpg OK ($kb KB)"
  } else {
    Write-Output "$name.png FAILED"
  }
}
