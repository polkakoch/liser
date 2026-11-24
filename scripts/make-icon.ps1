# Рисует иконку приложения и собирает build/icon.ico, assets/icon.png, assets/tray.png
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
New-Item -ItemType Directory -Force "$root\build", "$root\assets", "$root\src\renderer\img" | Out-Null

function New-IconBitmap([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  $g.Clear([System.Drawing.Color]::Transparent)
  $s = $size / 256.0
  $m = 10 * $s; $w = $size - 2 * $m; $r = 54 * $s; $d = 2 * $r
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($m, $m, $d, $d, 180, 90)
  $path.AddArc($m + $w - $d, $m, $d, $d, 270, 90)
  $path.AddArc($m + $w - $d, $m + $w - $d, $d, $d, 0, 90)
  $path.AddArc($m, $m + $w - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 47, 46, 43))
  $g.FillPath($bg, $path)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 250, 250, 248)), (30 * $s)
  $pen.StartCap = 'Round'; $pen.EndCap = 'Round'; $pen.LineJoin = 'Round'
  $pts = @(
    (New-Object System.Drawing.PointF (92 * $s), (70 * $s)),
    (New-Object System.Drawing.PointF (92 * $s), (184 * $s)),
    (New-Object System.Drawing.PointF (172 * $s), (184 * $s))
  )
  $g.DrawLines($pen, [System.Drawing.PointF[]]$pts)
  $dot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 235, 124, 60))
  $g.FillEllipse($dot, 146 * $s, 58 * $s, 42 * $s, 42 * $s)
  $g.Dispose()
  return $bmp
}

function Get-PngBytes($bmp) {
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  return ,$ms.ToArray()
}

$sizes = 16, 24, 32, 48, 64, 128, 256
$pngs = @{}
foreach ($sz in $sizes) { $pngs[$sz] = Get-PngBytes (New-IconBitmap $sz) }

[System.IO.File]::WriteAllBytes("$root\assets\icon.png", (Get-PngBytes (New-IconBitmap 256)))
[System.IO.File]::WriteAllBytes("$root\assets\tray.png", (Get-PngBytes (New-IconBitmap 32)))
[System.IO.File]::WriteAllBytes("$root\build\icon.png", (Get-PngBytes (New-IconBitmap 512)))
[System.IO.File]::WriteAllBytes("$root\src\renderer\img\icon.png", (Get-PngBytes (New-IconBitmap 144)))

$fs = [System.IO.File]::Create("$root\build\icon.ico")
$bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
foreach ($sz in $sizes) {
  $b = if ($sz -ge 256) { 0 } else { $sz }
  $bw.Write([byte]$b); $bw.Write([byte]$b); $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([uint16]1); $bw.Write([uint16]32)
  $bw.Write([uint32]$pngs[$sz].Length); $bw.Write([uint32]$offset)
  $offset += $pngs[$sz].Length
}
foreach ($sz in $sizes) { $bw.Write([byte[]]$pngs[$sz]) }
$bw.Close(); $fs.Close()
"icons written"
