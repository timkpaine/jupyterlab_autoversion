from .extension import load_jupyter_server_extension  # noqa: F401

__version__ = "0.4.0"

def _jupyter_server_extension_paths():
    return [{"module": "jupyterlab_autoversion.extension"}]
