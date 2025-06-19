from .extension import load_jupyter_server_extension

__version__ = "0.4.0"


def _jupyter_server_extension_paths():
    return [{"module": "jupyterlab_autoversion"}]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_autoversion"}]


def _load_jupyter_server_extension(serverapp, nb6_entrypoint=False):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    load_jupyter_server_extension(serverapp)


# def _jupyter_nbextension_paths():
#     return [
#         {
#             "section": "tree",
#             "src": "nbextension/static",
#             "dest": "jupyterlab_autoversion",
#             "require": "jupyterlab_autoversion/notebook",
#         }
#     ]
