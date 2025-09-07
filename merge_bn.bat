@echo off
set "source_dir=c:\Users\Ngokel\Desktop\en\new\yourcallyourruletranslation\translation\bn"
set "target_file=c:\Users\Ngokel\Desktop\en\new\yourcallyourruletranslation\ARB translation\app_bn.arb"

rem Create or clear the target file
echo { > "%target_file%"

set "first_file=true"

for %%f in ("%source_dir%\app_bn.arb.part*") do (
    if exist "%%f" (
        if not "%first_file%"=="true" (
            echo , >> "%target_file%"
        )
        rem Read content, remove first and last line (which are { and } respectively)
        for /f "skip=1 delims=" %%l in ('type "%%f"') do (
            set "line=%%l"
            if not "!line!"=="}" (
                echo !line! >> "%target_file%"
            )
        )
        set "first_file=false"
    )
)

echo } >> "%target_file%"

echo Merging complete. Output file: "%target_file%"