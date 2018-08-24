import os
import os.path
from git import Repo
from notebook.utils import url_path_join

from .handlers import GetHandler, RestoreHandler


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    host_pattern = '.*$'

    repo_root = os.path.join(os.path.abspath(os.curdir()), '.autoversion')
    if not os.path.exists(repo_root):
        os.mkdir(repo_root)

    ignore_root = os.path.join(os.path.abspath(os.curdir()), '.gitignore')
    if os.path.exists(ignore_root):
        with open(ignore_root, 'r') as fp:
            add = True
            for line in fp:
                if '.autoversion' in line:
                    add = False
        if add:
            with open(ignore_root, 'a') as fp:
                fp.write('.autoversion\n')
    else:
        with open(ignore_root, 'w') as fp:
            fp.write('.autoversion\n')

    print('Installing jupyterlab_autoversion handler on path %s' % url_path_join(base_url, 'autoversion'))

    context = {'root': repo_root}
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'autoversion/get'), GetHandler, context)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'autoversion/restore'), RestoreHandler, context)])
