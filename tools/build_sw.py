#!/usr/bin/env python3
"""Write sw.js: the list of files kept for offline use, each under the URL the page requests.

Run after any change to the site's files, before committing:  python3 tools/build_sw.py
- Files referenced from index.html with ?v=… are listed with that query (styles.css?v=…).
- data/analysis/*.json are fetched with ?v=ANALYSIS_VERSION from app.js.
- Everything else under the listed folders is listed as is.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = ["index.html", "app.js", "styles.css", "manifest.webmanifest", "favicon.ico"]
FOLDERS = ["icons", "data/assets", "data/analysis", "vendor", "media"]
EXTRA = ["data/questions.js"]


def main() -> None:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    versioned = dict(re.findall(r'(?:src|href)="\./([^"?]+)(\?v=[^"]+)"', index))
    analysis_version = re.search(r'const ANALYSIS_VERSION = "([^"]+)"', (ROOT / "app.js").read_text(encoding="utf-8")).group(1)

    paths = FILES + EXTRA + sorted(
        str(path.relative_to(ROOT)) for folder in FOLDERS for path in (ROOT / folder).rglob("*")
        if path.is_file() and not path.name.startswith(".")
    )
    entries = []
    for path in paths:
        data = (ROOT / path).read_bytes()
        rev = hashlib.sha256(data).hexdigest()[:12]
        if path.startswith("data/analysis/"):
            url = f"{path}?v={analysis_version}"
        else:
            url = path + versioned.get(path, "")
        entries.append([url, rev, len(data)])
        if path == "index.html":
            entries.append(["./", rev, len(data)])
    missing = [ref for ref in versioned if not (ROOT / ref).exists()]
    if missing:
        sys.exit(f"index.html references missing files: {missing}")

    version = hashlib.sha256(json.dumps(entries).encode()).hexdigest()[:12]
    template = (ROOT / "tools" / "sw-template.js").read_text(encoding="utf-8")
    sw = template.replace("__VERSION__", version).replace(
        "__PRECACHE__", "[\n" + "".join(f"  {json.dumps(entry, ensure_ascii=False)},\n" for entry in entries) + "]"
    )
    (ROOT / "sw.js").write_text(sw, encoding="utf-8")
    total = sum(entry[2] for entry in entries) / 1048576
    print(f"sw.js: version {version}, {len(entries)} files, {total:.1f} MB")


if __name__ == "__main__":
    main()
