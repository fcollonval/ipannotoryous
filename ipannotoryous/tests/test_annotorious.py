#!/usr/bin/env python
# coding: utf-8

# Copyright (c) ARIADNEXT.
# Distributed under the terms of the Modified BSD License.
from copy import deepcopy
from pathlib import Path
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
import traitlets

from ..annotorius import Annotator, Author

TEST_FILE = Path(__file__).parent / "test.png"


@pytest.fixture()
def annotation():
    return {
        "type": "Annotation",
        "body": [{"type": "TextualBody", "value": "test", "purpose": "tagging"}],
        "target": {
            "source": "blob:http://localhost:8888/d60d7e83-8edc-429c-b57a-44aedfbac93c",
            "selector": {
                "type": "FragmentSelector",
                "conformsTo": "http://www.w3.org/TR/media-frags/",
                "value": "xywh=pixel:2,2,4,4",
            },
        },
        "@context": "http://www.w3.org/ns/anno.jsonld",
    }


def test_annotator_creation_blank():
    w = Annotator()
    assert w.value == b""


def test_annotator_create_from_file():
    w = Annotator.from_file(TEST_FILE.absolute().resolve())
    assert len(w.value) > 0
    assert w.format == TEST_FILE.suffix[1:].lower()


def test_annotator_create_from_url():
    w = Annotator.from_url(
        "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
    )
    assert len(w.value) > 0
    assert w.format == "url"


def test_annotator_create_from_binary():
    w = Annotator(
        value=b"iVBORw0KGgoAAAANSUhEUgAAABUAAAAYCAMAAAAiV0Z6AAAAPFBMVEVLoEN0wU6CzFKCzFKCzFKCzFKCzFJSo0MSczNDmkCCzFJPoUMTczNdr0gmgziCzFITczMTczMTczMTczPh00jOAAAAFHRSTlPF/+bIsms8Ad///hX+//5/tXw7aMEAx10AAACaSURBVHgBbc4HDoRQCATQ33tbvf9dF9QxaCT9UQaltLHOh/golXKhMs5Xqa0xU1lyoa2fXFyQOsDG38qsLy4TaV+sFislovyhPzLJJrBu6eQOtpW0LjbJkzTuTDLRVNKa3uxJI+VdiRqXSeu6GW+Qxi29eLIi8H7EsYrT42BD+mQtNO5JMjRuC4lSY8V4hsLX0egGijvUSEP9AbylEsOkeCgWAAAAAElFTkSuQmCC",
        height=14,
        width=14,
        format="png",
    )
    assert len(w.value) > 0
    assert w.format == "png"


def test_annotator_create_on_ready(mock_comm, annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)
    assert len(mock_comm.log_send) == 2

    mock_comm.handle_msg(
        {
            "content": {
                "data": {"method": "custom", "content": {"event": "onModelIsReady"}}
            },
            "buffers": None,
        }
    )

    assert len(mock_comm.log_send) == 3
    assert mock_comm.log_send[-1] == (
        (),
        {
            "data": {
                "method": "custom",
                "content": {"action": "update", "annotation": annotation},
            },
            "buffers": None,
        },
    )


def test_annotator_annotation(annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve())

    with pytest.raises(traitlets.traitlets.TraitError):
        w.annotations = [annotation]


def test_annotator_append_annotation(mock_comm, annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)
    assert len(mock_comm.log_send) == 2
    assert mock_comm.log_send[-1] == (
        (),
        {
            "data": {
                "method": "custom",
                "content": {"action": "update", "annotation": annotation},
            },
            "buffers": None,
        },
    )


def test_annotator_update_annotation(mock_comm, annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)
    annotation["body"][0]["value"] = "updated test"
    w.update_annotation(annotation)
    assert len(mock_comm.log_send) == 3
    assert mock_comm.log_send[-1] == (
        (),
        {
            "data": {
                "method": "custom",
                "content": {"action": "update", "annotation": annotation},
            },
            "buffers": None,
        },
    )


def test_annotator_remove_annotation_by_id(mock_comm, annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)
    w.remove_annotation(annotation["id"])
    assert len(mock_comm.log_send) == 3
    assert mock_comm.log_send[-1] == (
        (),
        {
            "data": {
                "method": "custom",
                "content": {"action": "delete", "annotation": annotation},
            },
            "buffers": None,
        },
    )


def test_annotator_remove_annotation_by_object(mock_comm, annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)
    w.remove_annotation(annotation)
    assert len(mock_comm.log_send) == 3
    assert mock_comm.log_send[-1] == (
        (),
        {
            "data": {
                "method": "custom",
                "content": {"action": "delete", "annotation": annotation},
            },
            "buffers": None,
        },
    )


def test_annotator_on_create_annotation(mock_comm, annotation):
    annotation["id"] = f"#{uuid4()!s}"
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    callback = MagicMock()
    w.on_create_annotation(callback)

    mock_comm.handle_msg(
        {
            "content": {
                "data": {
                    "method": "custom",
                    "content": {
                        "event": "onCreateAnnotation",
                        "args": {"annotation": annotation},
                    },
                }
            },
            "buffers": None,
        }
    )

    assert w.annotations == [annotation]
    callback.assert_called_once_with(annotation=annotation)


def test_annotator_on_update_annotation(mock_comm, annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)
    callback = MagicMock()
    w.on_update_annotation(callback)
    previous = deepcopy(annotation)
    annotation["body"][0]["value"] = "updated test"
    assert annotation != previous

    mock_comm.handle_msg(
        {
            "content": {
                "data": {
                    "method": "custom",
                    "content": {
                        "event": "onUpdateAnnotation",
                        "args": {"annotation": annotation, "previous": previous},
                    },
                }
            },
            "buffers": None,
        }
    )

    assert w.annotations == [annotation]
    callback.assert_called_once_with(annotation=annotation, previous=previous)


def test_annotator_on_delete_annotation(mock_comm, annotation):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)
    callback = MagicMock()
    w.on_delete_annotation(callback)

    mock_comm.handle_msg(
        {
            "content": {
                "data": {
                    "method": "custom",
                    "content": {
                        "event": "onDeleteAnnotation",
                        "args": {"annotation": annotation},
                    },
                }
            },
            "buffers": None,
        }
    )

    assert w.annotations == []
    callback.assert_called_once_with(annotation=annotation)


def test_annotator_get_annotation_image(mock_comm, annotation, event_loop):
    w = Annotator.from_file(TEST_FILE.absolute().resolve(), comm=mock_comm)
    w.append_annotation(annotation)

    with patch("asyncio.get_running_loop") as get_loop:
        get_loop.return_value = event_loop
        future = w.get_annotation_image(annotation)

    assert len(mock_comm.log_send) == 3
    comm_payload = mock_comm.log_send[-1][1]

    assert comm_payload["buffers"] is None
    assert comm_payload["data"]["method"] == "custom"
    content = comm_payload["data"]["content"]
    assert content["action"] == "image_snippet"
    assert content["annotation"] == annotation
    assert "uid" in content

    # Mock reply
    binary_image = b"blablabla"
    mock_comm.handle_msg(
        {
            "content": {
                "data": {
                    "method": "custom",
                    "content": {"event": "imageSnippet", "uid": content["uid"]},
                }
            },
            "buffers": [binary_image],
        }
    )

    event_loop.run_until_complete(future)

    assert future.result() == binary_image
