#!/usr/bin/env bash

set -e
jlpm install
jlpm run build
python -m pip install .
# jupyter labextension install @jupyter-widgets/jupyterlab-manager@2.0 . --no-build
# jupyter lab build --minimize=False
