# Composites curated photos (covers/photos/<slug>.jpg) with the EDF cinematic
# grade from _photo-template.html, rendering images/blog/photo-<slug>.jpg (1200x675).
# Usage: powershell -File generate-photo-covers.ps1

$root = 'C:\Users\elite\elite-dental-force-website'
$srcDir = Join-Path $root 'images\blog\og-templates\covers'
$photoDir = Join-Path $srcDir 'photos'
$outDir = Join-Path $root 'images\blog'
$chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
$tpl = Get-Content (Join-Path $srcDir '_photo-template.html') -Raw

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

$tmpHtml = Join-Path $srcDir '_photo-render-tmp.html'
$tmpUrl = 'file:///' + ($tmpHtml.Replace('\', '/'))

$defaultFilter = 'saturate(1.1) contrast(1.06) brightness(0.96)'
$filterOverrides = @{
  'claim-denials' = 'saturate(1.1) contrast(1.02) brightness(1.45)'
  'ai-computing'  = 'saturate(1.1) contrast(1.04) brightness(1.15)'
  'data-blocks'   = 'saturate(1.05) contrast(1.04) brightness(1.2)'
  'dental-crisis' = 'saturate(0.9) contrast(1.04) brightness(1.1)'
}

Get-ChildItem $photoDir -Filter '*.jpg' | ForEach-Object {
  $slug = $_.BaseName
  $imgUrl = 'photos/' + $_.Name
  $filter = if ($filterOverrides.ContainsKey($slug)) { $filterOverrides[$slug] } else { $defaultFilter }
  $html = $tpl.Replace('{{IMG}}', $imgUrl).Replace('{{FILTER}}', $filter)
  Set-Content $tmpHtml $html -NoNewline -Encoding UTF8
  $pngPath = Join-Path $outDir "photo-$slug.png"
  $jpgPath = Join-Path $outDir "photo-$slug.jpg"
  & $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1200,675 --screenshot="$pngPath" $tmpUrl 2>$null | Out-Null
  if (Test-Path $pngPath) {
    ConvertTo-Jpeg $pngPath $jpgPath 85
    Remove-Item $pngPath
    $kb = [math]::Round((Get-Item $jpgPath).Length / 1KB)
    Write-Output "photo-$slug.jpg OK ($kb KB)"
  } else {
    Write-Output "photo-$slug FAILED"
  }
}

if (Test-Path $tmpHtml) { Remove-Item $tmpHtml }
