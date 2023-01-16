# for Coverage
import os
import os.path
import tornado.web
from git import Repo
from unittest.mock import MagicMock
from jupyterlab_autoversion.storage.git.handlers import GitGetHandler, GitRestoreHandler
from tempfile import TemporaryDirectory


class TestExtension:
    def test_git_get_handler(self):
        app = tornado.web.Application()
        m = MagicMock()

        with TemporaryDirectory() as d:
            repo_root = os.path.join(d, ".autoversion")
            if not os.path.exists(repo_root):
                os.mkdir(repo_root)

            repo = Repo.init(repo_root)

            def get_argument(name, default):
                if name == "id":
                    return ""
                if name == "path":
                    return ""

            h = GitGetHandler(app, m, repo=repo)
            h._transforms = []
            h.current_user = h._jupyter_current_user = "blerg"
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == "id":
                    return ""
                if name == "path":
                    return "test"

            h = GitGetHandler(app, m, repo=repo)
            h.current_user = h._jupyter_current_user = "blerg"
            h._transforms = []
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == "id":
                    return "test"
                if name == "path":
                    return "test"

            h = GitGetHandler(app, m, repo=repo)
            h.current_user = h._jupyter_current_user = "blerg"
            h._transforms = []
            h.get_argument = get_argument
            h.get()

    def test_git_restore(self):
        app = tornado.web.Application()
        m = MagicMock()

        with TemporaryDirectory() as d:
            repo_root = os.path.join(d, ".autoversion")
            if not os.path.exists(repo_root):
                os.mkdir(repo_root)

            repo = Repo.init(repo_root)

            def get_argument(name, default):
                if name == "id":
                    return ""
                if name == "path":
                    return ""
                else:
                    return 0

            h = GitRestoreHandler(app, m, repo=repo)
            h.current_user = h._jupyter_current_user = "blerg"
            h._transforms = []
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == "id":
                    return ""
                if name == "path":
                    return "test"
                else:
                    return 0

            h = GitRestoreHandler(app, m, repo=repo)
            h.current_user = h._jupyter_current_user = "blerg"
            h._transforms = []
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == "id":
                    return "test"
                if name == "path":
                    return "test"
                else:
                    return 0

            h = GitRestoreHandler(app, m, repo=repo)
            h.current_user = h._jupyter_current_user = "blerg"
            h._transforms = []
            h.get_argument = get_argument
            h.get()
