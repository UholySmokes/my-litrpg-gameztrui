$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-Bitmap([int]$w, [int]$h) {
	return New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Fill-Rect($bmp, [int]$x, [int]$y, [int]$w, [int]$h, [System.Drawing.Color]$c) {
	for ($yy = $y; $yy -lt ($y + $h); $yy++) {
		for ($xx = $x; $xx -lt ($x + $w); $xx++) {
			if ($xx -ge 0 -and $yy -ge 0 -and $xx -lt $bmp.Width -and $yy -lt $bmp.Height) {
				$bmp.SetPixel($xx, $yy, $c)
			}
		}
	}
}

function Save-Png($bmp, [string]$path) {
	New-Item -ItemType Directory -Path (Split-Path $path) -Force | Out-Null
	$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
	$bmp.Dispose()
}

function Clamp-Byte([int]$value) {
	if ($value -lt 0) { return 0 }
	if ($value -gt 255) { return 255 }
	return $value
}

function New-CharacterSprite([string]$path, [System.Drawing.Color]$cloak, [System.Drawing.Color]$trim) {
	$bmp = New-Bitmap 32 32
	$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
	Fill-Rect $bmp 0 0 32 32 $transparent
	Fill-Rect $bmp 10 4 12 6 ([System.Drawing.Color]::FromArgb(255, 238, 212, 166))
	Fill-Rect $bmp 9 10 14 16 $cloak
	Fill-Rect $bmp 9 25 6 6 ([System.Drawing.Color]::FromArgb(255, 54, 38, 32))
	Fill-Rect $bmp 17 25 6 6 ([System.Drawing.Color]::FromArgb(255, 54, 38, 32))
	Fill-Rect $bmp 10 12 12 2 $trim
	Fill-Rect $bmp 13 16 6 8 $trim
	Fill-Rect $bmp 11 2 10 2 ([System.Drawing.Color]::FromArgb(255, 42, 28, 20))
	Save-Png $bmp $path
}

function New-Atlas(
	[string]$path,
	[System.Drawing.Color]$a,
	[System.Drawing.Color]$b,
	[System.Drawing.Color]$c
) {
	$bmp = New-Bitmap 96 32
	$colors = @($a, $b, $c)
	for ($tile = 0; $tile -lt 3; $tile++) {
		$base = $colors[$tile]
		for ($y = 0; $y -lt 32; $y++) {
			for ($x = 0; $x -lt 32; $x++) {
				$worldX = $tile * 32 + $x
				$delta = (($x * 7 + $y * 5 + $tile * 11) % 18) - 9
				$r = Clamp-Byte ($base.R + $delta)
				$g = Clamp-Byte ($base.G + $delta)
				$b2 = Clamp-Byte ($base.B + $delta)
				$bmp.SetPixel($worldX, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b2))
			}
		}
	}
	Save-Png $bmp $path
}

function New-Prop([string]$path, [System.Drawing.Color]$core, [System.Drawing.Color]$ring) {
	$bmp = New-Bitmap 32 32
	Fill-Rect $bmp 0 0 32 32 ([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
	Fill-Rect $bmp 11 5 10 16 $core
	Fill-Rect $bmp 9 7 14 12 $ring
	Fill-Rect $bmp 8 22 16 6 ([System.Drawing.Color]::FromArgb(255, 74, 66, 62))
	Fill-Rect $bmp 12 2 8 3 ([System.Drawing.Color]::FromArgb(255, 245, 240, 224))
	Save-Png $bmp $path
}

function New-UiFrame([string]$path) {
	$bmp = New-Bitmap 96 96
	Fill-Rect $bmp 0 0 96 96 ([System.Drawing.Color]::FromArgb(255, 22, 18, 14))
	Fill-Rect $bmp 4 4 88 88 ([System.Drawing.Color]::FromArgb(255, 53, 44, 36))
	Fill-Rect $bmp 8 8 80 80 ([System.Drawing.Color]::FromArgb(255, 214, 196, 154))
	Fill-Rect $bmp 12 12 72 72 ([System.Drawing.Color]::FromArgb(255, 236, 224, 191))
	Fill-Rect $bmp 0 0 10 10 ([System.Drawing.Color]::FromArgb(255, 132, 110, 76))
	Fill-Rect $bmp 86 0 10 10 ([System.Drawing.Color]::FromArgb(255, 132, 110, 76))
	Fill-Rect $bmp 0 86 10 10 ([System.Drawing.Color]::FromArgb(255, 132, 110, 76))
	Fill-Rect $bmp 86 86 10 10 ([System.Drawing.Color]::FromArgb(255, 132, 110, 76))
	Save-Png $bmp $path
}

New-CharacterSprite "godot/assets/characters/traveler_idle_down.png" ([System.Drawing.Color]::FromArgb(255, 65, 106, 176)) ([System.Drawing.Color]::FromArgb(255, 245, 203, 96))
New-CharacterSprite "godot/assets/characters/guide_idle_down.png" ([System.Drawing.Color]::FromArgb(255, 98, 62, 142)) ([System.Drawing.Color]::FromArgb(255, 125, 219, 240))

New-Atlas "godot/assets/tilesets/village_square_atlas.png" ([System.Drawing.Color]::FromArgb(255, 82, 94, 113)) ([System.Drawing.Color]::FromArgb(255, 126, 137, 158)) ([System.Drawing.Color]::FromArgb(255, 62, 71, 89))
New-Atlas "godot/assets/tilesets/training_glade_atlas.png" ([System.Drawing.Color]::FromArgb(255, 56, 106, 62)) ([System.Drawing.Color]::FromArgb(255, 86, 132, 70)) ([System.Drawing.Color]::FromArgb(255, 38, 80, 44))
New-Atlas "godot/assets/tilesets/ruined_outlook_atlas.png" ([System.Drawing.Color]::FromArgb(255, 108, 86, 79)) ([System.Drawing.Color]::FromArgb(255, 143, 118, 107)) ([System.Drawing.Color]::FromArgb(255, 74, 58, 53))

New-Prop "godot/assets/props/save_crystal_village.png" ([System.Drawing.Color]::FromArgb(255, 88, 214, 240)) ([System.Drawing.Color]::FromArgb(255, 33, 133, 188))
New-Prop "godot/assets/props/save_obelisk_ruins.png" ([System.Drawing.Color]::FromArgb(255, 173, 143, 223)) ([System.Drawing.Color]::FromArgb(255, 100, 82, 153))
New-UiFrame "godot/assets/ui/prose_panel_frame.png"

@"
Placeholder asset pack generated for roadmap M6 implementation.
These files are internal temporary production placeholders until final art delivery replaces them.
See docs/ART_ASSET_LIST.md for target deliverables and naming expansion.
"@ | Set-Content -Path "godot/assets/NOTICE.txt" -Encoding UTF8

if (Test-Path "godot/assets/tmp_test.png") {
	Remove-Item "godot/assets/tmp_test.png" -Force
}

Write-Output "generated-assets"
