#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Frederic Collonval.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode, CUnicode
from ipywidgets.widgets.widget_media import _Media
from ._frontend import module_name, module_version


class Annotator(_Media):
    """TODO: Add docstring here
    """
    _model_name = Unicode('AnnotoriusModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('AnnotoriusView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    format = Unicode('png', help="The format of the image.").tag(sync=True)
    width = CUnicode(help="Width of the image in pixels. Use layout.width "
                          "for styling the widget.").tag(sync=True)
    height = CUnicode(help="Height of the image in pixels. Use layout.height "
                           "for styling the widget.").tag(sync=True)

    @classmethod
    def from_file(cls, filename, **kwargs):
        return cls._from_file('image', filename, **kwargs)

    def __repr__(self):
        return self._get_repr(Annotator)
