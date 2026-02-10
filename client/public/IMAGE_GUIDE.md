# Image Setup Guide

## Required Images for Character Registration Page

Place the following images in the `/public` folder:

### 1. Messi Image
- **Filename**: `messi.png`
- **Location**: `/public/messi.png`
- **Recommended size**: 500x500px or larger (square)
- **Format**: PNG with transparent background (preferred) or JPG

### 2. Ronaldo Image
- **Filename**: `ronaldo.png`
- **Location**: `/public/ronaldo.png`
- **Recommended size**: 500x500px or larger (square)
- **Format**: PNG with transparent background (preferred) or JPG

## Image Guidelines:
- Use high-quality player portrait images
- Square aspect ratio works best (1:1)
- Transparent backgrounds look better with the glowing effects
- Images will be displayed in 200x200px circular frames
- Blue glow effect for Messi (Team A)
- Red glow effect for Ronaldo (Team B)

## Fallback:
If images are not found, the app will display:
- 🔵 Blue emoji for Messi
- 🔴 Red emoji for Ronaldo

## Current Setup:
✅ 3D Rotating "VS" text with golden glow
✅ Spinning ring animation around VS
✅ Circular image frames with team-colored borders
✅ Glowing effects matching team colors
✅ Automatic fallback to emojis if images fail to load
