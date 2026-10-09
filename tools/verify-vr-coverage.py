#!/usr/bin/env python3
"""Compare retained full panoramas with every bundled study's RGB565 fabric."""
import argparse, hashlib, io, json
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('input', type=Path)
args = parser.parse_args()
manifest = json.loads((root / 'assets/vr/manifest.json').read_text())
report = {'scope': 'All 256 derived fabrics decoded; first and last source frames compared cell by cell across the full longitude and latitude.', 'studies': 0, 'sourceFramesCompared': 0, 'cellsCompared': 0, 'sourceLongitudes': 2048, 'errors': []}
try:
    for view in manifest['views']:
        path = root / 'assets/vr/data' / view['file']
        with path.open('rb') as bank:
            bank.seek(view['offset'])
            encoded = bank.read(view['bytes'])
        assert hashlib.sha256(encoded).hexdigest() == view['sha256']
        with Image.open(io.BytesIO(encoded)) as image:
            actual = np.asarray(image.convert('RGB'))
        assert actual.shape == (576, 256, 3)
        assert actual[:, :, 0].max() < 32
        order = (np.arange(2048) + int(view['heading'] * 2048) - 1024) % 2048
        assert len(np.unique(order)) == 2048
        for frame in (0, 8):
            with Image.open(args.input / view['videoID'] / f'{frame+1:02d}.png') as source:
                full = np.asarray(source.convert('RGB').resize((2048, 1024), Image.Resampling.LANCZOS))
            rgb = np.round(full[:, order].reshape(64, 16, 256, 8, 3).astype(np.float32).mean(axis=(1, 3))).astype(np.uint16)
            expected = ((rgb[:, :, 0] * 31 // 255) << 11) | ((rgb[:, :, 1] * 63 // 255) << 5) | (rgb[:, :, 2] * 31 // 255)
            packed = actual[frame*64:(frame+1)*64].astype(np.uint16)
            assert np.array_equal(expected, (packed[:, :, 1] << 8) | packed[:, :, 2]), view['id']
            report['sourceFramesCompared'] += 1
            report['cellsCompared'] += 256 * 64
        report['studies'] += 1
        if report['studies'] % 32 == 0:
            print('Source coverage', report['studies'], '/ 256', flush=True)
    assert report['studies'] == 256
    report['pass'] = True
except Exception as error:
    report['pass'] = False
    report['errors'].append(str(error))
    raise
finally:
    (root / 'docs/panorama-source-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
