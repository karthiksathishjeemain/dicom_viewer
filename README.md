# DICOM Viewer

A small, fast, fully client-side web app for inspecting DICOM (`.dcm`) files. Load a
file and see its **complete metadata** alongside the **rendered image**. Nothing is
uploaded — all parsing and rendering happens in your browser.

## Features

- Drag & drop or file picker to open a DICOM file
- Full metadata table (tag, name, VR, value) with live filtering
- Image rendering on a `<canvas>` with:
  - Window width / window center sliders
  - Click-and-drag on the image to adjust window/level (drag X = width, Y = center)
  - Invert and Reset controls
  - Multi-frame support (frame slider)
  - Grayscale (MONOCHROME1/2) and RGB color images
  - Rescale slope/intercept handling

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL and load a `.dcm` file.

To create a production build:

```bash
npm run build
npm run preview
```

## Notes / limitations

- Supports **uncompressed** transfer syntaxes (Implicit & Explicit VR Little Endian),
  which covers the majority of sample DICOM files. For compressed images
  (JPEG / JPEG 2000 / RLE), the metadata is still shown and a clear message explains
  that the pixel data isn't decoded by this lightweight viewer.
- The metadata dictionary covers common standard tags; unrecognized/private tags are
  still listed by their hex tag.

## Tech

- [Vite](https://vitejs.dev/) for dev server & bundling
- [dicom-parser](https://github.com/cornerstonejs/dicomParser) for parsing
- Vanilla JS + a hand-written canvas renderer (no heavy imaging framework)
# dicom_viewer
