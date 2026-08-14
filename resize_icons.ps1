Add-Type -AssemblyName System.Drawing

function Resize-Icon {
    param([string]$SourcePath, [string]$DestPath, [int]$Size)
    $img = [System.Drawing.Image]::FromFile($SourcePath)
    $resized = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($resized)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $Size, $Size)
    $resized.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $resized.Dispose()
    $img.Dispose()
    Write-Host "Created: $DestPath ($Size x $Size)"
}

$source = "E:\Brain\AndroidStudio\PhoeniciaTV\app\src\main\res\drawable-nodpi\ic_launcher.png"
$base = "E:\Brain\AndroidStudio\PhoeniciaTV\app\src\main\res"

Resize-Icon $source "$base\mipmap-mdpi\ic_launcher.png" 48
Resize-Icon $source "$base\mipmap-hdpi\ic_launcher.png" 72
Resize-Icon $source "$base\mipmap-xhdpi\ic_launcher.png" 96
Resize-Icon $source "$base\mipmap-xxhdpi\ic_launcher.png" 144
Resize-Icon $source "$base\mipmap-xxxhdpi\ic_launcher.png" 192