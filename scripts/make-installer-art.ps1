# Рисует картинки установщика: боковую панель (164×314) и шапку (150×57) в формате BMP.
# Запуск: powershell -ExecutionPolicy Bypass -File scripts/make-installer-art.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path $root 'build'
$icon = [System.Drawing.Image]::FromFile((Join-Path $build 'icon.png'))

function New-Canvas($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  return @($bmp, $g)
}

# Боковая панель: градиент, мягкие круги, иконка и название
$bmp, $g = New-Canvas 164 314
$rect = New-Object System.Drawing.Rectangle(0, 0, 164, 314)
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255, 79, 109, 236), [System.Drawing.Color]::FromArgb(255, 132, 76, 196), 65)
$g.FillRectangle($grad, $rect)
$soft = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 255, 255, 255))
$g.FillEllipse($soft, -60, 190, 200, 200)
$g.FillEllipse($soft, 90, -40, 130, 130)
# Узор «граф»: точки и линии
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), 1.4)
$dot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 255, 255, 255))
$pts = @(@(30, 236), @(78, 214), @(122, 248), @(62, 276), @(134, 196), @(104, 288))
$links = @(@(0, 1), @(1, 2), @(0, 3), @(1, 4), @(2, 5), @(3, 5), @(2, 4))
foreach ($l in $links) { $a = $pts[$l[0]]; $b = $pts[$l[1]]; $g.DrawLine($pen, $a[0], $a[1], $b[0], $b[1]) }
foreach ($p in $pts) { $g.FillEllipse($dot, $p[0] - 4, $p[1] - 4, 8, 8) }
$g.DrawImage($icon, 44, 46, 72, 72)
$font = New-Object System.Drawing.Font('Segoe UI Semibold', 20)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = 'Center'
$g.DrawString('Liser', $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(0, 128, 164, 36)), $fmt)
$small = New-Object System.Drawing.Font('Segoe UI', 8.5)
$g.DrawString("notes $([char]0x00B7) offline", $small, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 255, 255, 255))), (New-Object System.Drawing.RectangleF(0, 164, 164, 20)), $fmt)
$bmp.Save((Join-Path $build 'installerSidebar.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)
$bmp.Save((Join-Path $build 'uninstallerSidebar.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)
$g.Dispose(); $bmp.Dispose()

# Шапка внутренних страниц: белый фон, иконка справа
$bmp, $g = New-Canvas 150 57
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($icon, 104, 10, 37, 37)
$hf = New-Object System.Drawing.Font('Segoe UI Semibold', 13)
$fmt2 = New-Object System.Drawing.StringFormat
$fmt2.Alignment = 'Far'
$fmt2.LineAlignment = 'Center'
$g.DrawString('Liser', $hf, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 55, 53, 47))), (New-Object System.Drawing.RectangleF(0, 0, 100, 57)), $fmt2)
$bmp.Save((Join-Path $build 'installerHeader.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)
$g.Dispose(); $bmp.Dispose()
$icon.Dispose()
Write-Output 'build/installerSidebar.bmp, build/uninstallerSidebar.bmp, build/installerHeader.bmp'
