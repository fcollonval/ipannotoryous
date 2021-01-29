#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import json
from pathlib import Path

from jupyter_packaging import (
    create_cmdclass,
    install_npm,
    ensure_targets,
    combine_commands,
    skip_if_exists,
    get_version,
)
import setuptools


HERE = Path(__file__).parent.resolve()

# The name of the project
name = "ipannotoryous"

# Get our version
version = get_version(str(HERE / name / "_version.py"))

nb_path = HERE / name / "nbextension" / "static"
lab_path = HERE / name / "labextension"

# Representative files that should exist after a successful build
jstargets = [str(nb_path / "index.js"), str(lab_path / "package.json")]

package_data_spec = {name: ["nbextension/static/*.*js*", "labextension/**"]}

data_files_spec = [
    ("share/jupyter/nbextensions/ipannotoryous", str(nb_path), "*.js*"),
    ("share/jupyter/labextensions/ipannotoryous", str(lab_path), "**"),
    ("etc/jupyter/nbconfig/notebook.d", str(HERE), "ipannotoryous.json"),
]


cmdclass = create_cmdclass(
    "jsdeps", package_data_spec=package_data_spec, data_files_spec=data_files_spec
)
js_command = combine_commands(
    install_npm(HERE, npm=["yarn"], build_cmd="build:all"),
    ensure_targets(jstargets),
)

is_repo = (HERE / ".git").exists()
if is_repo:
    cmdclass["jsdeps"] = js_command
else:
    cmdclass["jsdeps"] = skip_if_exists(jstargets, js_command)

long_description = (HERE / "README.md").read_text()

setup_args = dict(
    name=name,
    version=version,
    description="A annotation Jupyter Widget based on Annotorius.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    cmdclass=cmdclass,
    packages=setuptools.find_packages(),
    author="ARIADNEXT",
    author_email="fcollonval@gmail.com",
    url="https://github.com//ipannotoryous",
    license="BSD",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "Widgets", "IPython"],
    classifiers=[
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Framework :: Jupyter",
    ],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.6",
    install_requires=["ipywidgets>=7.0.0"],
    extras_require={
        "test": ["pytest>=4.6", "pytest-asyncio", "pytest-cov", "nbval"],
        "examples": [],
        "docs": [
            "sphinx>=1.5",
            "recommonmark",
            "sphinx_rtd_theme",
            "nbsphinx>=0.2.13,<0.4.0",
            "jupyter_sphinx",
            "nbsphinx-link",
            "pytest_check_links",
            "pypandoc",
        ],
    },
)

if __name__ == "__main__":
    setuptools.setup(**setup_args)
