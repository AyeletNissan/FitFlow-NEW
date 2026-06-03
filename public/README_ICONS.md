Please place the provided FitFlow icon PNG (the image you attached) into this folder with the following filenames:

- icon.png      (recommended size: 512x512, square)
- apple-icon.png (recommended size: 180x180)
- favicon.ico   (optional; can be generated from icon.png)

Suggested commands to generate assets locally (requires ImageMagick):

# create 512x512 icon
convert attached-image.png -resize 512x512 public/icon.png
# create apple touch icon
convert attached-image.png -resize 180x180 public/apple-icon.png
# create favicon.ico (contains multiple sizes)
convert attached-image.png -resize 16x16 favicon-16.png
convert attached-image.png -resize 32x32 favicon-32.png
convert favicon-16.png favicon-32.png public/favicon.ico

If you don't have ImageMagick, you can use an online favicon generator or preview on macOS and export sizes using Preview.app.

After placing the files, run the build (npm run build) and verify the icon shows in the browser tab and as the Add-to-Home-Screen icon on mobile.
