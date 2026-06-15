#!/usr/bin/env python3
"""
Generate Focus-Flow Extension Icons
Creates 16x16, 48x48, and 128x128 PNG icons with a gradient and pulse symbol
"""

import os
from PIL import Image, ImageDraw, ImageFont
import sys


def create_icon(size: int) -> Image.Image:
    """
    Create a Focus-Flow icon of specified size

    Args:
        size: Icon size in pixels (16, 48, or 128)

    Returns:
        PIL Image object
    """
    # Create image with gradient background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw gradient-like background (purple/blue)
    for y in range(size):
        # Create gradient from #667eea (top) to #764ba2 (bottom)
        r = int(102 + (118 - 102) * (y / size))
        g = int(126 + (75 - 126) * (y / size))
        b = int(234 + (162 - 234) * (y / size))
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Draw rounded square background
    margin = max(1, size // 8)
    padding = margin

    # Draw filled rounded rectangle (the app icon background)
    coords = [padding, padding, size - padding, size - padding]
    draw.rounded_rectangle(coords, radius=max(2, size // 6), fill=(255, 255, 255, 255))

    # Draw pulse symbol (circles representing monitoring)
    center = size // 2

    # Outer circle
    circle_radius = max(2, size // 4)
    draw.ellipse(
        [
            center - circle_radius,
            center - circle_radius,
            center + circle_radius,
            center + circle_radius,
        ],
        outline=(102, 126, 234, 255),
        width=max(1, size // 16),
    )

    # Middle circle
    mid_radius = circle_radius * 2 // 3
    draw.ellipse(
        [
            center - mid_radius,
            center - mid_radius,
            center + mid_radius,
            center + mid_radius,
        ],
        outline=(102, 126, 234, 255),
        width=max(1, size // 16),
    )

    # Center dot
    dot_radius = max(1, size // 12)
    draw.ellipse(
        [
            center - dot_radius,
            center - dot_radius,
            center + dot_radius,
            center + dot_radius,
        ],
        fill=(102, 126, 234, 255),
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

    print("🎨 Generating Focus-Flow icons...")

    for size in sizes:
        try:
            icon = create_icon(size)
            filename = f"{icons_dir}/icon-{size}.png"
            icon.save(filename, "PNG")
            print(f"✓ Created {filename} ({size}x{size})")
        except Exception as e:
            print(f"✗ Error creating {size}x{size} icon: {e}")
            sys.exit(1)

    print("\n✨ All icons generated successfully!")
    print("📁 Directory structure:")
    print(f"   extension/")
    print(f"   ├── icons/")
    print(f"   │   ├── icon-16.png")
    print(f"   │   ├── icon-48.png")
    print(f"   │   └── icon-128.png")
    print(f"   ├── manifest.json")
    print(f"   ├── background.js")
    print(f"   ├── popup.html")
    print(f"   ├── popup.js")
    print(f"   ├── offscreen.html")
    print(f"   └── offscreen.js")
    print("\n🚀 Ready to load in Chrome!")


if __name__ == "__main__":
    # Check if PIL is installed
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("❌ Pillow not installed. Install with: pip install Pillow")
        sys.exit(1)

    main()
