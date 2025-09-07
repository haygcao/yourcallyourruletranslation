#!/bin/bash

source_dir="/c/Users/Ngokel/Desktop/en/new/yourcallyourruletranslation/translation/bn"
target_file="/c/Users/Ngokel/Desktop/en/new/yourcallyourruletranslation/ARB translation/app_bn.arb"

# Create or clear the target file
echo "{" > "$target_file"

first_file=true

for f in "$source_dir"/app_bn.arb.part*;
do
    if [ -f "$f" ]; then
        if [ "$first_file" = false ]; then
            echo "," >> "$target_file"
        fi
        # Read content, remove first and last line (which are { and } respectively)
        tail -n +2 "$f" | head -n -1 >> "$target_file"
        first_file=false
    fi
done

echo "}" >> "$target_file"

echo "Merging complete. Output file: $target_file"