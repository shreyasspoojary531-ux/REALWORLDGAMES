# ASSETS.md — Game Artwork & Previews Specification

This document inventories all production preview artwork used throughout the RealWorldGames hub, Quick Play rows, game cards, and Card Territory saloon.

---

## 1. Asset Inventory

| Game ID | Asset File | Dimensions | Aspect Ratio | Format | Subject Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `carrom` | `/games/carrom.webp` | 800x500 | 16:10 / 4:3 / 1:1 | WebP | Futuristic neon tabletop carrom board with smooth reflections and glowing striker rails |
| `sudoku` | `/games/sudoku.webp` | 640x480 | 4:3 / 1:1 | WebP | Neon matrix grid with luminous digits and puzzle node geometry |
| `chess` | `/games/chess.webp` | 640x480 | 4:3 / 1:1 | WebP | Holographic glowing chess board with cyan and magenta tactical pieces |
| `tictactoe` | `/games/tictactoe.webp` | 640x480 | 4:3 / 1:1 | WebP | Cyberpunk neon arena with glowing X and O tactical barriers |
| `card-territory` | `/games/card-territory.webp` | 960x540 | 16:9 / 4:3 | WebP | Astral card realm chamber with floating glowing constellation cards and runes |
| `blackjack` | `/games/blackjack.webp` | 640x480 | 4:3 / 1:1 | WebP | High-stakes vault table with glowing cards, chips, and dealer velvet felt |
| `poker` | `/games/poker.webp` | 640x480 | 4:3 / 1:1 | WebP | Texas Hold'em neon arena table with community cards and chip stacks |
| `rummy` | `/games/rummy.webp` | 640x480 | 4:3 / 1:1 | WebP | Sleek market card table displaying suited runs, melds, and stockpile |
| `uno` | `/games/uno.webp` | 640x480 | 4:3 / 1:1 | WebP | Vibrant color-matching arena with illuminated action cards and wild gradients |

---

## 2. Technical Standards

1. **Aspect Ratio**:
   - Featured Hero: `16:10` / `16:9`
   - Catalog Cards: `4:3` (or `1:1` square)
   - Quick Play rows: `1:1` (48x48px container)
2. **Loading & Rendering**:
   - `object-fit: cover` with centered focus.
   - Fixed containers to prevent Cumulative Layout Shift (`CLS < 0.1`).
   - Standard dark gradient overlays (`from-surface-container-lowest/80 via-transparent to-transparent`) behind text for guaranteed WCAG AA legibility.
   - Built-in SVG fallback placeholders if network delivery is interrupted.
