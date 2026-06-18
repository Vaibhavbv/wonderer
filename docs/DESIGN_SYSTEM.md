# Wanderverse — Design System & Motion Guidelines

## 1. Design Philosophy

Wanderverse blends the **warm, immersive storytelling** of Airbnb with the **precision, whitespace, and kinetic confidence** of Apple product pages. Every interaction should feel intentional — like turning the page of a premium travel magazine, but one that lives, breathes, and responds to your touch.

### Core Principles
1. **Story First**: The UI disappears; the content takes center stage.
2. **Motion as Meaning**: Animations don't decorate — they communicate spatial relationships, state changes, and narrative progression.
3. **Tactile Luxury**: Every button, card, and scroll should feel premium, with subtle depth, shadow, and response.
4. **Breathing Room**: Generous whitespace (Apple) meets rich media density (Pinterest) in a calibrated tension.
5. **Contextual Color**: Colors shift with the trip content — warm sunsets, cool glaciers, verdant forests — while maintaining brand consistency.

## 2. Color System

### Brand Palette
```css
/* Primary: Warm Terracotta — evokes earth, adventure, warmth */
--color-primary-50:  #FEF2EE;
--color-primary-100: #FCE1D8;
--color-primary-200: #F9C3B0;
--color-primary-300: #F59E82;
--color-primary-400: #F07A55;
--color-primary-500: #E85D4C;   /* Brand primary */
--color-primary-600: #D1493A;
--color-primary-700: #B03A2E;
--color-primary-800: #8E2E25;
--color-primary-900: #6B231C;

/* Secondary: Deep Slate — sophistication, readability */
--color-secondary-50:  #F4F6F8;
--color-secondary-100: #E2E7EC;
--color-secondary-200: #C5CFD8;
--color-secondary-300: #9AABB8;
--color-secondary-400: #6B8293;
--color-secondary-500: #4A6572;
--color-secondary-600: #3D5460;
--color-secondary-700: #2C3E50;   /* Brand secondary */
--color-secondary-800: #1E2A35;
--color-secondary-900: #11181F;

/* Accent: Golden Amber — highlights, CTAs, achievements */
--color-accent-50:  #FFFBEB;
--color-accent-100: #FEF3C7;
--color-accent-200: #FDE68A;
--color-accent-300: #FCD34D;
--color-accent-400: #FBBF24;
--color-accent-500: #F59E0B;   /* Brand accent */
--color-accent-600: #D97706;
--color-accent-700: #B45309;
--color-accent-800: #92400E;
--color-accent-900: #78350F;

/* Neutral: Warm Gray — backgrounds, borders, dividers */
--color-neutral-50:  #FAFAF9;
--color-neutral-100: #F5F5F4;
--color-neutral-200: #E7E5E4;
--color-neutral-300: #D6D3D1;
--color-neutral-400: #A8A29E;
--color-neutral-500: #78716C;
--color-neutral-600: #57534E;
--color-neutral-700: #44403C;
--color-neutral-800: #292524;
--color-neutral-900: #1C1917;
```

### Semantic Colors
```css
--color-background: #FAFAF9;           /* Page background */
--color-surface: #FFFFFF;              /* Card, modal, panel backgrounds */
--color-surface-elevated: #FFFFFF;     /* Elevated surface (with shadow) */
--color-surface-pressed: #F5F5F4;      /* Pressed/hover state */
--color-border: #E7E5E4;              /* Borders, dividers */
--color-border-focus: #E85D4C;        /* Focus ring */
--color-text-primary: #1C1917;         /* Headings, primary text */
--color-text-secondary: #57534E;       /* Body text, descriptions */
--color-text-tertiary: #78716C;        /* Metadata, timestamps */
--color-text-inverse: #FFFFFF;         /* Text on dark backgrounds */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;
```

### Dark Mode
```css
--color-background: #11181F;
--color-surface: #1E2A35;
--color-surface-elevated: #2C3E50;
--color-surface-pressed: #3D5460;
--color-border: #3D5460;
--color-text-primary: #F4F6F8;
--color-text-secondary: #C5CFD8;
--color-text-tertiary: #9AABB8;
--color-text-inverse: #1C1917;
```

### Dynamic Trip Themes
Each trip can override with a contextual theme extracted from its cover photo or user selection:
```css
/* Example: Sunset Trip Theme */
--theme-primary: #E85D4C;
--theme-secondary: #2C3E50;
--theme-gradient-start: #F07A55;
--theme-gradient-end: #8E2E25;
--theme-accent: #FCD34D;
```

## 3. Typography

### Font Stack
```css
/* Headings: Playfair Display — editorial, elegant */
--font-heading: 'Playfair Display', Georgia, serif;

/* Body: Inter — modern, highly readable */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace: JetBrains Mono — metadata, code, coordinates */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale (Fluid Typography)
```css
/* Using clamp() for responsive scaling */
--text-hero: clamp(3rem, 8vw, 6rem);       /* 48px → 96px */
--text-h1: clamp(2.5rem, 5vw, 4rem);       /* 40px → 64px */
--text-h2: clamp(2rem, 4vw, 3rem);         /* 32px → 48px */
--text-h3: clamp(1.5rem, 3vw, 2.25rem);    /* 24px → 36px */
--text-h4: clamp(1.25rem, 2vw, 1.5rem);    /* 20px → 24px */
--text-body: clamp(1rem, 1.2vw, 1.125rem); /* 16px → 18px */
--text-small: clamp(0.875rem, 1vw, 1rem);   /* 14px → 16px */
--text-caption: clamp(0.75rem, 0.8vw, 0.875rem); /* 12px → 14px */
```

### Line Heights
```css
--leading-tight: 1.1;    /* Headings */
--leading-snug: 1.3;     /* Subheadings */
--leading-normal: 1.6;   /* Body text */
--leading-relaxed: 1.8;  /* Long-form reading */
```

### Letter Spacing
```css
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.05em;    /* Labels, buttons */
--tracking-wider: 0.1em;    /* Overlines, captions */
--tracking-widest: 0.2em;   /* Decorative text */
```

## 4. Spacing System

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
--space-10: 4rem;     /* 64px */
--space-12: 5rem;     /* 80px */
--space-16: 7rem;     /* 112px */
--space-20: 9rem;     /* 144px */
--space-24: 12rem;    /* 192px */
```

## 5. Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;    /* 4px — tags, badges */
--radius-md: 0.5rem;     /* 8px — buttons, inputs */
--radius-lg: 0.75rem;    /* 12px — cards, panels */
--radius-xl: 1rem;       /* 16px — modals, large cards */
--radius-2xl: 1.5rem;    /* 24px — feature cards */
--radius-3xl: 2rem;      /* 32px — hero cards */
--radius-full: 9999px;   /* Pills, avatars */
```

## 6. Shadow System

```css
/* Subtle — cards, buttons */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Default — elevated cards, dropdowns */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);

/* Prominent — modals, floating panels */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Dramatic — hero cards, featured content */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Colored glow — primary actions, focus states */
--shadow-glow: 0 0 20px rgba(232, 93, 76, 0.3);
```

## 7. Component Specifications

### Button
```
Variants: primary, secondary, ghost, danger, outline
Sizes: xs, sm, md, lg, xl
States: default, hover, active, disabled, loading

Primary:
  Background: --color-primary-500
  Text: --color-text-inverse
  Border-radius: --radius-md
  Padding: --space-3 --space-5
  Font: --font-body, 500, --text-body
  Shadow: --shadow-sm
  Hover: background --color-primary-600, translateY(-1px), --shadow-md
  Active: background --color-primary-700, translateY(0)
  Transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)
  Icon: 16px, margin-right 8px, transitions with text
```

### Card
```
Background: --color-surface
Border: 1px solid --color-border
Border-radius: --radius-xl
Padding: --space-6
Shadow: --shadow-sm
Hover: --shadow-md, translateY(-2px), border-color --color-primary-300
Transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1)
Image container: border-radius --radius-lg, overflow hidden, aspect-ratio 16/9
```

### Input
```
Background: --color-surface
Border: 1px solid --color-border
Border-radius: --radius-md
Padding: --space-3 --space-4
Font: --font-body, --text-body
Focus: border-color --color-border-focus, --shadow-glow, outline none
Error: border-color --color-error, subtle red glow
Transition: border-color 200ms, box-shadow 200ms
```

### Modal / Dialog
```
Overlay: rgba(0, 0, 0, 0.5), backdrop-filter blur(4px)
Panel: --color-surface, --radius-2xl, --shadow-xl
Max-width: 640px (default), 480px (small), 900px (large)
Animation: Overlay fade 200ms, Panel scale 0.95→1 + translateY(20px→0) 300ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)
```

### Tooltip
```
Background: --color-neutral-800
Text: --color-text-inverse, --text-small
Padding: --space-2 --space-3
Border-radius: --radius-sm
Animation: Fade 150ms + translateY(4px→0) 150ms
Arrow: 6px, same background
```

### Badge / Tag
```
Variants: default, primary, secondary, success, warning, outline
Padding: --space-1 --space-3
Border-radius: --radius-full
Font: --font-body, 500, --text-caption
```

## 8. Motion & Animation Guidelines

### Easing Curves
```css
/* Standard — UI transitions, hover states */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* Decelerate — Elements entering the viewport */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

/* Accelerate — Elements exiting the viewport */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

/* Spring — Playful, bouncy interactions */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Dramatic — Hero entrances, major reveals */
--ease-dramatic: cubic-bezier(0.16, 1, 0.3, 1);

/* Smooth — Cinematic scroll animations */
--ease-smooth: cubic-bezier(0.45, 0, 0.55, 1);
```

### Duration Scale
```css
--duration-instant: 100ms;   /* Micro-interactions, button active */
--duration-fast: 150ms;      /* Hover states, tooltips */
--duration-normal: 300ms;    /* Card transitions, modal open */
--duration-slow: 500ms;      /* Section entrances, page transitions */
--duration-dramatic: 800ms;    /* Hero animations, 3D transitions */
--duration-cinematic: 1200ms;  /* Full-page transitions, globe fly-tos */
```

### Animation Patterns

#### Pattern: Fade + Rise (Standard Entrance)
```css
@keyframes fadeRise {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: --duration-slow */
/* Easing: --ease-decelerate */
/* Stagger: 80ms between siblings */
```

#### Pattern: Scale + Fade (Modal, Card Hover)
```css
@keyframes scaleFade {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
/* Duration: --duration-normal */
/* Easing: --ease-dramatic */
```

#### Pattern: Slide In (Side Panels, Drawers)
```css
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
/* Duration: --duration-normal */
/* Easing: --ease-dramatic */
/* Overlay: fade 200ms */
```

#### Pattern: Stagger Children (Lists, Grids)
```css
/* Each child: fadeRise animation */
/* Stagger delay: index * 80ms */
/* Max stagger: 800ms (cap at ~10 items) */
```

#### Pattern: Scroll Progress (The "Wander" View)
```css
/* Map position: Interpolate based on scroll progress */
/* Route line: Draw SVG path with stroke-dashoffset */
/* Vehicle icon: Follow path with rotation aligned to tangent */
/* Photo cards: Parallax at 0.8x speed, fade in at 20% visibility */
/* Text overlays: Fade + rise at 30% visibility, pin until 80% */
```

#### Pattern: 3D Globe Fly-To
```css
/* Duration: --duration-cinematic */
/* Easing: --ease-smooth */
/* Steps: */
/* 1. Current camera position */
/* 2. Ease out to high altitude (zoom out) */
/* 3. Rotate to target longitude */
/* 4. Ease in to target (zoom in) */
/* 5. Subtle overshoot + settle */
```

#### Pattern: Photo Gallery Masonry
```css
/* Layout: CSS Grid with masonry (or JS masonry) */
/* Entrance: Each photo fades in + scale(0.9)→scale(1) */
/* Stagger: Random delay between 0-400ms for organic feel */
/* Hover: scale(1.02), shadow increase, caption slide up */
/* Duration: --duration-normal */
/* Easing: --ease-standard */
```

#### Pattern: Skeleton Loading
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%) */
/* Background-size: 200% 100% */
/* Animation: shimmer 1.5s infinite */
```

#### Pattern: Success / Confetti
```css
/* On completion: Brief scale pulse (1 → 1.05 → 1) */
/* Optional: Subtle confetti burst from center */
/* Color: Brand primary + accent */
/* Duration: --duration-slow */
```

### Scroll-Behavior Architecture

The "Wander" immersive scroll view uses a layered animation system:

```
Layer 0 (Background): Full-viewport Mapbox map
  → Scroll progress controls map center, zoom, pitch, bearing
  → Smooth interpolation via GSAP ScrollTrigger scrub

Layer 1 (Route Line): SVG path overlay on map
  → stroke-dashoffset animates from 100% → 0% as user scrolls
  → Line color pulses subtly at current position

Layer 2 (Vehicle): Animated SVG icon (plane/train/car/boat)
  → Follows route path using getPointAtLength()
  → Rotation matches path tangent
  → Subtle bounce animation (spring easing)
  → Changes icon based on travel mode of current leg

Layer 3 (Photo Cards): Positioned absolutely over map
  → Enter viewport: fade + rise + slight scale
  → Parallax at 0.7x scroll speed (move slower than scroll)
  → Exit: fade + slight downward drift
  → Active card: subtle glow border, scale(1.02)

Layer 4 (Text Overlays): Centered or side-aligned
  → Enter: fade + rise, pin for 3-4 scroll viewport heights
  → Background blur overlay for readability
  → Exit: fade out

Layer 5 (Timeline): Fixed right-side or bottom scrubber
  → Active segment highlighted
  → Click to jump to position
  → Current date/location label

Layer 6 (Progress): Thin top bar or circular indicator
  → Fill percentage = scroll progress
  → Color gradient from primary to accent
```

### Performance Rules
- **60fps or death**: All animations must maintain 60fps on mid-range devices
- **Use `transform` and `opacity` only**: Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`
- **GPU Acceleration**: Use `will-change: transform` sparingly, remove after animation
- **Debounce scroll handlers**: 16ms minimum (RAF-aligned)
- **Lazy load off-screen**: IntersectionObserver for triggering animations
- **Reduce motion**: Respect `prefers-reduced-motion` — disable parallax, simplify transitions
- **Code split**: GSAP plugins, Three.js scenes loaded on demand

## 9. Responsive Breakpoints

```css
/* Mobile First */
--bp-sm: 640px;   /* Large phones */
--bp-md: 768px;   /* Tablets portrait */
--bp-lg: 1024px;  /* Tablets landscape, small laptops */
--bp-xl: 1280px;  /* Desktops */
--bp-2xl: 1536px; /* Large desktops */
--bp-3xl: 1920px; /* Ultra-wide */
```

### Responsive Behavior Patterns

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|---|---|---|---|
| Navigation | Bottom sheet / Hamburger | Sidebar (collapsible) | Fixed sidebar |
| Map View | Fullscreen, swipe | 60% width, scroll | 50% width, scroll |
| Story Grid | 1 column | 2 columns | 3-4 columns |
| Photo Card | Full width | 50% width | 33% width |
| Typography | --text-hero × 0.6 | --text-hero × 0.8 | Full scale |
| Spacing | --space-4 base | --space-6 base | --space-8 base |
| Modal | Fullscreen sheet | Centered dialog | Centered dialog |
| Timeline | Bottom horizontal | Right vertical | Right vertical |

## 10. Iconography

- **Library**: Lucide React (primary), custom travel icons (secondary)
- **Size Scale**: 16px (inline), 20px (buttons), 24px (navigation), 32px (features), 48px (empty states)
- **Stroke Width**: 1.5px (default), 2px (emphasis)
- **Animation**: Icons subtly animate on interaction (rotate, scale, color shift)
- **Custom Icons**: Travel-specific — airplane, train, car, boat, compass, map pin, passport, camera, mountain, wave, tent, landmark

## 11. Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal-backdrop: 300;
--z-modal: 400;
--z-popover: 500;
--z-tooltip: 600;
--z-toast: 700;
--z-confetti: 800;
--z-devtools: 9999;
```

---

*Document Version: 1.0 | Last Updated: 2025-01-15 | Owner: Design Team*
