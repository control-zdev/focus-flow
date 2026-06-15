#!/usr/bin/env python3
"""
Generate Focus-Flow Extension Icons with Cyan Theme
Creates 16x16, 48x48, and 128x128 PNG icons with dark slate background and cyan accents
"""

import os
from PIL import Image, ImageDraw
import sys


def create_icon(size: int) -> Image.Image:
    """
    Create a Focus-Flow icon of specified size with Cyan + Dark Slate theme

    Args:
        size: Icon size in pixels (16, 48, or 128)

    Returns:
        PIL Image object
    """
    # Create image with dark slate background
    img = Image.new("RGBA", (size, size), (26, 26, 46, 255))  # #1a1a2e
    draw = ImageDraw.Draw(img)

    # Draw darker background for depth
    margin = max(1, size // 8)
    coords = [0, 0, size, size]

    # Subtle gradient-like effect (darker at corners)
    for y in range(size):
        # Gradient from #1a1a2e to #16213e (slightly lighter in middle)
        progress = abs(y - size / 2) / (size / 2)
        r = int(26 + (22 - 26) * progress * 0.3)
        g = int(26 + (33 - 26) * progress * 0.3)
        b = int(46 + (62 - 46) * progress * 0.3)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Draw rounded square container (darker)
    padding = margin
    card_coords = [padding, padding, size - padding, size - padding]
    draw.rounded_rectangle(
        card_coords, radius=max(2, size // 6), fill=(22, 33, 62, 255)
    )  # #16213e with alpha

    # Draw cyan pulse circles (tech indicator)
    center = size // 2

    # Outer circle (cyan)
    circle_radius = max(2, size // 4)
    draw.ellipse(
        [
            center - circle_radius,
            center - circle_radius,
            center + circle_radius,
            center + circle_radius,
        ],
        outline=(15, 139, 141, 255),  # #0f8b8d
        width=max(1, size // 16),
    )

    # Middle circle (bright cyan)
    mid_radius = circle_radius * 2 // 3
    draw.ellipse(
        [
            center - mid_radius,
            center - mid_radius,
            center + mid_radius,
            center + mid_radius,
        ],
        outline=(0, 212, 255, 200),  # #00d4ff with slight transparency
        width=max(1, size // 20),
    )

    # Center dot (bright cyan - the "pulse")
    dot_radius = max(1, size // 12)
    draw.ellipse(
        [
            center - dot_radius,
            center - dot_radius,
            center + dot_radius,
            center + dot_radius,
        ],
        fill=(0, 212, 255, 255),  # #00d4ff
    )

    # Add subtle glow effect (only for larger icons)
    if size >= 48:
        glow_radius = dot_radius + max(1, size // 20)
        draw.ellipse(
            [
                center - glow_radius,
                center - glow_radius,
                center + glow_radius,
                center + glow_radius,
            ],
            outline=(0, 212, 255, 80),  # Subtle glow
            width=1,
        )

    return img


def main():
    """Generate and save all required icon sizes"""

    # Create icons directory if it doesn't exist
    icons_dir = "icons"
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
        print(f"✓ Created {icons_dir}/ directory")

    # Define icon sizes
    sizes = [16, 48, 128]

    print("🎨 Generating Focus-Flow Icons (Cyan + Dark Slate Theme)...")
    print()

    for size in sizes:
        try:
            icon = create_icon(size)
            filename = f"{icons_dir}/icon-{size}.png"
            icon.save(filename, "PNG")
            print(f"✓ Created {filename:30} ({size}x{size})")
        except Exception as e:
            print(f"✗ Error creating {size}x{size} icon: {e}")
            sys.exit(1)

    print()
    print("✨ All icons generated successfully!")
    print()
    print("📁 Directory structure:")
    print("   extension/")
    print("   ├── icons/")
    print("   │   ├── icon-16.png     ← Toolbar icon")
    print("   │   ├── icon-48.png     ← Extensions page")
    print("   │   └── icon-128.png    ← Chrome Web Store")
    print("   ├── manifest.json")
    print("   ├── background.js")
    print("   ├── popup.html")
    print("   ├── popup.js")
    print("   ├── offscreen.html")
    print("   └── offscreen.js")
    print()
    print("🎨 Color Theme:")
    print("   Background:  #1a1a2e (Dark Slate)")
    print("   Card:        #16213e (Darker Slate)")
    print("   Primary:     #0f8b8d (Teal)")
    print("   Accent:      #00d4ff (Bright Cyan)")
    print("   Glow:        Subtle cyan glow")
    print()
    print("🚀 Ready to load in Chrome!")


if __name__ == "__main__":
    # Check if PIL is installed
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("❌ Pillow not installed. Install with: pip install Pillow")
        sys.exit(1)

    main()
