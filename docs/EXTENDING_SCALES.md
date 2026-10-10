# Programming and extending scales

## Change a programme without changing code

Use the Scale layout controls to add, remove and reorder rows on either face. The JSON editor exposes the same programme. **Apply JSON** validates the draft; **Refresh JSON** deliberately replaces the draft with the live instrument. Export JSON before major edits.

A minimal importable programme:

```json
{
  "activeSide": "front",
  "theme": "faber",
  "compactScales": true,
  "customScales": [],
  "sides": {
    "front": {"name": "Arithmetic", "topStator": ["A"], "slide": ["C"], "bottomStator": ["D"]},
    "back": {"name": "Roots", "topStator": ["R1", "R2"], "slide": ["C"], "bottomStator": ["D"]}
  }
}
```

The editor accepts partial programmes, merging defaults for omitted top-level settings. A supplied `sides` object replaces the side layout; it is not a patch into individual rail arrays. Repeated scale IDs on rails are allowed. Custom IDs must be unique among custom definitions; an explicit custom definition can override a built-in ID. Use a new descriptive ID unless overriding is intentional.

## Add an expression scale

The complete working example `examples/custom_expression_scale.json` adds a fourth-power scale:

```json
{
  "id": "X4",
  "label": "x^4",
  "type": "expression",
  "min": 1,
  "max": 10000,
  "pos": "log10(x) / 4",
  "value": "pow(10, 4 * p)",
  "tickMode": "log",
  "formula": "x^4",
  "family": "Custom"
}
```

Put the definition in `customScales` and the ID in a rail. `x` means a scale value; `p` means a normalised position. Expressions support arithmetic, parentheses, powers and an explicit set of mathematical functions/constants. Familiar `Math.log10(x)` / `Math.pow(10, p)` notation is accepted, but this is a restricted mathematical language, **not arbitrary JavaScript**. Assignments, property traversal, loops, arbitrary function calls, strings and DOM access are not supported.

`min`/`max` must describe the actual visible value range. They are not optional decoration. A mapping and its inverse must agree, and the displayed branch must be monotone where required. Grid and off-grid probes catch common mistakes, but finite sampling cannot prove an arbitrary expression correct. Verify an independent identity and inspect the result.

## Existing mapping types and engraving controls

`src/core/scale-types.js` lists supported mappings and compatible default tick strategies. Use that registry rather than copying a specialist mode onto an unrelated mapping. For example, a generic linear scale cannot use `tickMode: "temperature"`.

A root branch uses `type: "root"`, an integer `order` from 2 to 32 and a zero-based `branch` in `[0, order - 1]`. At D reading `d`, the branch reads `(d * 10^branch)^(1/order)`. For `N = m * 10^k`, choose the nonnegative residue `branch = k mod order` and multiply the reading by `10^floor(k/order)`. For 32, use fifth-root branch 1 at D=3.2 and obtain 2.

A manual `ticks` array may specify `{ "value": 2, "label": "2", "kind": "major" }`. The position is computed, not typed. Paired log-log ticks also accept `positiveLabel` / `negativeLabel`. An empty array intentionally requests no ordinary ticks. `gauges` add labelled value positions. `anchor` with `anchorPos` adds a position-based reference, not a mathematical conversion by itself.

Tick kinds, in increasing hierarchy, are `micro`, `minor`, `mid`, `submajor`, `major`, `gauge`, `index`. A `tone` of `neutral`, `red`, `blue` or `green` is explicit; neutral is not interpreted as an absent override. Set `compactLabels: false` on an individual scale to opt out of right/split numbering. `startLabel` and `endLabel` provide deliberate index captions; do not use them to disguise a wrong mapping.

Composite rows contain one or two layer references, for example:

```json
{
  "id": "ROOT_PAIR",
  "label": "Roots",
  "type": "composite",
  "layers": [
    {"scale": "R1", "tone": "neutral"},
    {"scale": "R2", "tone": "red"}
  ]
}
```

Nested composites and shared log-log rows inside composites are rejected. A `syncroLogLog` definition already owns its shared positive/reciprocal geometry.

## Add a built-in family or mapping

For a new definition using an existing mapping, add declarative data to the appropriate `catalog/scales/` file and expose it through `catalog/scales.js`. For a new mapping, also add a registry entry, explicit validation, forward/inverse implementation, a meaningful tick strategy and schema enum. Do not silently fall through to another mapping or put UI dependencies in the core.

Test at least: independent mathematical values, endpoints, out-of-domain inputs, meaningful opening-interval coverage, bounded tick generation, label correctness, both compact modes and at least one small viewport. If historical alignment matters, test an actual slide/cursor calculation as well as the isolated functions. Preset names alone establish no calibration.

`schema/program.schema.json` is an editor aid. `model/validation.js` is the authoritative semantic validator. Current limits are 1,000,000 characters, 30,000 JSON nodes, depth 12, 8 sides, 128 custom definitions, 40 rows per rail, 320 rows total and 2,000 manual ticks per scale. Accepted numeric input must be finite and representable for the selected mapping.

## Horizontal segments and reference marks

Use `{ "id": "MIX", "type": "segmented", "layers": ["CHEM_M1", "CHEM_XW"] }` to place two existing partial-domain scales on one shared baseline. Domains are retained, not normalised or stretched. One or two ordinary children are allowed; overlapping/nested segments are rejected. A layer object may specify `scale`, `caption`, and `tone` as with a vertical composite. Readouts show only the active child domain, with both endpoint descriptions allowed at a shared boundary.

Chemical reference rows demonstrate optional validated tick `title`, `mass`, and `decade` metadata. `referenceOnly: true` requires nonempty labelled manual mass marks; the reader reports the nearest mark. It never interpolates a mass. Titles are escaped. `refineTicks: true` is an explicit request for round-value gap filling, including between manual marks; absent that opt-in, manual lists are used exactly as supplied. See CHEMICAL_SCALES.md for the two specialist scientific mapping types and published-range restrictions.

The top-level `viewMode` field is `single` or `both`; `activeSide` still chooses the editor face. `both` shows every configured face in insertion order, including custom programmes with more than two faces. It is not a reserved face identifier.
