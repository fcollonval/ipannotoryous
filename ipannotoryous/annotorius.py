#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Frederic Collonval.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import CallbackDispatcher, DOMWidget, Widget, widget_serialization
from traitlets import Bool, Dict, Enum, HasTraits, Instance, List, Unicode, CUnicode
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

    annotations = List(Dict, default_value=[], read_only=True)
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

    _create_annotation_callbacks = Instance(CallbackDispatcher, args=())
    _delete_annotation_callbacks = Instance(CallbackDispatcher, args=())
    _update_annotation_callbacks = Instance(CallbackDispatcher, args=())

    @classmethod
    def from_file(cls, filename, **kwargs):
        return cls._from_file("image", filename, **kwargs)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.on_msg(self._handle_frontend_event)

    def __repr__(self):
        return self._get_repr(Annotator)

    def add_annotation(self, annotation):
        self.update_annotation(annotation)

    def update_annotation(self, annotation):
        self.send({"action": "update", "annotation": annotation})

    def remove_annotation(self, annotation):
        self.send({"action": "delete", "annotation": annotation})

    def on_create_annotation(self, callback, remove=False):
        self._create_annotation_callbacks.register_callback(callback, remove=remove)

    def on_delete_annotation(self, callback, remove=False):
        self._delete_annotation_callbacks.register_callback(callback, remove=remove)

    def on_update_annotation(self, callback, remove=False):
        self._update_annotation_callbacks.register_callback(callback, remove=remove)

    def _handle_frontend_event(self, _, content, buffers):
        """Handle custom frontend events"""
        event = content.get("event")
        args = content.get("args", {})

        if event is None:
            return

        if event == "onCreateAnnotation":
            self.set_trait("annotations", self.annotations + [args["annotation"]])
            self._create_annotation_callbacks(**args)
        elif event == "onDeleteAnnotation":
            self.set_trait(
                "annotations",
                [
                    anno
                    for anno in self.annotations
                    if anno["id"] != args["annotation"]["id"]
                ],
            )
            self._delete_annotation_callbacks(**args)
        elif event == "onUpdateAnnotation":
            new_list = []
            for anno in self.annotations:
                if anno["id"] != args["annotation"]["id"]:
                    new_list.append(anno)
                else:
                    new_list.append(args["annotation"])

            self.set_trait("annotations", new_list)
            self._update_annotation_callbacks(**args)
