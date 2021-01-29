#!/usr/bin/env python
# coding: utf-8

# Copyright (c) ARIADNEXT.
# Distributed under the terms of the Modified BSD License.

from .annotorius import Annotator, Author
from ._version import __version__, version_info

from .nbextension import _jupyter_nbextension_paths


def _jupyter_labextension_paths():
    nb_paths = _jupyter_nbextension_paths()
    return [{"src": "labextension", "dest": nb_paths[0]["dest"]}]
