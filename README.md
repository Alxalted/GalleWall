# Gallery Wall Planner

**A personal, standalone web application for planning and visualizing gallery wall layouts — built as a single HTML file, hosted on Netlify, and designed for iPad use.**

---

## Table of Contents

1. [Project Purpose](#1-project-purpose)
2. [What It Is](#2-what-it-is)
3. [Current Features](#3-current-features)
   - [Two-Page Architecture](#two-page-architecture)
   - [Artwork Library](#artwork-library)
   - [Wall Planner](#wall-planner)
   - [Conflict Detection System](#conflict-detection-system)
   - [Arrange Tools](#arrange-tools)
   - [Undo / Redo](#undo--redo)
   - [Save / Load Layouts](#save--load-layouts)
   - [Export](#export)
4. [File Naming Convention](#4-file-naming-convention)
5. [How to Read the HTML File](#5-how-to-read-the-html-file)
   - [Overall Structure](#overall-structure)
   - [CSS Block](#css-block)
   - [HTML Structure](#html-structure)
   - [JavaScript Architecture](#javascript-architecture)
   - [State Object](#state-object)
   - [Key Functions Reference](#key-functions-reference)
6. [IKEA Frame & Shelf Presets](#6-ikea-frame--shelf-presets)
7. [Deployment on Netlify](#7-deployment-on-netlify)
8. [GitHub Workflow](#8-github-workflow)
9. [Local Storage & Data Persistence](#9-local-storage--data-persistence)
10. [Coming Soon](#10-coming-soon)

---

## 1. Project Purpose

This tool was built to solve a specific personal problem: planning gallery wall layouts for an apartment before putting holes in the wall. The goal is to have a precise, interactive planning environment where real artwork — with its actual dimensions, photos, and frame information — can be arranged on a to-scale virtual wall.

The tool is designed to be used primarily on an iPad, opened as a home-screen web app from a Netlify-hosted URL, requiring no App Store installation, no account, and no internet connection after the initial load.

The underlying philosophy is that the planning process should be **as close to reality as possible.** That means:
- Using actual outer frame dimensions (not print sizes)
- Uploading real photos of your artwork
- Blocking off physical constraints on the wall (furniture zones, light switches, thermostats)
- Seeing conflict warnings before anything is placed for real

---

## 2. What It Is

The Gallery Wall Planner is a **single HTML file** — approximately 2,400+ lines of self-contained HTML, CSS, and JavaScript. It has:

- No external dependencies except a Google Fonts stylesheet loaded at startup
- No server, backend, or database
- No login or account system
- All data stored locally in the browser via `localStorage`
- Full functionality offline after first load

The file is named `index.html` and is deployed to Netlify, making it accessible at a persistent URL from any device. It can be added to an iPad home screen via Safari's Share → Add to Home Screen, at which point it behaves as a standalone full-screen app with no browser chrome.

---

## 3. Current Features

### Two-Page Architecture

The app is organized into two full-screen pages, toggled by a navigation bar at the top:

**📦 Library Page**
The inventory management interface. This is where all artwork is uploaded, named, categorized, and stored. The Library is the source of truth for what you own — the Planner pulls from it.

**🖼 Planner Page**
The wall canvas interface. This is where you arrange, align, and visualize your layouts. It has its own toolbar, sidebar tabs, and canvas area.

The app starts on the Library page if the library is empty, and on the Planner if artwork already exists.

---

### Artwork Library

The library is a persistent card-based inventory of all your artwork.

**Adding artwork:**
- Tap **+ Add Artwork** on the Library page
- Select one or multiple files from Photos, Files, or iCloud Drive
- If multiple files are selected, the **Batch Review Modal** opens
- If a single file is selected, the **Single Add Modal** opens

**Filename parsing:**
When a file is selected, its filename is automatically parsed using a dash-separated naming convention (see Section 4). The following metadata is extracted and pre-filled:
- **Name** — derived from the first segment(s) of the filename, with CamelCase split into words
- **Type** — Photo, Map, Poster, Canvas, Print, Drawing, etc.
- **Framed status** — detected from keywords like "Framed" or "Canvas"/"Poster"
- **Frame color** — detected color name (Black, White, Gold, Navy, Blue, etc.)
- **Art color** — secondary color if present

**Per-item metadata controls:**
Each piece in the library has:
- Editable name field
- Type dropdown (Photo, Map, Poster, Canvas, Print, Drawing, Portrait, Other)
- Framed toggle (on/off)
- Frame color swatch row (14 named colors: Black, White, Grey, Silver, Gold, Brown, Navy, Blue, Red, Green, Beige, Natural, Walnut, Copper)
- Art color swatch row (same 14 colors)
- W × H dimension inputs with +/− steppers (0.25" increments)
- Portrait / Landscape orientation toggle (auto-swaps dimensions)
- IKEA frame preset dropdown (auto-fills dimensions)
- Photo preview

**Library cards** display:
- Thumbnail photo
- Name and dimensions
- Metadata badges: type, framed/unframed status, color dot with name
- Available / On Wall status badge
- Edit and Delete buttons

**One-instance rule:**
Each library item can only be placed on the wall once. Once placed, its card shows "On Wall" and the Place button grays out. Removing the piece from the wall returns it to Available status.

**Edit mode:**
Tapping Edit on any library card opens the full single-item modal pre-filled with all metadata, allowing updates to name, dimensions, type, colors, and framed status. The photo can also be replaced.

---

### Wall Planner

The planner consists of a toolbar across the top, a collapsible sidebar on the left, and a canvas in the center.

**Wall setup:**
In the Wall tab of the sidebar:
- Set wall dimensions in inches (width × height)
- Set wall background color
- Apply changes to rescale the entire canvas

**Adding artwork from library:**
In the Add tab → My Artwork section, all library items appear as a compact list with Place buttons. Tapping Place drops the piece onto the wall at the first available empty position (smart placement — scans the wall in a grid to avoid overlapping existing pieces).

**Adding IKEA frames directly:**
In the Add tab, collapsed under "IKEA Frames," frame styles are grouped by name (YLLEVAD, RIBBA, HOVSTA, KNOPPÄNG, RÖDALM, SANNAHED, SILVERHÖJDEN). Expanding a group reveals all available sizes. Tapping a size drops a black frame on the wall. The 📷 button on each size drops the frame and opens the camera immediately.

All IKEA presets use **outer frame dimensions**, not print size. For example, a RIBBA "holds 8×10 print" frame has an outer dimension of 9.75" × 11.75".

**Adding shelves:**
In the Add tab, collapsed under "Shelves & Ledges." Presets include all major IKEA ledge lines: MOSSLANDA (21.5" and 43"), RIBBA Ledge, EKET, LACK Wall Shelf, and HEMNES. Custom shelf dimensions can also be entered. Shelves render with a wood grain texture pattern.

**Custom sizes:**
Both artwork and shelves support fully custom width/height entry at the bottom of each accordion section.

**Exclusion Zones:**
Added from the Wall tab. These render as orange diagonal crosshatch areas on the canvas. Use them to block off furniture (couch, bed) or any area of the wall you can't hang things on. Once positioned and resized, they can be **locked** from the Arrange tab — locked zones cannot be accidentally dragged. Artwork overlapping a zone gets an orange outline warning.

**Fixtures:**
Added from the Wall tab. Fixtures represent physical wall elements: light switches, duplex outlets, thermostats, HVAC vents, smoke detectors, and windows. They render as small amber badges on the canvas. Artwork overlapping a fixture gets a yellow outline warning (softer than the orange zone warning, because sometimes covering a fixture is intentional).

---

### Conflict Detection System

Three-tier visual warning system:

| Color | Condition | Meaning |
|-------|-----------|---------|
| 🔴 Red outline | Artwork overlapping another artwork or a shelf | Hard conflict — pieces cannot physically coexist |
| 🟠 Orange outline | Artwork overlapping an exclusion zone | Strong warning — likely hanging in furniture zone |
| 🟡 Yellow outline | Artwork overlapping a fixture | Soft warning — may be intentional |
| 🟡 Amber dashed border | Two pieces closer than minimum gap | Spacing warning |

The minimum gap threshold (default: 1") is configurable in the Arrange tab. When gap warnings are enabled, any two pieces (artwork or shelves) whose nearest edges are closer than the threshold get amber dashed borders.

Conflict detection runs live on every drag, resize, and placement operation.

---

### Arrange Tools

Available in the **Arrange tab** of the sidebar, always visible regardless of selection state:

**Align** (requires 2+ selected):
- Left edges
- Right edges
- Top edges
- Bottom edges
- Center horizontally on wall
- Center vertically on wall

**Distribute** (requires 3+ selected):
- Horizontal — spaces items evenly between leftmost and rightmost
- Vertical — spaces items evenly between topmost and bottommost

**Group / Ungroup:**
Group combines selected pieces into a unit that moves together. Grouped pieces show a gold dot indicator in their bottom-right corner. Groups are preserved in saved layouts.

**Multi-select:**
Tap the **⊞ Select** button in the toolbar to enter Select Mode. In this mode, tapping pieces adds them to the selection without starting a drag. Tap Select again to exit. Shift-tap also works on desktop/keyboard.

**Delete Selected:**
Removes all selected pieces from the wall. Library pieces are returned to Available status.

---

### Undo / Redo

Full 50-level undo/redo stack. Snapshots are taken before:
- Adding any piece (artwork, shelf, zone, fixture)
- Dragging pieces (snapshot taken at drag start)
- Resizing zones (snapshot taken at resize start)
- Deleting pieces
- Grouping/ungrouping
- Editing properties (color, shape, label, dimensions)

**Toolbar buttons:** ↩ Undo, ↪ Redo
**Keyboard:** Cmd+Z (undo), Cmd+Shift+Z (redo)

Each undo/redo snapshot captures the full piece array, group memberships, and ID counters.

---

### Save / Load Layouts

**Saving:**
Tap 💾 Save in the toolbar. Enter a base name (e.g., "Living Room"). The layout is saved as "Living Room v1", then "Living Room v2" on the next save with the same base name — automatically versioned. No overwriting.

**Loading:**
Tap 📂 in the toolbar to open the layouts modal. Each saved layout shows its versioned name and timestamp. Tap Load to restore a layout (fully reconstructs all pieces, groups, and wall settings). Tap ✕ to delete.

Saved layouts are also listed in the Wall tab sidebar for quick access.

All layouts are stored in `localStorage` under the key `gwp_layouts`.

---

### Export

**PNG Export:**
Tap ↓ PNG in the toolbar. Renders the wall canvas at 2× device pixel ratio (retina quality) to an off-screen canvas, then triggers a download of `gallery-wall.png`. Includes all pieces, images, shelf textures, and dimension labels if Dims is toggled on.

---

### View Toggles (Toolbar)

| Button | Default | What it does |
|--------|---------|-------------|
| Dims | Off | Shows W × H labels on every piece on the canvas |
| Gaps | Off | Activates amber gap warning highlights |
| Grid | Off | Overlays a 6-inch grid on the wall canvas |

---

## 4. File Naming Convention

The app parses filenames using a **dash-separated metadata schema:**

```
Name-Color-FrameStatus-Type.ext
```

**Examples:**
```
GameOfThrones-Map-Canvas-Poster.jpeg
→ Name: "Game Of Thrones", Type: Poster, Unframed (Canvas keyword detected)

Hampton-Black-Framed-Map.jpeg
→ Name: "Hampton", Type: Map, Framed: Yes, Frame Color: Black

NavyGroup-Blue-Framed-Photo.jpeg
→ Name: "Navy Group", Type: Photo, Framed: Yes, Frame Color: Blue
```

**Parsing rules:**
- Filename is stripped of its extension and any leading underscores
- Split on `-` dashes
- Each segment is checked against known keyword lists:
  - **Frame status keywords:** `Framed`, `Frame` → sets framed: true
  - **Unframed keywords:** `Canvas`, `Poster`, `Print`, `Unframed` → sets framed: false
  - **Type keywords:** Photo, Map, Poster, Canvas, Print, Drawing, Portrait, Other
  - **Color keywords:** Black, White, Grey, Gray, Silver, Gold, Brown, Navy, Blue, Red, Green, Beige, Natural, Walnut, Copper
- CamelCase name segments are split into words (`NavyGroup` → "Navy Group")
- Segments not matching any keyword become the name
- If the piece is framed and a color is found, that color is treated as the frame color

All parsed values are pre-filled in the modal and fully editable before confirming.

---

## 5. How to Read the HTML File

The file `index.html` is entirely self-contained. Here is its anatomy:

### Overall Structure

```
<!DOCTYPE html>
<html>
  <head>
    <!-- Meta tags, Google Fonts link -->
    <!-- <style> block — all CSS -->
  </head>
  <body>
    <!-- Top Navigation Bar (#app-nav) -->
    <!-- Library Page (#page-library) -->
    <!-- Planner Page (#page-planner) -->
      <!-- Planner Toolbar (#tb) -->
      <!-- Planner Main (#main) -->
        <!-- Sidebar (#sb) — Add, Arrange, Wall tabs -->
        <!-- Canvas (#ca) — wall-wrap > wall -->
      <!-- Status Bar (#status) -->
    <!-- Hidden file inputs -->
    <!-- Modal overlays (Save, Layouts, Crop, Add to Library, Batch Review) -->
    <!-- <script> block — all JavaScript -->
  </body>
</html>
```

---

### CSS Block

Located inside `<style>` tags in the `<head>`. Organized into labeled sections:

| Section | What it styles |
|---------|---------------|
| `:root` | CSS custom properties (color palette, spacing tokens) |
| `#app-nav` | Top navigation bar and nav tabs |
| `.page` | Full-screen page containers |
| `#lib-page-inner`, `#lib-grid`, `.lib-card` | Library page layout and cards |
| `#tb` | Planner toolbar |
| `#main`, `#sb` | Planner layout, sidebar |
| `.tabs`, `.tab`, `.tc` | Sidebar tab system |
| `.pnl`, `.ptitle` | Sidebar panel sections |
| `.btn`, `.btn-f` | Reusable button styles |
| `.fg`, `.fg-hdr`, `.fg-sizes`, `.fs-row` | IKEA frame group accordion |
| `.acc-hdr`, `.acc-body` | Generic accordion sections |
| `.pc` | Base piece style (position:absolute, grab cursor) |
| `.pc.shelf-pc`, `.pc.zone-pc`, `.pc.fixture-pc` | Piece type variants |
| `.pc.conflict`, `.pc.owarn`, `.pc.ywarn`, `.pc.gw` | Conflict/warning states |
| `.rh`, `.rh-nw/ne/se/sw` | Zone resize handle corners |
| `.overlay`, `.modal` | Modal overlay system |
| `.lib-item`, `.lib-thumb`, `.lib-place` | Sidebar compact library list |
| `.meta-badge`, `.badge-type/framed/color` | Metadata badge styles |
| `.batch-item`, `.batch-thumb` | Batch review modal |
| `.toggle`, `.toggle-track`, `.toggle-thumb` | iOS-style toggle switch |
| `.csw` | Color swatch selector |
| `.stepper-btn` | Dimension +/− buttons |
| `#status` | Bottom status bar |

**Color tokens (`:root`):**
```css
--bg        #0b0b10    /* Page background */
--sidebar   #111118    /* Sidebar/toolbar background */
--panel     #17171f    /* Modal/card background */
--border    #21212e    /* Subtle borders */
--border2   #2c2c3e    /* Stronger borders */
--accent    #1b3a63    /* Dark blue accent (buttons, selection) */
--gold      #c4a24a    /* Gold accent (brand, highlights) */
--text      #dcdce8    /* Primary text */
--muted     #6a6a80    /* Secondary/label text */
--dim       #35354a    /* Disabled/placeholder */
--input     #1a1a25    /* Input field background */
```

---

### HTML Structure

**Navigation (`#app-nav`):**
Two nav tabs (`nav-library`, `nav-planner`) toggle the visible page. Active tab gets the `.on` class.

**Library Page (`#page-library`):**
- `#lib-page-header` — title, search input, + Add Artwork button
- `#lib-grid` — CSS grid of `.lib-card` elements, rendered dynamically
- `#lib-empty` — shown when library is empty

**Planner Page (`#page-planner`):**

*Toolbar (`#tb`):*
Fixed-height row of `.btn` elements. Overflow scrolls horizontally. Buttons call global JS functions directly via `onclick`.

*Sidebar (`#sb`):*
Three-tab system. Each tab content area has id `tc-add`, `tc-props`, `tc-wall`. The active tab gets class `.on`. The sidebar can be collapsed via the ☰ button, which adds class `.closed` and uses CSS `width` transition.

*Canvas (`#ca`):*
Flex container that centers the wall. Contains `#wall-wrap` which contains `#wall`. The wall `div` is sized in pixels based on `S.wall.w × S.scale` and `S.wall.h × S.scale`. All pieces are absolutely positioned children of `#wall`.

*Pieces on the wall:*
Each piece is a `div` with id `p{id}` and `data-id` attribute. Classes determine appearance:
- `.pc` — base
- `.pc.shelf-pc` — shelf type
- `.pc.zone-pc` — exclusion zone
- `.pc.fixture-pc` — fixture
- `.pc.oval` — oval/circle artwork
- `.pc.sel` — currently selected (blue outline)
- `.pc.conflict` — red conflict
- `.pc.owarn` — orange zone overlap
- `.pc.ywarn` — yellow fixture overlap
- `.pc.gw` — amber gap warning
- `.pc.grp` — member of a group (gold dot shown via CSS `::after`)

Each artwork piece contains two child divs:
- `.pc-img` — background-image div for uploaded photo
- `.pc-lbl` — label overlay with `.pc-name` and `.pc-dims` spans

*Modals:*
All modals are `.overlay.hide` divs at the bottom of `<body>`. They use `position:fixed` to cover the full viewport. `.hide` is `display:none !important`. Each modal contains a `.modal` div with content.

---

### JavaScript Architecture

All JavaScript is in a single `<script>` block at the bottom of `<body>`. It uses `'use strict'` mode. There are no classes — the entire app is organized as module-style functions operating on a shared state object `S`.

The code is organized into labeled sections with banner comments:

```
CONSTANTS           — FRAME_GROUPS, IKEA_LEDGES, FIXTURE_PRESETS, COLOR_PALETTE, etc.
STATE               — S object definition
UTILS               — getAllPieces, getPiece, clamp
UNDO/REDO           — snapshot, pushUndo, applySnapshot, undo, redo
INIT                — init() — wired to DOMContentLoaded
WALL & SCALE        — reScale(), applyWall()
ADD PIECES          — quickAdd, quickAddShelf, addCustomArtwork, addZone, quickAddFixture
CREATE DOM ELEMENTS — mkArtEl, mkShelfEl, mkZoneEl, mkFixtureEl
SELECTION           — select, deselectAll, refreshSel
DRAG                — pieceDown, canvasDown, onDocMove, onDocUp, resizeDown
RENDER ALL          — renderAll, renderPiece
CONFLICTS           — rectsOverlap, gapBetween, checkConflicts, renderConflicts
SMART PLACEMENT     — findEmptySpot
GROUPS              — doGroup, doUngroup
DISTRIBUTE/ALIGN    — distH, distV, alignL, alignR, alignT, alignBot, ctrH, ctrV
PROPS PANEL         — updatePropsPanel
TOGGLES             — showPage, toggleDims, toggleGaps, toggleGrid, toggleSidebar, toggleSelMode
DELETE              — deleteSelected
IMAGE UPLOAD/CROP   — triggerFileUpload, triggerCameraUpload, onFileSelected, openCrop, updateCrop, drawCropCanvas, confirmCrop, removeImg
FILENAME PARSER     — camelToWords, parseFilename
ARTWORK LIBRARY     — openAddToLibrary, openSingleAddModal, buildModalSwatches, syncFramedUI, getSelectedSwatch, triggerLibUpload, confirmAddToLibrary, openEditLibItem, renderLibrary
BATCH UPLOAD        — openBatchReview, renderBatchList, confirmBatch
SAVE/LOAD LAYOUTS   — openSave, updateSavePreview, saveLayout, loadLayout, deleteLayout, persistLayouts, renderLayoutsSidebar, openLayouts, renderLayoutsModal
EXPORT              — exportPNG (async)
MODALS              — closeModal
TABS                — switchTab, toggleAcc
STATUS              — updateStatus
KEYBOARD            — onKey, nudge
TOAST               — showToast
UTILS               — esc
START               — window.addEventListener('DOMContentLoaded', init)
```

---

### State Object

The entire application state lives in a single object `S`:

```javascript
S = {
  wall: {w, h, c}            // Wall dimensions (inches) and color
  pieces: []                 // Array of all piece objects on the wall
  groups: {}                 // Map of gid → Set of piece IDs
  sel: Set                   // Currently selected piece IDs
  dims: false                // Dimension labels toggle
  gaps: false                // Gap warning toggle
  grid: false                // Grid overlay toggle
  minGap: 1                  // Minimum gap threshold in inches
  layouts: []                // Saved layout objects (also in localStorage)
  library: []                // Artwork library (also in localStorage)
  nid: 1                     // Next piece ID (auto-increments)
  ngid: 1                    // Next group ID (auto-increments)
  scale: 7                   // Pixels per inch (recalculated on resize)
  drag: null                 // Active drag state
  cropState: null            // Active crop modal state
  cropPieceId: null          // Which piece is being cropped
  undoStack: []              // Undo snapshots (max 50)
  redoStack: []              // Redo snapshots
  selMode: false             // Multi-select mode toggle
}
```

**Piece object schema:**

```javascript
{
  id: number,              // Unique integer ID
  type: 'art'|'shelf'|'zone'|'fixture',
  x: number,              // Left edge position in inches
  y: number,              // Top edge position in inches
  w: number,              // Width in inches
  h: number,              // Height in inches
  shape: 'rect'|'oval',   // Art only
  color: '#rrggbb',       // Background color
  img: string|null,       // Base64 JPEG data URL
  imgOX: number,          // Image pan offset X (pixels)
  imgOY: number,          // Image pan offset Y (pixels)
  imgZ: number,           // Image zoom (1.0 = 100%)
  label: string,          // Display label
  gid: string|null,       // Group ID if grouped
  zi: number,             // z-index
  locked: boolean,        // Zone locked state
  conflict: boolean,      // Red conflict flag
  gw: boolean,            // Amber gap warning flag
  owarn: boolean,         // Orange zone overlap flag
  ywarn: boolean,         // Yellow fixture overlap flag
  libId: number|null,     // Library item ID if placed from library
  icon: string,           // Fixture emoji icon
}
```

**Library item schema:**

```javascript
{
  id: number,             // Timestamp-based unique ID
  name: string,
  w: number,              // Outer frame width in inches
  h: number,              // Outer frame height in inches
  img: string|null,       // Base64 image data URL
  type: string,           // Photo, Map, Poster, etc.
  framed: boolean,
  color: {hex, name}|null,       // Art/mat color
  frameColor: {hex, name}|null,  // Frame color
  placedId: number|null,  // Piece ID if currently on wall
}
```

---

### Key Functions Reference

| Function | What it does |
|----------|-------------|
| `init()` | Wires all event listeners, populates IKEA dropdowns, loads localStorage, builds preset lists, calls `showPage()` |
| `reScale()` | Calculates `S.scale` from canvas size and wall dimensions, updates wall pixel size, re-applies grid if active |
| `findEmptySpot(w, h)` | Scans wall in a grid to find first non-overlapping position for a new piece |
| `mkArtEl(p)` | Creates the DOM element for an artwork piece and appends it to `#wall` |
| `renderPiece(p)` | Updates an existing piece's DOM element to reflect current state (position, size, color, conflict classes, image) |
| `checkConflicts()` | Iterates all pieces and sets conflict/warning flags based on overlap geometry |
| `rectsOverlap(a, b)` | Returns true if two piece rectangles overlap |
| `gapBetween(a, b)` | Returns the gap distance and direction between two non-overlapping pieces |
| `pieceDown(e, id)` | Handles pointerdown on a piece — manages selection and initiates drag |
| `onDocMove(e)` | Document-level pointermove — handles drag translation and resize |
| `pushUndo()` | Serializes current state and pushes to undo stack |
| `applySnapshot(snap)` | Deserializes a snapshot, clears and rebuilds the entire wall DOM |
| `parseFilename(filename)` | Parses dash-separated filename into metadata object |
| `openBatchReview(files)` | Reads multiple FileList entries, parses filenames, builds batch review modal |
| `confirmBatch()` | Iterates `batchQueue`, adds all valid items to `S.library`, persists |
| `saveLayout()` | Auto-versions and saves current state to `S.layouts` and `localStorage` |
| `exportPNG()` | Async canvas redraw at 2× DPR for retina export |
| `showPage(name)` | Switches between library and planner pages |

---

## 6. IKEA Frame & Shelf Presets

All frame presets use **outer frame dimensions**, not the print size the frame name implies.

| Frame Name | Holds | Outer W | Outer H |
|------------|-------|---------|---------|
| YLLEVAD | 4×6 print | 8.25" | 11.75" |
| RIBBA | 5×7 print | 6.75" | 8.75" |
| RIBBA | 8×10 print | 9.75" | 11.75" |
| RIBBA | 9×12 print | 10.75" | 13.75" |
| RIBBA | 12×16 print | 13.75" | 17.75" |
| RIBBA | 16×20 print | 17.75" | 21.75" |
| RIBBA | 19×27 print | 20.87" | 28.74" |
| RIBBA | 24×35 print | 25.75" | 36.75" |
| HOVSTA | 10×12 print | 11.75" | 13.75" |
| HOVSTA | 12×16 print | 13.75" | 17.75" |
| KNOPPÄNG | 5×7 print | 6.75" | 8.75" |
| KNOPPÄNG | 11×14 print | 12.75" | 15.75" |
| RÖDALM | 10×12 print | 11.75" | 13.75" |
| RÖDALM | 12×16 print | 13.75" | 17.75" |
| SANNAHED | 4×6 print | 6.75" | 8.75" |
| SILVERHÖJDEN | 8×10 print | 9.75" | 11.75" |

> ⚠️ RIBBA 19×27 is verified. All others are accurate estimates — measure your actual frames when precision matters.

**Shelf presets:**

| Shelf Name | Length | Height |
|------------|--------|--------|
| MOSSLANDA 21.5" | 21.5" | 3.5" |
| MOSSLANDA 43" | 43.3" | 3.5" |
| RIBBA Ledge 21.5" | 21.5" | 3.5" |
| RIBBA Ledge 43" | 43.3" | 3.5" |
| EKET Shelf | 13.75" | 5.5" |
| LACK Wall Shelf | 43.3" | 10.2" |
| HEMNES Shelf | 45.5" | 8.25" |

---

## 7. Deployment on Netlify

The app is hosted on Netlify as a static site.

**Current setup:**
- Site URL: `gwall-designer.netlify.app` (custom Netlify subdomain)
- Repository: connected to GitHub
- Auto-deploy: enabled — Netlify watches the `main` branch and redeploys automatically on every push

**How auto-deploy works:**
1. Edit `index.html` on your local machine (or in GitHub's web editor)
2. Commit and push to the `main` branch on GitHub
3. Netlify detects the push within seconds and rebuilds the site
4. The updated version is live at your URL within ~30–60 seconds

**Plan:** Free tier. No expiration. 100GB bandwidth/month (more than sufficient for a personal tool). No credit card required.

**Adding to iPad home screen:**
1. Open your Netlify URL in Safari on iPad
2. Tap the Share button (box with arrow pointing up)
3. Tap "Add to Home Screen"
4. Name it (e.g., "Gallery Wall") and tap Add
5. The app appears as an icon and opens full-screen with no browser chrome

---

## 8. GitHub Workflow

**Updating the deployed site:**

*Option A — GitHub web editor (easiest):*
1. Go to github.com and open your repository
2. Click `index.html`
3. Click the pencil ✏️ icon to edit
4. Make changes or replace the entire file content
5. Scroll down and click **Commit changes**
6. Netlify auto-deploys within ~60 seconds

*Option B — Upload new file:*
1. Go to your repository on github.com
2. Click **Add file → Upload files**
3. Drag your updated `index.html` onto the page
4. GitHub will ask how to handle the conflict — choose to replace the existing file
5. Commit — Netlify auto-deploys

*Option C — Terminal (most reliable for larger edits):*
```bash
cd /path/to/your/project
# Copy updated file to project folder
git add index.html
git commit -m "Describe what you changed"
git push origin main
```

**Important:** The file must always be named `index.html`. Netlify serves `index.html` as the default document for the root URL. Any other filename will return a 404.

---

## 9. Local Storage & Data Persistence

The app uses the browser's `localStorage` API to persist data between sessions. No server or account is required.

**Storage keys:**

| Key | Contents |
|-----|----------|
| `gwp_layouts` | JSON array of saved layout objects |
| `gwp_library` | JSON array of artwork library items |

**Important limitations:**
- Data is stored **per browser per device**. Your iPad and laptop have separate localStorage — they do not sync automatically.
- If you clear browser data or use a private/incognito window, all data is lost.
- Images are stored as base64-encoded JPEG strings inside the JSON. A library with many high-resolution photos can grow large. `localStorage` has a limit of approximately 5–10MB depending on the browser. If it fills up, a toast notification warns you.
- Layouts saved on one device cannot be loaded on another without manually exporting/importing (not yet implemented — see Coming Soon).

**Viewing your stored data (for debugging):**
In Safari on iPad, connect to a Mac and use Safari's Web Inspector:
1. Mac: Safari → Preferences → Advanced → Show Develop menu
2. Connect iPad via USB, enable Web Inspector on iPad (Settings → Safari → Advanced)
3. Mac: Develop menu → [your iPad] → gwall-designer.netlify.app
4. Console tab → type: `JSON.parse(localStorage.getItem('gwp_library'))` to inspect

---

## 10. Coming Soon

The following features have been discussed and are planned for future development:

### Cross-Device Sync
Currently data lives only in `localStorage` on the device it was created on. The planned solution is **Firebase with anonymous authentication** — the app silently generates a device token, saves layouts and library data to a cloud database, and syncs across any device that visits the same URL. No login required. This would also protect data from browser clears.

### Multi-Wall / Room Layout
Ability to manage multiple walls within a single project — for example, "Living Room North Wall," "Bedroom East Wall," "Hallway." Each wall would have its own dimensions, color, and layout while sharing the same artwork library. The Planner would have a wall selector at the top (tab bar or dropdown). Layouts would be organized by wall, not just by name.

### Pinch-to-Zoom on Canvas
Pan and zoom the wall canvas with two-finger pinch/spread gesture on iPad. Would allow zooming in to precisely position small pieces or view a large wall at full size.

### JSON Export / Import
Download your entire library and all saved layouts as a single JSON file, and import it on another device. This would be the manual workaround for cross-device sync.

### Apartment/Room Floorplan View
A bird's-eye view of a room or apartment showing multiple walls. Clicking a wall opens the planner for that specific wall. This is a significant undertaking but would make the tool much more useful for planning an entire apartment at once.

### Resize Handles on All Piece Types
Currently resize handles (corner drag) are only implemented for exclusion zones. The plan is to extend this to artwork and shelves as well, allowing intuitive resize-by-drag instead of editing numbers in the props panel.

### Custom Frame Colors on Wall Pieces
Library metadata tracks frame color, but the wall piece color is currently a single flat color. The plan is to render a visible frame border around artwork pieces using the frame color from library metadata, with the mat/art color filling the interior.

### Shelf Artwork Integration
The ability to place small artwork pieces *on top of* ledge shelves in a way that visually groups them — showing artwork as sitting on the shelf rather than floating independently.

### Photo Repositioning After Placement
Currently, the image crop/pan modal only runs at the time of initial upload. Post-placement photo repositioning (tap to reopen the crop modal for an already-placed piece) is not yet implemented.

---

*This README was generated in collaboration with Claude (Anthropic) and reflects the state of the project as of the most recent build session. The app is a living personal tool — expect continued iteration.*
