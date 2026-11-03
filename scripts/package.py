"""Create a clean source/demo bundle from tracked files; never export private notes."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
destination = root / 'dist'
destination.mkdir(exist_ok=True)
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
tracked = [name for name in tracked if name]
for name in tracked:
    if name.startswith(('private/', 'output/', '.playwright-cli/', 'dist/')) or name == 'docs/RELEASE-GATES.md' or (name.startswith('.env') and name != '.env.example'):
        raise SystemExit(f'Private path unexpectedly tracked: {name}')
history = destination / 'revisiondesk.bundle'
subprocess.run(['git', 'bundle', 'create', str(history), '--all'], cwd=root, check=True)
archive = destination / 'RevisionDesk-review-package-2026-11-03.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for name in sorted(tracked):
        bundle.write(root / name, name)
    bundle.write(history, 'history/revisiondesk.bundle')
    video = root / 'output/playwright/revisiondesk-replay.webm'
    if video.is_file():
        bundle.write(video, 'demo/revisiondesk-replay.webm')
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
metadata = {'filename': archive.name, 'bytes': archive.stat().st_size, 'sha256': digest,
            'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root).decode().strip(),
            'tracked_files': len(tracked), 'live_api_tested': False}
(destination / 'package-manifest.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
print(json.dumps(metadata, indent=2))
