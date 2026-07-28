<?php
// Convert logo.jpg to transparent PNG
$srcPath = __DIR__ . '/../uploads/logo.jpg';
$dstPath = __DIR__ . '/../uploads/logo.png';

if (!file_exists($srcPath)) {
    die("Source logo not found.");
}

$img = imagecreatefromjpeg($srcPath);
if (!$img) {
    die("Failed to open image.");
}

$w = imagesx($img);
$h = imagesy($img);

$png = imagecreatetruecolor($w, $h);
imagealphablending($png, false);
imagesavealpha($png, true);

$transparent = imagecolorallocatealpha($png, 255, 255, 255, 127);
imagefill($png, 0, 0, $transparent);

for ($x = 0; $x < $w; $x++) {
    for ($y = 0; $y < $h; $y++) {
        $rgb = imagecolorat($img, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        
        // Remove white / near-white background
        if ($r > 230 && $g > 230 && $b > 230) {
            imagesetpixel($png, $x, $y, $transparent);
        } else {
            $color = imagecolorallocatealpha($png, $r, $g, $b, 0);
            imagesetpixel($png, $x, $y, $color);
        }
    }
}

imagepng($png, $dstPath);
imagedestroy($img);
imagedestroy($png);

echo "SUCCESS: Transparent PNG created at uploads/logo.png\n";
