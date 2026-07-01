# Vercel Geist Design Reference

This project uses the local copied Vercel design reference at `/Users/hs108/Downloads/Vercel design.md` as its design source of truth. The source file is stored as RTF text, so this note normalizes the tokens and rules used by the app implementation.

## Core Tokens

- `background-100`: `#ffffff`
- `background-200`: `#fafafa`
- `primary`: `#171717`
- `secondary`: `#4d4d4d`
- `tertiary`: `#006bff`
- `neutral`: `#f2f2f2`
- `gray-alpha-400`: `#00000014`
- `amber-700`: `#ffae00`
- `amber-900`: `#aa4d00`
- `green-700`: `#28a948`
- `red-800`: `#ea001d`

## Typography

- Geist Sans sets UI, labels, buttons, and prose.
- Geist Mono sets tabular numbers, timing, and measured brew data.
- Most interface text uses `label-14` or `copy-14`.
- Buttons use medium-weight 14px or 16px labels.

## Layout

- Use a 4px spacing scale: `4, 8, 12, 16, 24, 32, 40, 64, 96`.
- Keep a three-step rhythm: 8px inside groups, 16px between groups, 32-40px between larger regions.
- Use a 1200px-centered content model when appropriate, but this app uses a full-width tool layout with fixed rails.

## Components

- Buttons and inputs use 6px radius.
- Default control height is 40px; large controls are 48px.
- Primary button is solid `#171717` with white text.
- Secondary button is white with a translucent border.
- Focus ring: `0 0 0 2px #ffffff, 0 0 0 4px #006bff`.
- Shadows stay subtle: `0 2px 2px rgba(0, 0, 0, 0.04)`.

## Voice

- Use Title Case for labels, buttons, titles, and tabs.
- Use sentence case for helper text.
- Name actions with a verb and noun: `Start Brew`, `Save Recipe`, `Clear Log`.
- Use present participle with an ellipsis for in-progress states, such as `Brewing...`.
