# CPEE Cockpit Themes — Author's Guide

This document explains, in detail, how `themes` works and how to build your own theme: your own directory, your own element hierarchy, your own SVG symbols, and your own RelaxNG (`.rng`) schemas.

## Table of contents

1. [The anatomy of a theme directory](#1-the-anatomy-of-a-theme-directory)
2. [Creating your own theme, step by step](#2-creating-your-own-theme-step-by-step)
3. [The `theme.js` file: class skeleton and instance flags](#3-the-themejs-file-class-skeleton-and-instance-flags)
4. [Inside `theme.js` - the element hierarchy](#4-inside-themejs---the-element-hierarchy)
   1. [Defining an element](#41-defining-an-element)
   2. [Handling element rendering](#42-handling-element-rendering)
   3. [Handling interaction with the element](#43-handling-interaction-with-the-element)
5. [Defining a UI for elements - RelaxNG schemas (`.rng`)](#5-defining-a-ui-for-elements---relaxng-schemas-rng)
6. [Defining Element looks - SVG symbols](#6-defining-element-looks---svg-symbols)
7. [Styling Elements - CSS class reference](#7-styling-elements---css-class-reference)
8. [Worked example: adding a new element end-to-end](#8-worked-example-adding-a-new-element-end-to-end)

---

## 1. The anatomy of a theme directory

```
themes/<yourtheme>/
├── theme.js       # required — defines WFAdaptorManifestation
├── rngs/          # real dir OR symlink to another theme's rngs/
└── symbols/       # real dir OR symlink to another theme's symbols/
```

Look at the existing themes and a pattern jumps out immediately:

```
$ ls -la themes/presetid themes/reduced themes/control
presetid:  rngs -> ../preset/rngs/     symbols -> ../preset/symbols/     theme.js
reduced:   rngs -> ../preset/rngs/     symbols -> ../preset/symbols/     theme.js
control:   rngs -> ../preset/rngs/     symbols -> ../preset/symbols/     theme.js
```

`cockpit/themes/default` is itself nothing but a symlink: `default -> preset/`.

Only themes that actually ship **different icons** have a real `symbols/` directory (`preset`, `preset_model`), and only themes that ship **different attribute schemas** have a real `rngs/` directory (`preset`, `preset_model`, `model`, `felix`). Everyone else symlinks the whole directory to `preset`'s, because `theme.js` there only overrides *JS behaviour* (labels, info, event wiring) — it doesn't need new visuals at all.

**Rule of thumb:**

* Only touching labels/behaviour in `theme.js`? → symlink both `rngs/` and `symbols/` to an existing complete set (usually `preset`).
* Need to change a handful of icons but nothing else? → make `symbols/` a **real** directory containing a full copy of the base set (see `preset_model/symbols/`, which is a full copy of `preset/symbols/` with only `closed_loop*.svg` and `terminate.svg` actually modified), and keep `rngs/` symlinked.
* Need custom attributes (new RelaxNG rules) too? → make `rngs/` real as well (see `model/rngs/`, which is a full copy of `preset/rngs/` minus files it never references, e.g. `start.rng`).

You cannot symlink individual files *inside* a directory that is itself a symlinked directory (the symlink replaces the whole directory entry) — if you want to override just one icon, you need a real `symbols/` directory containing every file the theme's active elements reference (copy the full set once, then edit the ones you care about).

---

## 2. Creating your own theme, step by step

1. **Pick a name** and create the directory: `themes/mytheme/`.
2. **Decide on assets.** If you're not changing any icons or schemas:
   ```
   cd cockpit/themes/mytheme
   ln -s ../preset/symbols/ symbols
   ln -s ../preset/rngs/ rngs
   ```
   If you *are* changing icons, copy instead of symlinking:
   ```
   cp -r ../preset/symbols ./symbols
   ln -s ../preset/rngs/ rngs
   ```
3. **Write `theme.js`**. At minimum:
   ```js
   WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
     constructor(adaptor) {
       super(adaptor);
     }
   }
   ```
   This alone gives you a fully working, unmodified copy of the base behaviour.
4. **Register the theme** wherever the hosting page lets the user pick a theme name (the  theme name is just the directory name, passed as `theme` when constructing  `new WfAdaptor(data-theme-base + '/' + theme + '/theme.js', ...)`.
5. **Iterate**: override instance flags, per-element behaviour, or whole new elements as needed, reloading the HTML that renders a BPMN with your theme to see the effect.

---

## 3. The `theme.js` file: class skeleton and instance flags

```js
WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    var self = this;

    // instance-level flags (all default false unless noted)
    this.compact = true;         // shorter/split multi-line labels
    this.rotated_labels = false; // labels drawn at -30deg
    this.striped = true;         // alternating row background stripes

    // per-element overrides
    this.elements.critical.illustrator.label = function(node) { ... };
  }
}
```

`super(adaptor)` must run first; every override below it patches what `base.js` already built, it does not need to redeclare things from scratch.

---

## 4. Inside `theme.js` - the element hierarchy

`this.elements.<tagname>` maps 1:1 to an XML tag name in the process description (e.g. `this.elements.critical` describes `<critical>...</critical>` nodes). Two ways to add or extend elements:

**A. Override an existing element** (most common): reach into `this.elements.<tag>` after `super(adaptor)` and replace/patch a property. Since `super()` already built the whole object, you can either replace a whole sub-object or just one function:

```js
this.elements.choose.illustrator.label = null;  // suppress a label
```

**B. Define a brand-new element** with `'parent'`. This is how *sub-variants* of anelement are declared in `base.js` itself (e.g. `parallel_branch_normal` /`parallel_branch_event` are both `'parent': 'parallel_branch'`). The theme loader walks every element once at load time and, for any element with a `parent`, **copies down** whatever the child didn't specify itself.

So a `parent`-based element only needs to state what's *different* — typically just its own `svg` (icon) — and inherits every other illustrator key, its `type`, its `description` schema, and its `adaptor` event map from the parent:

```js
this.elements.critical_finish = {
  'type': 'primitive',
  'illustrator': {
    'endnodes': 'this',
    'svg': self.adaptor.theme_dir + 'symbols/event_end.svg'
  }
};
```

`type` is one of:

- `'complex'` — has children, gets recursed into, gets a translucent "tile" background rect.
- `'primitive'` — a leaf, just an icon (and maybe a label).
- `'abstract'` — implicit default for elements that exist only to be inherited from via `parent` and are never drawn directly themselves.

---

### 4.1. Defining an element

Every key that appears as a **direct** property of `this.elements.<tag>` (not nested inside `illustrator`):

| Key | Value | Purpose |
|---|---|---|
| `type` | `'complex' or 'primitive' or 'abstract' `| Drives whether `parse()` recurses and whether a tile background is drawn. |
| `illustrator` | `Object` | Everything about how/where this element is drawn. |
| `description` | `string (path) `| Path to this element's `.rng` schema, used to render the attribute-editing panel on the right of the graph view. |
| `parent` | `string (tag name)` | Inherit `illustrator` / `type` /`description` / `adaptor` keys not explicitly set on this element, from the named parent element. |
| `permissible_children` | `function(node, mode)` | Returns the array of `{label, function_call, menu_icon, type, params}` entries shown in the right-click "Insert into" / "Insert after" menu, depending on `mode` (`'into'` or `'after'`). |
| `permissible_children_expert` | `function(node, mode)` | Same shape, shown under a separate "…(Experts Only!)" submenu — used for structures that are technically legal but not part of the guided/simple menu (e.g. nesting `parallel` inside `critical`). |
| `removable_children` | `function(node)` | Returns extra "Remove X" menu entries for optional child structures that aren't ordinary XML children removable by the generic delete action (e.g. removing the `<code>` block under `callmanipulate`). |
| `adaptor` | `object (event map)` | DOM event handlers bound to displayed element. |
| `neverdelete` | `'true' or 'false'` | Marks this element's XML node as undeletable by the generic "Remove Element" action; used for e.g. `otherwise`. |

---

### 4.2. Handling element rendering

These are the keys read by the layout/rendering engine. All are optional unless
noted; unset booleans behave as `false`/absent.

| Key | Type | Purpose |
|---|---|---|
| `svg` | `string (path)` | The icon file. Fetched once via AJAX at theme-load time and replaced in-place with the parsed document, then cloned per drawn instance. |
| `endnodes` | `'this' \| 'aggregate' \| 'passthrough'` | Controls what "the connection point(s) leaving this element" are, once it and any children/closing symbol have been drawn. `'this'`: only this element itself is an endpoint (used by primitives, and by elements whose own drawn position is the real exit point, e.g. `critical_finish`). Anything else: the element's *children's* endpoints propagate through (used by containers whose exit is wherever their last child ends, e.g. `critical`, `parallel`, `choose`). |
| `closeblock` | `true \| false` | When `true`, an extra "loop-back" connection is drawn from this element back up to its block's start (used for the closing element of a loop: `loop_finish`, `loop_head_finish`). |
| `border` | `'visual' \| 'structural'` | Draws a dashed rounded-rect box around the element's block. `'visual'`: just decoration — connections still terminate at/leave from the icon itself (used by `parallel_branch_event`, `group`). `'structural'`: in addition, incoming/outgoing connections stop at the **border edge** instead of the icon (see below) — currently only `critical` uses this. |
| `closing_symbol` | string (element key) | Name of another element (usually a `parent`-linked sibling-type, e.g. `critical_finish`, `parallel_finish`, `choose_finish`, `loop_finish`) drawn automatically right after this element's children, to visually "close" the block. Also makes the `border`/tile rect grow one extra row to enclose it. |
| `wide` | `true` | Marks an icon as occupying its own extra grid column instead of reusing the block's first row's column — **"only for the special case of variable parallel, only `event_end` has it, all others should reference the first row"**. Don't set this unless you're doing exactly that. |
| `noarrow` | `true \| false` | When `true`, suppresses the normal incoming arrow and instead uses the alternate "straight join line, no arrowhead" routing. Used by `parallel_branch_event` (`noarrow: false` there, i.e. explicit default). |
| `expansion` | `function(node) → 'vertical' \| 'horizontal'` | For `type: 'complex'` elements: do children stack as a sequential column (`'vertical'`, e.g. `critical`, `parallel_branch`, `group`) or lay out side-by-side (`'horizontal'`, e.g. `choose`'s alternatives, `parallel`'s branches when it has non-`parallel_branch` children)? |
| `col_shift` | `function(node) → boolean` | Whether entering this element's children indents them one grid column to the right (nested visual indentation, matching a drawn border/tile box). `true` for `parallel`, `group`; `false` for `critical` (its structural border is tight against the icon's own column, no extra indent). |
| `resolve_symbol` | `function(node, shift)` returning an element key, **or** a literal string | Redirects which element's *icon* gets drawn for this XML tag, without changing the tag itself or its RNG schema — e.g. `choose_finish` picks between `choose_inclusive_finish`/`choose_exclusive_finish` based on `node`'s `mode` attribute; `parallel_branch` picks between `parallel_branch_normal`/`parallel_branch_event` based on the `shift` argument (which is that element's own `col_shift(node)` result). |
| `label` | `function(node) → [{column, value}, ...]` or `null` | Text shown next to the icon (rendered into the `part-middle` group of the. Return an array so multiple stacked lines/columns are possible (e.g. Label + Average). Set to `null` to explicitly suppress a label a parent theme added. Almost always reads an XML attribute, e.g. `$(node).attr('sid')`, `$(node).attr('condition')`. |
| `style` | `function(node) → {cssProperty: value, ...}` | Per-instance inline style applied to every shape carrying the `.colorstyle` class inside this icon. Typically used to let a user set a custom color per node, e.g. `{'fill': $(node).attr('color')}`. |
| `info` | `function(node) → {attrName: value, ...}` | Extra HTML attributes stamped onto the drawn element (e.g. `element-endpoint`, `element-alt_id`), consumed later for lookups/menu icon rendering. |
| `final` | `true` | Marks this element as a true dead-end (used by `terminate`) — downstream connection logic skips drawing anything past a `final` endpoint. |
| `rotatelabels` | `true \| false` | Per-element opt-out/opt-in for the manifestation-level `rotated_labels` flag. |
| `noindent` | `true` | Per-element opt-out of the default indent-first-column behavior in horizontal expansions. |

`border: 'structural'` is the mechanism built for subprocesses. When an element's `border` is
`'structural'` an border is painted around all subelements, with arrows connected to the boundary instead of the elements insid

---

### 4.3. Handling interaction with the element

```js
'adaptor': {
  'mousedown':   function(node,e) { self.events.mousedown(node,e,true,true); },
  'touchstart':  function(node,e) { self.events.touchstart(node,e,true,true); },
  'touchend':    self.events.touchend,
  'click':       self.events.click,
  'dblclick':    self.events.dblclick,
  'mouseover':   self.events.mouseover,
  'mouseout':    self.events.mouseout,
}
```

These events are bound on the rendered elements, dispatching to the function with the DOM element's `element-id`. You
almost never write new handler bodies — `WFAdaptorManifestationBase` already implements
the shared interaction vocabulary:

| Handler | Purpose |
|---|---|
| `mousedown(svgid,e,child,sibling)` | Selection + (with `child`/`sibling` flags) opens the context menu offering "Insert into"/"Insert after" using `permissible_children`. |
| `touchstart` / `touchend` | Touch equivalents of mousedown/click, with long-press → context menu. |
| `click` | Populates the details panel (`update_details`) from this node's RNG. |
| `dblclick` | Usually a shortcut into editing (theme-specific — see `model/theme.js`/`control/theme.js` for concrete uses). |
| `mouseover` / `mouseout` | Hover highlight (`.hoverstyle`). |
| `dragstart` | Enables dragging this node elsewhere in the tree (only wired up for a few elements, e.g. `callmanipulate`/`manipulate`'s inner `<code>` block). |
| `suppress` | No-op stub — used for icons that should not react to interaction (e.g. `end`, `event_end`). |

`type: 'complex'` elements typically bind all seven; simple, non-interactive closing icons only bind `mousedown: suppress`. Copy the block from a similar existing element rather than inventing new handler wiring.

---

## 5. Defining a UI for elements - RelaxNG schemas (`.rng`)

`<yourtheme>/rngs/<tag>.rng` is a single `<element>` RelaxNG fragment (namespaced
`rngui` extensions layered on top for the UI form generator, `RelaxNGui`). It defines which
attributes/child elements are editable in the right-hand details panel when a node is
selected, and it's what actually gets merged back into the saved XML.

Minimal example (`critical.rng`):

```xml
<element xmlns="http://relaxng.org/ns/structure/1.0" xmlns:rngui="http://rngui.org"
          rngui:version="1.2" name="critical"
          datatypeLibrary="http://www.w3.org/2001/XMLSchema-datatypes"
          ns="http://cpee.org/ns/description/1.0">
  <attribute name="eid" rngui:label="ID" rngui:default="javascript:get_free_id('e','eid')">
    <data type="string" rngui:readonly="true"/>
  </attribute>
  <attribute name="sid" rngui:label="SID" rngui:default="section"
             rngui:hint="Identical SID's shared between different 'critical' elements define mutual exclusive areas.">
    <data type="string"/>
  </attribute>
</element>
```

A richer example (`choose.rng`) shows a `<choice>` attribute (rendered as a dropdown) and
nested `rngui:ignore="true"` child elements (structural children that the form generator
should not itself let the user add/remove, because the graph UI already manages them via
its own "Insert alternative" menu commands):

```xml
<attribute name="mode" rngui:label="Mode" rngui:default="exclusive">
  <choice>
    <value>exclusive</value>
    <value>inclusive</value>
  </choice>
</attribute>
```

Useful `rngui:*` attributes seen in the base schemas: `label` (form field caption),
`default` (initial value, or a `javascript:` expression evaluated once on insert —
`get_free_id(...)` mints a fresh unique id), `hint` (tooltip/help text), `readonly`.

If an XML attribute your `illustrator.label`/`illustrator.style`/`illustrator.info`
function reads (e.g. `sid`, `color`, `a:alt_id`) isn't declared in the `.rng`, the
attribute-editing UI simply won't expose a way to set it interactively — you'd need to
add an `<attribute>` for it.

---

## 6. Defining Element looks - SVG symbols

Every icon file is a small, **viewBox-less** SVG fragment. There is no `<svg width= height=>`
sizing — instead every icon is drawn on the same implicit **40×40 unit grid** (`illustrator.width`/`illustrator.height`, both `40`), with a small
built-in margin (a circle icon uses `r="14"` centered at `(15,15)`, i.e. roughly a
1–2 unit margin on every side). Stick to that scale for any new icon so it lines up with
everything else.

```xml
<svg class="clickable" xmlns="http://www.w3.org/2000/svg">
  <circle cx="15" cy="15" r="14" class="colorstyle execstyle stand"/>
  ...
</svg>
```

Each symbol is cloned per drawn instance, and wrapped in a positioned `<g class="element">`, and:
- appends a `<title>` (tooltip) and a hover/mark decoration group automatically — you
  don't draw those yourself.
- appends an exec-state indicator (`▶ active,vote`) automatically unless suppressed.
- applies any `illustrator.info(node)` result as extra attributes on the `<g>`.
- applies any `illustrator.style(node)` result as inline CSS to every element inside your
  icon carrying the `.colorstyle` class.

### Multi-state icons: `part-*` groups

Any icon that needs a **label next to it**, or that renders differently depending on
context, is wrapped in named groups instead of being flat markup:

```xml
<svg class="clickable" xmlns="http://www.w3.org/2000/svg">
  <g class="part-normal">
    <circle cx="15" cy="15" r="14" class="colorstyle execstyle stand"/>
    ...
  </g>
  <g class="part-start">
    <!-- usually identical content to part-normal -->
    ...
  </g>
  <g class="part-middle" transform="translate(32,0)">
    <text transform="translate(0,20)" class="label"></text>
  </g>
</svg>
```

| Group class | Meaning |
|---|---|
| `part-normal` | Default rendering. |
| `part-start` | Alternate rendering used when this instance is the first element handling a given "endpoint" chain. Usually identical to `part-normal`; some icons (like `loop.svg`) genuinely differ here (e.g. a diamond icon vs. plain box). |
| `part-middle` | Positioned *after* the icon  and holds the actual `<text class="label">` node that gets its text content set at render time. Only include this group if the element's `illustrator.label` function returns something. |
| `part-end` | A trailing decoration appended after `part-middle`'s label. |
| `part-extra` | Extra decoration shown alongside `part-end`. |

If your icon has **no label and no state variation**, skip the `part-*` wrapping entirely
and just put shapes directly under `<svg>` — that's what most simple icons (`start.svg`,
`stop.svg`, `escape.svg`, the original `critical.svg`) do.

---

## 7. Styling Elements - CSS class reference

All symbol styling lives in one shared, global stylesheet — `wfadaptor.css` —
loaded once regardless of theme. **Themes do not ship their own CSS.** Icon files only
ever reference classes already defined there (or use inline `style="..."` overrides for
one-off tweaks, e.g. `style="fill:none;"`).

| Class | Purpose |
|---|---|
| `.execstyle` / `.execstylethin` | Stroke color/width driven by the *execution state* of the enclosing `<g class="passive\|active\|vote">` (blue/red/green respectively) — put this on the "primary ring" of an icon so it visibly reflects running/failed/voting state. `execstylethin` is the same idea at `stroke-width:2` instead of `4`. |
| `.hoverstyle` / `.markstyle` | The two decoration shapes `draw_symbol` appends automatically to every icon (a small hover checkmark-in-circle, and the "marked for copy/move" ring) — hidden by default, shown via `g.element.hover` / `.marked` / `.selected` state classes. You never add these yourself; they come for free. |
| `.colorstyle` | **No CSS rule — a JS hook only.** Marks which shapes inside an icon should receive the element's *per-instance* `illustrator.style(node)` inline style (e.g. a user-chosen color). The engine selects `.colorstyle` elements and applies the style directly as inline CSS. If nothing sets a `style`, elements with this class just render per whatever other classes they also carry. |
| `.stand` | The default outline style: background-colored fill, dark stroke (`stroke-width:1.6`). Use for the main outline of most shapes. |
| `.standthin` | Same as `.stand` but forces `stroke-width:1` — for secondary/inner rings (dashed clock rings, etc). |
| `.standfat` | Same as `.stand` but `stroke-width:3` — for emphasis (e.g. `end.svg`'s thick ring). |
| `.greyfat` | Like `.standfat` but stroked in the light/muted grey variable — de-emphasized elements. |
| `.normal` | Solid dark fill, near-zero stroke — flat black glyph fill (e.g. `critical.svg`'s original exclamation mark). |
| `.white` | Background-colored fill *and* stroke — used to visually "punch a hole"/cover the layer beneath (e.g. `parallel.svg`'s notch). |
| `.black` | Solid dark fill and stroke, `stroke-width:1.6` — flat black shapes (e.g. the padlock body in `critical.svg`). |
| `.grey` | Like `.black` but in the light/muted grey variable. |
| `.unknown` | Fallback style used for the placeholder icon when an element type can't be resolved. |
| `.gen` | `fill:ButtonFace` themed generic/system look — rarely used directly in icons. |
| `.standwithout` / `.standtrans` | Background-colored fill only, no stroke rule of its own — thin helper classes for shapes that only need a fill. |
| `.edge` (on `<line>`/`<path>`) | The connection/arrow line style (`stroke-width:2`, no fill). Applied automatically by `draw_connection`, not something you put in an icon file. |
| `.block` (on the border `<rect>`) | The dashed outline box drawn by `draw_border` (`border: 'visual' \| 'structural'`). Applied automatically, not authored in an icon. |
| `.tile` (on the background `<rect>`) | The translucent highlight box drawn by `draw_tile` for every `type: 'complex'` element. Applied automatically. |
| `.label` (on `<text>`) | The node label text style. Put this on the `<text>` inside `part-middle`; leave its content empty, it's filled in at render time. |
| `.label.standalone` | Adds a background-colored outline stroke behind the label text (for readability over busy backgrounds) — used e.g. on `loop.svg`'s inline label. |
| `.label.rotate` | Applied automatically when the manifestation's `rotated_labels`/an element's `rotatelabels` is active. |
| `.duration` | Stroke color for duration-annotation strokes. |
| `.super` / `tspan.exec` / `.active` / `.vote` / `.colon` / `.necessary` | The small execution-count indicator (`▶ 0,0`) appended automatically above every icon unless `addition` is suppressed at draw time. |
| `.stripe.even` / `.stripe.odd` | Alternating row backgrounds, only drawn when the manifestation sets `this.striped = true`. |

CSS custom properties (in `:root`, top of `wfadaptor.css`) drive the actual colors:
`--wfadaptor-exec-passive/active/vote`, `--wfadaptor-base`, `--wfadaptor-base-light`,
`--wfadaptor-background`, `--wfadaptor-selected*`, `--wfadaptor-hover*`,
`--wfadaptor-stripe`, `--wfadaptor-border`, `--wfadaptor-mark`, `--wfadaptor-important`,
`--wfadaptor-label`. Since this stylesheet is shared by every theme, changing these
variables changes the palette for **all** themes at once — a theme cannot rescope them
per-instance (there is no per-theme stylesheet), so don't rely on any theme-specific
palette.

---

## 8. Worked example: adding a new element end-to-end

This condenses the actual steps used in this project to add the `critical` "critical
section" element with its own icon, label, and structural border (a real, tested
recipe):

1. **Icon** (`symbols/critical.svg`) — a simple circle-backed glyph, with `part-normal`/
   `part-start` (identical) plus `part-middle` holding the label text:
   ```xml
   <svg class="clickable" xmlns="http://www.w3.org/2000/svg">
     <g class="part-normal">
       <circle cx="15" cy="15" r="14" class="colorstyle execstyle stand"/>
       <path d="M 11,14 L 11,10 A 4,4 0 0 1 19,10 L 19,14" class="stand" style="fill:none;"/>
       <rect x="9.5" y="13.5" width="11" height="9" rx="1.5" class="black"/>
     </g>
     <g class="part-start"> <!-- same content --> </g>
     <g class="part-middle" transform="translate(32,0)">
       <text transform="translate(0,20)" class="label"></text>
     </g>
   </svg>
   ```
2. **Closing element** (a `parent`-linked variant, reusing an existing icon):
   ```js
   this.elements.critical_finish = {
     'type': 'primitive',
     'illustrator': { 'endnodes': 'this', 'svg': self.adaptor.theme_dir + 'symbols/event_end.svg' }
   };
   ```
3. **Main element definition**, wiring the closing element and the label:
   ```js
   this.elements.critical = {
     'type': 'complex',
     'illustrator': {
       'label': function(node){ return [ { column: 'Label', value: $(node).attr('sid') } ]; },
       'endnodes': 'aggregate',
       'closeblock': false,
       'border': 'structural',
       'closing_symbol': 'critical_finish',
       'expansion': function(node) { return 'vertical'; },
       'col_shift': function(node) { return false; },
       'svg': self.adaptor.theme_dir + 'symbols/critical.svg'
     },
     'description': self.adaptor.theme_dir + 'rngs/critical.rng',
     'permissible_children': function(node,mode) { /* same shape as choose/parallel above */ },
     'adaptor': { /* copy the standard 7-handler block from a sibling complex element */ }
   };
   ```
4. **Schema** (`rngs/critical.rng`) declaring the `sid` attribute the label function reads.
5. Add a menu entry somewhere permissible (e.g. inside `parallel_branch`'s
   `permissible_children`) so the element is actually reachable from the editor UI.

That's the whole recipe: one icon file, one schema file, and one (or two, if you need a
distinct closing icon) entries in `this.elements`.

