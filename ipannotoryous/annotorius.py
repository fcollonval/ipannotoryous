#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Frederic Collonval.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget, Widget, widget_serialization
from traitlets import Bool, Enum, HasTraits, Instance, Unicode, CUnicode
from ipywidgets.widgets.widget_media import _Media
from ._frontend import module_name, module_version


class Author(Widget):
    """Annotation author"""

    _model_name = Unicode("AuthorModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    id = CUnicode(default_value="", help="Annotation author ID.").tag(sync=True)
    displayName = CUnicode(
        default_value="", help="Annotation author display name."
    ).tag(sync=True)


class Annotator(_Media):
    """TODO: Add docstring here
    """

    _model_name = Unicode("AnnotoriusModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("AnnotoriusView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    format = Unicode("png", help="The format of the image.").tag(sync=True)
    width = CUnicode(
        help="Width of the image in pixels. Use layout.width " "for styling the widget."
    ).tag(sync=True)
    height = CUnicode(
        help="Height of the image in pixels. Use layout.height "
        "for styling the widget."
    ).tag(sync=True)

    author = Instance(Author, allow_none=True).tag(sync=True, **widget_serialization)
    drawingTool = Enum(
        ["rect", "polygon"], default_value="rect", help="Drawing tool."
    ).tag(sync=True)
    headless = Bool(
        default_value=False, help="Whether to disable the editor popup or not."
    ).tag(sync=True)
    readOnly = Bool(
        default_value=False, help="Whether to display the annotations as read-only."
    ).tag(sync=True)

    @classmethod
    def from_file(cls, filename, **kwargs):
        return cls._from_file("image", filename, **kwargs)

    def __repr__(self):
        return self._get_repr(Annotator)
