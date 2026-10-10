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
    print(f'Schema is valid; {len(programmes)} default/preset/example programmes pass structurally.')
    print('Mathematical domains and mapping compatibility are tested separately by the runtime validator.')


if __name__ == '__main__':
    main()
