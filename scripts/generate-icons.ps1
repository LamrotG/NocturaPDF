Add-Type -AssemblyName System.Drawing

$source = Resolve-Path 'build\icon.png'
$outDir = Resolve-Path 'public\icons'

$img = [System.Drawing.Image]::FromFile($source)
Write-Host "Source: $($img.Width)x$($img.Height)"

function Resize-Icon($src, $outPath, $size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src, 0, 0, $size, $size)
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Host "Wrote: $outPath"
}

# Standard icons
Resize-Icon $img (Join-Path $outDir 'icon-192.png') 192
Resize-Icon $img (Join-Path $outDir 'icon-512.png') 512

# Maskable icon: draw the icon scaled to 80% on a solid background so it
# sits within the safe zone (70-80% of the canvas) required by maskable.
function New-MaskableIcon($src, $outPath, $size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 22, 23, 29)) # #16171d
  $pad = [int]($size * 0.1)
  $innerSize = $size - (2 * $pad)
  $g.DrawImage($src, $pad, $pad, $innerSize, $innerSize)
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Host "Wrote: $outPath"
}

New-MaskableIcon $img (Join-Path $outDir 'icon-512-maskable.png') 512

$img.Dispose()
Write-Host 'Done.'