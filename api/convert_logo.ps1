Add-Type -AssemblyName System.Drawing

$src = "c:\Users\USER\Desktop\goooooo\uploads\logo.jpg"
$dst = "c:\Users\USER\Desktop\goooooo\uploads\logo.png"

$img = [System.Drawing.Bitmap]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)

for ($x = 0; $x -lt $img.Width; $x++) {
    for ($y = 0; $y -lt $img.Height; $y++) {
        $c = $img.GetPixel($x, $y)
        if ($c.R -gt 230 -and $c.G -gt 230 -and $c.B -gt 230) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
            $bmp.SetPixel($x, $y, $c)
        }
    }
}

$img.Dispose()
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Transparent logo PNG created at uploads/logo.png"
