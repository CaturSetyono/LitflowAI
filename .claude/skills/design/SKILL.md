---
name: design
description: Design system extracted from AI Automation SaaS Landing Page Design (Behance). Use when building UI that should match this brand's visual identity.
triggers:
  - "behance-net"
  - "design like AI Automation SaaS Landing Page Design"
source: https://www.behance.net/gallery/242896981/AI-Automation-SaaS-Landing-Page-Design
extractedAt: 2026-06-18T04:30:10.020Z
tags: ["light", "rounded", "accented", "compact", "sans-serif"]
---
# Design System Inspired by AI Automation SaaS Landing Page Design

> Auto-extracted from the Behance gallery on 2026-06-18.

## 1. Visual Theme & Atmosphere
Friendly, approachable design with rounded shapes and generous whitespace.
- Heading + body font: acumin-pro (humanist sans). Heading weight 700.
- Light background (#f9f9f9) as the primary canvas.
- Primary accent `#3a14db` for CTAs and brand highlights.
- Tinted (chromatic) shadows, not pure black.
- Pill / rounded corners for interactive elements.
- Tags: light, rounded, accented, compact, sans-serif.

## 2. Color Palette & Roles
- Primary Accent `#3a14db`: CTA backgrounds, link text, interactive highlights.
- Secondary Accent `#459ceb`: hover states, complementary highlights.
- Background `#f9f9f9`: page canvas.
- Surface Dark `#141414`: optional dark surfaces.
- Text Primary `#191919`; Text Secondary `#707070`/`#666666`.
- Border `#f0f0f0` / `#ececec`.

Scale:
```
grey-50 #f9f9f9  grey-100 #f0f0f0  grey-200 #ececec  grey-300 #e8e8e8
grey-500 #909090 grey-600 #707070  grey-900 #191919
blue-150 #ebf1ff blue-500 #459ceb  accent #3a14db    violet #9f53eb
```

## 3. Typography
- Heading & body: `acumin-pro`, sans-serif; headings weight 700; restrained sizes.
- `acumin-pro` is Adobe Typekit (not free). Substitute with Plus Jakarta Sans /
  Inter / Figtree and keep weight 700 for headings.

## 4. Components
- Primary CTA: bg `#3a14db`, white text, pill radius, weight 600.
- Pill button: white bg, `#191919` text, 0.8px `#e8e8e8` border, 100px radius.
- Ghost button: transparent, `#191919` text, no border.

## 5. Layout
- Base spacing unit 4px (use multiples). Generous whitespace; centered max-width.
- Radius: pills (100px) for buttons/badges/inputs; 24–50px for cards.

## 6. Depth
- Card: `rgba(0,0,0,0.06) 0 1px 3px` + tinted `rgba(58,20,219,0.10) 0 8px 24px -12px`.
- Popover/hover: `rgba(0,0,0,0.12) 0 8px 30px -10px`.
- Use color-tinted shadows for warmth.

## 7. Do / Don't
Do: `#f9f9f9` bg; `#3a14db` single accent; 4px grid; pill corners; tinted shadows; heading weight 700.
Don't: off-palette colors; irregular spacing; dark page bg; sharp corners; oversized hero text; pure black text; decorative ornaments not in source.

## 8. Responsive
Mobile <640 single column; Tablet 640–1024 2-col; Desktop 1024–1440 full; Wide >1440 centered max-width. Touch targets ≥44px.

## 9. Quick Color Reference
```
Background #f9f9f9  Text #191919  Muted #707070
Accent #3a14db  Secondary #459ceb  Border #ececec
```
