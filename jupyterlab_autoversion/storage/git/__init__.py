import os
import os.path
from git import Repo
from functools import partial
from jupyter_server.utils import url_path_join

from .handlers import GitGetHandler, GitRestoreHandler
from .hook import post_save_autocommit_git
from .diff import GitDiffHandler


def initialize(nb_server_app):
    web_app = nb_server_app.web_app
    base_url = web_app.settings["base_url"]

    repo_root = os.path.join(os.path.abspath(os.curdir), ".autoversion")
    if not os.path.exists(repo_root):
        os.mkdir(repo_root)
        repo = Repo.init(repo_root)
    else:
        repo = Repo(repo_root)

    ignore_root = os.path.join(os.path.abspath(os.curdir), ".gitignore")
    if os.path.exists(ignore_root):
        with open(ignore_root, "r+") as fp:
            add = True
            for line in fp:
                if ".autoversion" in line:
                    add = False
            if add:
                fp.write("\n.autoversion\n")
    else:
        with open(ignore_root, "w") as fp:
            fp.write("\n.autoversion\n")

    context = {"repo": repo}
    handlers = [
        (url_path_join(base_url, "autoversion/get"), GitGetHandler, context),
        (url_path_join(base_url, "autoversion/restore"), GitRestoreHandler, context),
        (url_path_join(base_url, "autoversion/diff"), GitDiffHandler, context),
    ]

    return partial(post_save_autocommit_git, repo=repo), handlers
