# Visual Layout Guide - Responsive Behavior

## Desktop Layout (1200px+)

```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Search] [📊 Stats] [🏙️ City] [🔨 Actions] [📜 Log]    │ ← Control Bar
│                                                               │
│  ┌──────────────┐                                            │
│  │ Panel Content│ ← Dropdown panel appears below button      │
│  │ • Item 1     │                                            │
│  │ • Item 2     │                                            │
│  └──────────────┘                                            │
│                                                               │
│                                                               │
│                    🗺️  MAP AREA                              │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Tablet Layout (768px-1024px)

```
┌────────────────────────────────────────────────┐
│ [🔍] [📊] [🏙️] [🔨] [📜] [💾] [📂]            │ ← Compact
│                                                │
│  ┌─────────────┐                               │
│  │Panel Content│ ← Slightly smaller panels     │
│  │• Item 1     │                               │
│  └─────────────┘                               │
│                                                │
│              🗺️  MAP AREA                     │
│                                                │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
```

## Mobile Layout (≤768px)

### Closed State
```
┌──────────────────────────┐
│ [🔍][📊][🏙️][🔨][📜]    │ ← Icon-only buttons
├──────────────────────────┤
│                          │
│                          │
│                          │
│      🗺️  MAP AREA       │
│                          │
│                          │
│                          │
│                          │
│                          │
└──────────────────────────┘
```

### Panel Open State
```
┌──────────────────────────┐
│ [🔍][📊][🏙️][🔨][📜]    │ ← Active button highlighted
├──────────────────────────┤
│░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Backdrop (semi-transparent)
│░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░  🗺️  MAP AREA  ░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░│
├──────────────────────────┤
│      ━━━━━━━━            │ ← Swipe handle
│  Panel Title             │
│  ┌────────────────────┐  │
│  │ Content            │  │ ← Bottom sheet panel
│  │ • Item 1           │  │   (slides up from bottom)
│  │ • Item 2           │  │
│  │ • Item 3           │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

## Interaction Patterns

### Desktop
```
Click Button → Panel Drops Down
                    ↓
              Click Outside → Panel Closes
              Press ESC → Panel Closes
```

### Mobile
```
Tap Button → Panel Slides Up + Backdrop Appears
                    ↓
              Tap Backdrop → Panel Closes
              Swipe Down → Panel Closes
              Press ESC → Panel Closes
```

## Responsive Breakpoints

```
320px   480px      768px        1024px       1200px      1920px
  │       │          │            │            │           │
  └───────┴──────────┴────────────┴────────────┴───────────┘
  Small   Mobile     Tablet       Desktop      Wide        Ultra-wide
  Mobile             (Hybrid)     (Full)       Desktop     Desktop
  
  • Icon-only       • Icon-only  • Full labels • Full      • Spacious
  • Bottom sheet    • Bottom     • Dropdown    • Dropdown  • Larger
  • Max space       • sheet      • Compact     • Optimal   • panels
```

## Animation Flow

### Panel Opening (Desktop)
```
State 1: display: none, opacity: 0
         ↓ (button click)
State 2: display: block, opacity: 0, transform: translateY(-10px)
         ↓ (animation 300ms)
State 3: display: block, opacity: 1, transform: translateY(0)
```

### Panel Opening (Mobile)
```
State 1: display: none, transform: translateY(100%)
         ↓ (button tap)
State 2: display: block, transform: translateY(100%)
         ↓ (animation 300ms)
State 3: display: block, transform: translateY(0)
```

### Swipe Gesture (Mobile)
```
Touch Start → Record Y position
     ↓
Touch Move → Apply transform: translateY(diff)
     ↓
Touch End → Check distance
     ↓
If > 100px → Close panel
If < 100px → Spring back to position
```

## Z-Index Hierarchy

```
Layer 5: 2001 - Retaliation Alert
Layer 4: 2000 - Notifications
Layer 3: 1001 - Control Panels
Layer 2: 1000 - Control Bar
Layer 1: 999  - Backdrop
Layer 0: 1    - Map (base)
```

## Touch Target Sizes

### Desktop (pointer: fine)
```
┌────────────┐
│   Button   │  Min: 32x32px
└────────────┘
```

### Mobile (pointer: coarse)
```
┌──────────────────┐
│                  │
│     Button       │  Min: 44x44px (Apple HIG)
│                  │
└──────────────────┘
```

## Safe Area Insets (Notched Devices)

```
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Safe area inset top
│ [🔍][📊][🏙️][🔨][📜]      │   (notch/dynamic island)
├─────────────────────────────┤
│                             │
│         MAP AREA            │
│                             │
└─────────────────────────────┘
```

## Landscape Orientation (Mobile)

```
┌────────────────────────────────────────────────┐
│ [🔍][📊][🏙️][🔨][📜]                          │ ← Compact
├────────────────────────────────────────────────┤
│                                                │
│              🗺️  MAP AREA                     │
│                                                │
└────────────────────────────────────────────────┘
                                            [?] ← Help button
                                                   (repositioned)
```

## Panel Content Scrolling

### Short Content
```
┌──────────────────┐
│  Panel Title     │
│                  │
│  • Item 1        │
│  • Item 2        │
│  • Item 3        │
│                  │
└──────────────────┘
```

### Long Content
```
┌──────────────────┐
│  Panel Title     │ ← Fixed header
├──────────────────┤
│  • Item 1        │ ↑
│  • Item 2        │ │
│  • Item 3        │ │ Scrollable
│  • Item 4        │ │ area
│  • Item 5        │ │
│  • Item 6        │ ↓
└──────────────────┘
```

## Notification Stacking

```
┌─────────────────────────────┐
│ ⓘ Info: City captured       │ ← Newest
├─────────────────────────────┤
│ ⚠️ Warning: Low solidarity  │
├─────────────────────────────┤
│ ✓ Success: Strike completed │ ← Oldest
└─────────────────────────────┘
     ↓ (if more than 3)
   Scroll
```

## Color Coding

```
Solidarity Levels:
🟢 Green   (80-100%) - High
🟡 Gold    (50-79%)  - Medium
🟠 Orange  (20-49%)  - Low
🔴 Red     (0-19%)   - Critical

Notification Types:
🔵 Blue    - Info
🟡 Yellow  - Warning
🔴 Red     - Error
🟡 Gold    - Achievement
```

## Accessibility Features

### Keyboard Navigation
```
Tab → Focus next control
Shift+Tab → Focus previous control
Enter/Space → Activate button
Escape → Close active panel
```

### Screen Reader Announcements
```
Button: "Search cities, button"
Panel: "Search panel, dialog"
Close: "Panel closed"
```

### Focus Indicators
```
┌──────────────────┐
│ ┏━━━━━━━━━━━━━┓ │ ← 2px outline
│ ┃   Button    ┃ │   (focus-visible)
│ ┗━━━━━━━━━━━━━┛ │
└──────────────────┘
```

## Performance Optimization

### GPU Acceleration
```
✅ transform: translateY()  ← GPU accelerated
❌ top: 100px               ← CPU (causes reflow)

✅ opacity: 0               ← GPU accelerated
❌ visibility: hidden       ← No animation
```

### Event Listeners
```
✅ { passive: true }        ← Scroll performance
✅ Event delegation         ← Fewer listeners
✅ Debounced resize         ← Reduced calls
```

This visual guide provides a clear understanding of how the responsive design adapts across different screen sizes and interaction patterns!
