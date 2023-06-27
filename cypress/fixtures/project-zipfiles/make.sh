#!/bin/bash

make_content() {
    rm -rf tmp-content
    mkdir tmp-content
    cd tmp-content
    unzip -q ../hello-world-format-v1.zip
}

make_content_v3() {
    rm -rf tmp-content
    mkdir tmp-content
    cd tmp-content
    unzip -q ../print-things.zip
}

make_zipfile() {
    rm -f ../$1.zip
    zip -qr ../$1.zip *
}

(
    make_content
    rm version.json
    make_zipfile no-version-json
)
(
    make_content
    echo nonsense-not-json > version.json
    make_zipfile version-json-is-not-json
)
(
    make_content
    echo '{"nonsense":42}' > version.json
    make_zipfile version-json-lacks-correct-property
)
(
    make_content
    echo '{"pytchZipfileVersion":42}' > version.json
    make_zipfile version-json-has-unsupported-version
)
(
    make_content
    rm meta.json
    make_zipfile no-meta-json
)
(
    make_content
    echo nonsense-not-json > meta.json
    make_zipfile meta-json-is-not-json
)
(
    make_content
    echo '{"nonsense":"hello"}' > meta.json
    make_zipfile meta-json-lacks-correct-property
)
(
    make_content
    echo '{"projectName":42}' > meta.json
    make_zipfile meta-json-has-non-string-project-name
)
(
    make_content
    echo nonsense > assets/nonsense.blahblahblah
    make_zipfile asset-of-unknown-mime-type
)
(
    make_content
    echo this-is-not-a-png > assets/not-really-a-png.png
    make_zipfile corrupt-png-asset
)
(
    make_content_v3
    rm code/code.json
    make_zipfile v3-no-code-json
)
(
    make_content_v3
    echo 'f/(asdf[' > code/code.json
    make_zipfile v3-code-json-not-json
)
(
    make_content_v3
    echo '[1,2,3]' > code/code.json
    make_zipfile v3-code-json-not-object
)
