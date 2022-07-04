from jupyter_server.utils import url_path_join


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings["base_url"]
    host_pattern = ".*$"

    backend = nb_server_app.config.get("JupyterLabAutoversion", {}).get(
        "backend", "git"
    )

    if backend not in ("git", "s3", "sql"):
        raise Exception(
            "jupyterlab_autoversion backend not recognized: {}".format(backend)
        )

    if backend == "s3":
        from .storage.s3 import initialize
    elif backend == "sql":
        from .storage.sql import initialize
    else:
        from .storage.git import initialize

    hook, handlers = initialize(nb_server_app)

    print(
        "Installing jupyterlab_autoversion handler on path %s"
        % url_path_join(base_url, "autoversion")
    )

    web_app.add_handlers(host_pattern, handlers)
    nb_server_app.contents_manager.register_pre_save_hook(hook)
