#!/usr/bin/env python
# coding: utf-8

# Copyright (c) ARIADNEXT.
# Distributed under the terms of the Modified BSD License.

"""Annotator widget and associated models."""

from __future__ import annotations

import asyncio
from typing import Callable, Dict as TpDict, NoReturn, Union
from uuid import uuid4

from ipywidgets import CallbackDispatcher, DOMWidget, Widget, widget_serialization
from ipywidgets.widgets.widget_media import _Media
from traitlets import (
    Bool,
    CUnicode,
    Dict,
    Enum,
    HasTraits,
    Instance,
    List,
    Set,
    Unicode,
)

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
    """Annotation tool.
    
    The image is stored as `value` attribute. It accepts a byte string.
    The byte string is the raw image data that you want the browser to annotate.
    You can explicitly define the format of the byte string using the `format` trait
    (which defaults to "png").
    If you pass `"url"` to the `"format"` trait, `value` will be interpreted
    as a URL as bytes encoded in UTF-8.
    """

    _model_name = Unicode("AnnotoriusModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("AnnotoriusView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    format = Unicode("png", help="The format of the image.").tag(sync=True)
    width = CUnicode(
        help="""Width of the image in pixels.
    Use layout.width for styling the widget."""
    ).tag(sync=True)
    height = CUnicode(
        help="""Height of the image in pixels. 
    Use layout.height for styling the widget."""
    ).tag(sync=True)

    annotations = List(
        Dict,
        help="""List of annotations on the image.
    
    This list must not be changed directly. Use `append_annotation`, `update_annotation`
    and `remove_annotation`.""",
        default_value=[],
        read_only=True,
    )
    author = Instance(Author, allow_none=True).tag(sync=True, **widget_serialization)
    default_tags = Set(
        Unicode,
        default_value=set(),
        help="Set of default tags to propose for annotations.",
    ).tag(sync=True)
    drawingTool = Enum(
        ["rect", "polygon"],
        default_value="rect",
        help="Drawing tool. Available values are `rect` and `polygon`.",
    ).tag(sync=True)
    headless = Bool(
        default_value=False, help="Whether to disable the editor popup or not."
    ).tag(sync=True)
    # FIXME
    # readOnly = Bool(
    #     default_value=False, help="Whether to display the annotations as read-only."
    # ).tag(sync=True)
    template = List(
        trait=Dict,
        default_value=[],
        help="""Annotation content to add on new annotation shape.
    
    The structure is a list of dictionaries containing keys: type, value and purpose.

    Example: [
        {"type": "TextualBody", "value": "My comment", "purpose": "commenting"},
        {"type": "TextualBody", "value": "my-tag", "purpose": "tagging"}
    ]
    """,
    ).tag(sync=True)

    _create_annotation_callbacks = Instance(CallbackDispatcher, args=())
    _delete_annotation_callbacks = Instance(CallbackDispatcher, args=())
    _select_annotation_callbacks = Instance(CallbackDispatcher, args=())
    _update_annotation_callbacks = Instance(CallbackDispatcher, args=())

    @classmethod
    def from_file(cls, filename: str, **kwargs) -> "Annotator":
        """Create a annotation widget from a image filename."""
        return cls._from_file("image", filename, **kwargs)

    def __init__(self, *args, **kwargs) -> NoReturn:
        super().__init__(*args, **kwargs)
        self.__image_snippets: TpDict[str, asyncio.Future] = {}

        self.on_msg(self._handle_frontend_event)

    def __repr__(self) -> str:
        return self._get_repr(Annotator)

    def append_annotation(self, annotation: dict) -> NoReturn:
        """Add an annotation."""
        if "id" not in annotation:
            annotation["id"] = f"#{uuid4()!s}"
        self.update_annotation(annotation)

    def get_annotation_image(self, annotation: Union[dict, str, None] = None) -> asyncio.Future:
        """Extract the annotation image snippet.
        
        Args:
            annotation: The annotation to extract; default is to extract the currently 
            selected one.
        
        Returns:
            A Future resolving in a byte image when the annotation snippet is available.
        """
        uid = str(uuid4())
        loop = asyncio.get_running_loop()
        self.__image_snippets[uid] = future = loop.create_future()
        self.send({"action": "image_snippet", "annotation": annotation, "uid": uid})
        return future

    def update_annotation(self, annotation: dict) -> NoReturn:
        """Update an annotation."""
        indexes = [a["id"] for a in self.annotations]
        try:
            index = indexes.index(annotation.get("id", ""))
        except ValueError:
            self.annotations.append(annotation)
        else:
            self.annotations[index] = annotation
        self.send({"action": "update", "annotation": annotation})

    def remove_annotation(self, annotation: Union[dict, str]) -> NoReturn:
        """Remove an annotation given the annotation description or id."""
        if isinstance(annotation, str):
            annotation = list(filter(lambda a: a["id"] == annotation, self.annotations))
            if len(annotation) == 0:
                raise ValueError(f"Annotation '{annotation}' not in list.")
            else:
                annotation = annotation[0]
        self.annotations.remove(annotation)
        self.send({"action": "delete", "annotation": annotation})

    def on_create_annotation(
        self, callback: Callable[[dict], NoReturn], remove: bool = False
    ) -> NoReturn:
        """Add a callback on create annotation event."""
        self._create_annotation_callbacks.register_callback(callback, remove=remove)

    def on_delete_annotation(
        self, callback: Callable[[dict], NoReturn], remove: bool = False
    ) -> NoReturn:
        """Add a callback on delete annotation event."""
        self._delete_annotation_callbacks.register_callback(callback, remove=remove)

    def on_select_annotation(
        self, callback: Callable[[dict], NoReturn], remove: bool = False
    ) -> NoReturn:
        """Add a callback on select annotation event."""
        self._select_annotation_callbacks.register_callback(callback, remove=remove)

    def on_update_annotation(
        self, callback: Callable[[dict, dict], NoReturn], remove: bool = False
    ) -> NoReturn:
        """Add a callback on update annotation event.
        
        Args:
            callback: Callback function will received the new and the previous annotations (in that order)
            remove: Whether to remove or add the callback?
        """
        self._update_annotation_callbacks.register_callback(callback, remove=remove)

    def _handle_frontend_event(
        self, _: "Widget", content: dict, buffers: list
    ) -> NoReturn:
        """Handle custom frontend events"""
        event = content.get("event")
        args = content.get("args", {})

        if event is None:
            return

        if event == "onModelIsReady":
            for annotation in self.annotations:
                self.append_annotation(annotation)
        elif event == "onCreateAnnotation":
            self.append_annotation(
                args["annotation"]
            )  # Propagate annotation addition to all views
            self._create_annotation_callbacks(**args)
        elif event == "onDeleteAnnotation":
            self.remove_annotation(args["annotation"])
            self._delete_annotation_callbacks(**args)
        elif event == "onSelectAnnotation":
            self._select_annotation_callbacks(**args)
        elif event == "onUpdateAnnotation":
            self.update_annotation(
                args["annotation"]
            )  # Propagate annotation addition to all views
            self._update_annotation_callbacks(**args)
        elif event == "imageSnippet":
            uid = content["uid"]
            future = self.__image_snippets.pop(uid)
            if future.cancelled():
                return
            if buffers:
                future.set_result(bytes(buffers[0]))
            else:
                future.set_result(bytes())

