"""Independently check ZIP CRCs and bytes against the unpacked extension."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
flags = parser.add_mutually_exclusive_group()
flags.add_argument('--record', action='store_true', help='Write the validated package proof')
flags.add_argument('--check-recorded-hash', action='store_true', help='Require the previously validated ZIP hash')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
unpacked = root / 'dist/extension'
archive = root / 'dist/Video32-Chrome-Extension.zip'
proof = root / 'docs/zip-report.json'
expected = {p.relative_to(unpacked).as_posix() for p in unpacked.rglob('*') if p.is_file()}
with zipfile.ZipFile(archive) as packed:
    assert packed.testzip() is None, 'ZIP CRC mismatch'
    assert set(packed.namelist()) == expected, 'ZIP inventory differs from unpacked extension'
    for path in expected:
        assert packed.read(path) == (unpacked / path).read_bytes(), path + ' differs'
    for forbidden in ['node_modules/', 'vendor/', 'tools/', 'tests/', 'previews/']:
        assert not any(path.startswith(forbidden) for path in packed.namelist()), forbidden
report = {
    'file': 'dist/Video32-Chrome-Extension.zip',
    'bytes': archive.stat().st_size,
    'entries': len(expected),
    'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
    'allCRCsValid': True,
    'allEntryBytesMatchUnpackedBuild': True,
    'runtimeExcludesDevelopmentFiles': True,
    'version': json.loads((unpacked / 'manifest.json').read_text())['version'],
}
if args.check_recorded_hash:
    assert report['sha256'] == json.loads(proof.read_text())['sha256'], 'ZIP differs from the previously verified bytes'
if args.record:
    proof.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
