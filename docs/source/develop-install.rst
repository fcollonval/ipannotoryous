
Developer install
=================


To install a developer version of ipannotoryous, you will first need to clone
the repository::

    git clone https://github.com//ipannotoryous
    cd ipannotoryous

Next, install it with a develop install using pip (this requires nodejs and yarn)::

    pip install -e .[test, examples]


If you are planning on working on the JS/frontend code, you should also do
a link installation of the extension::

    jupyter nbextension install [--sys-prefix / --user / --system] --symlink --py ipannotoryous

    jupyter nbextension enable [--sys-prefix / --user / --system] --py ipannotoryous

with the `appropriate flag`_. Or, if you are using Jupyterlab::

    jupyter labextension develop . --overwrite


.. links

.. _`appropriate flag`: https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html#installing-and-enabling-extensions
