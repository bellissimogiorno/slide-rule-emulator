#!/usr/bin/env python3
"""Optional structural schema checks, independent of runtime semantic validation."""
import json
from pathlib import Path
import subprocess
import shutil

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]


def main():
    schema = json.loads((ROOT / 'schema/program.schema.json').read_text(encoding='utf-8'))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)
    script = """
        import { PRESETS } from './src/catalog/presets.js';
        import { DEFAULT_STATE } from './src/catalog/defaults.js';
        console.log(JSON.stringify([DEFAULT_STATE, ...Object.values(PRESETS)]));
    """
    node = shutil.which('node')
    if node is None:
        raise SystemExit('Node.js is required to read the actual catalogue.')
    output = subprocess.run(
        [node, '--input-type=module', '-e', script],
        cwd=ROOT, text=True, encoding='utf-8', capture_output=True, check=True,
    )
    programmes = [(f'catalogue {i}', value) for i, value in enumerate(json.loads(output.stdout))]
    programmes += [(path.name, json.loads(path.read_text(encoding='utf-8'))) for path in sorted((ROOT / 'examples').glob('*.json'))]
    for name, programme in programmes:
        errors = list(validator.iter_errors(programme))
        if errors:
            raise SystemExit(name + ': ' + '; '.join(error.message for error in errors))
    # Structural cardinality is separate from semantic root order/references.
    # In particular, permitting three root branches must not permit three
    # generic composite subrows or overlapping horizontal segments.
    cases = [('rootStack', 2, True), ('rootStack', 3, True),
             ('rootStack', 1, False), ('rootStack', 4, False),
             ('rootStack', 5, True), ('rootStack', 6, False),
             ('composite', 2, True), ('composite', 3, False),
             ('segmented', 2, True), ('segmented', 3, False)]
    for kind, count, expected in cases:
        sample = {'customScales': [{'id': 'X', 'type': kind, 'layers': ['R1'] * count}],
                  'sides': {'front': {'topStator': [], 'slide': [], 'bottomStator': ['X']}}}
        if validator.is_valid(sample) != expected:
            raise SystemExit(f'Schema cardinality mismatch: {kind}, {count} layers')
    zoom_cases = [(.75, True), (1, True), (1.25, True), (1.5, True), (2, True),
                  (.5, False), (.76, False), ('0.75', False), (0, False), (2.5, False)]
    for magnification, expected in zoom_cases:
        sample = dict(programmes[0][1], magnification=magnification)
        if validator.is_valid(sample) != expected:
            raise SystemExit(f'Schema magnification mismatch: {magnification!r}')
    print(f'{len(zoom_cases)} positive/negative magnification controls pass.')
    print(f'Schema is valid; {len(programmes)} default/preset/example programmes pass structurally.')
    print(f'{len(cases)} positive/negative layout-cardinality controls pass.')
    print('Mathematical domains and mapping compatibility are tested separately by the runtime validator.')


if __name__ == '__main__':
    main()
