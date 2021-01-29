# ipannotoryous

[![Build Status](https://github.com/fcollonval/ipannotoryous/workflows/Build/badge.svg)](https://github.com/fcollonval/ipannotoryous/actions?query=workflow%3ABuild)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/fcollonval/ipannotoryous/master?urlpath=lab/tree/examples/introduction.ipynb)
[![npm](https://img.shields.io/npm/v/ipannotoryous)](https://www.npmjs.com/package/ipannotoryous)
[![PyPI](https://img.shields.io/pypi/v/ipannotoryous)](https://pypi.org/project/ipannotoryous)
[![conda-forge](https://img.shields.io/conda/vn/conda-forge/ipannotoryous)](https://anaconda.org/conda-forge/ipannotoryous)

An annotation Jupyter Widget based on [Annotorius](https://github.com/recogito/annotorious).

![demo](https://raw.githubusercontent.com/jupyterlab-contrib/ipannotoryous/master/demo_annotator.png)

## Installation

You can install using `pip`:

```bash
pip install ipannotoryous
```

Or if you use JupyterLab 3:

```bash
pip install ipannotoryous
```

Or if you use JupyterLab 2:

```bash
pip install ipannotoryous
jupyter labextension install @jupyter-widgets/jupyterlab-manager ipannotoryous
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:

```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] ipannotoryous
```

## Development Installation

```bash
# First install the python package. This will also build the JS packages.
pip install -e ".[test, examples]"
```

When developing your extensions, you need to manually enable your extensions with the
notebook / lab frontend. For JupyterLab 3, this is done by the command:

```
jupyter labextension develop . --overwrite
```

For classic notebook, you can run:

```
jupyter nbextension install --sys-prefix --symlink --overwrite --py ipannotoryous
jupyter nbextension enable --sys-prefix --py ipannotoryous
```

Note that the `--symlink` flag doesn't work on Windows, so you will here have to run
the `install` command every time that you rebuild your extension. For certain installations
you might also need another flag instead of `--sys-prefix`, but we won't cover the meaning
of those flags here.

### How to see your changes

#### Typescript:

To continuously monitor the project for changes and automatically trigger a rebuild, start Jupyter in watch mode:

```bash
jupyter lab --watch
```

And in a separate session, begin watching the source directory for changes:

```bash
npm run watch
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:

If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.
