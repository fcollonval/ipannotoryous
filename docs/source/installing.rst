
.. _installation:

Installation
============


The simplest way to install ipannotoryous is via pip::

    pip install ipannotoryous

or via conda::

    conda install ipannotoryous


If you installed via pip, and notebook version < 5.3, you will also have to
install / configure the front-end extension as well. If you are using classic
notebook (as opposed to Jupyterlab), run::

    jupyter nbextension install [--sys-prefix / --user / --system] --py ipannotoryous

    jupyter nbextension enable [--sys-prefix / --user / --system] --py ipannotoryous

with the `appropriate flag`_. 

If you are using Jupyterlab < 3, you will need to execute the following commands::

    jupyter labextension install @jupyter-widgets/jupyterlab-manager ipannotoryous


.. links

.. _`appropriate flag`: https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html#installing-and-enabling-extensions
