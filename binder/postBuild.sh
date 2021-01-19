#!/usr/bin/env bash

set -e
jlpm install
jlpm run build
python -m pip install -e .
jupyter nbextension install --sys-prefix --symlink --overwrite --py ipannotoryous
jupyter nbextension enable --sys-prefix --py ipannotoryous
# jupyter labextension install @jupyter-widgets/jupyterlab-manager@2.0 . --no-build
# jupyter lab build --minimize=False
