# for Coverage
import os
import os.path
import tornado.web
from git import Repo
from mock import patch, MagicMock
from jupyterlab_autoversion.handlers import GetHandler, RestoreHandler
from tempfile import TemporaryDirectory


class TestExtension:
    def setup(self):
        pass
        # setup() before each test method

    def teardown(self):
        pass
        # teardown() after each test method

    @classmethod
    def setup_class(cls):
        pass
        # setup_class() before any methods in this class

    @classmethod
    def teardown_class(cls):
        pass
        # teardown_class() after any methods in this class

    def test_get_handler(self):
        app = tornado.web.Application()
        m = MagicMock()

        with TemporaryDirectory() as d:
            repo_root = os.path.join(d, '.autoversion')
            if not os.path.exists(repo_root):
                os.mkdir(repo_root)

            repo = Repo.init(repo_root)

            def get_argument(name, default):
                if name == 'id':
                    return ''
                if name == 'path':
                    return ''

            h = GetHandler(app, m, repo=repo)
            h._transforms = []
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == 'id':
                    return ''
                if name == 'path':
                    return 'test'

            h = GetHandler(app, m, repo=repo)
            h._transforms = []
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == 'id':
                    return 'test'
                if name == 'path':
                    return 'test'

            h = GetHandler(app, m, repo=repo)
            h._transforms = []
            h.get_argument = get_argument
            h.get()

    def test_restore(self):
        app = tornado.web.Application()
        m = MagicMock()

        with TemporaryDirectory() as d:
            repo_root = os.path.join(d, '.autoversion')
            if not os.path.exists(repo_root):
                os.mkdir(repo_root)

            repo = Repo.init(repo_root)

            def get_argument(name, default):
                if name == 'id':
                    return ''
                if name == 'path':
                    return ''
                else:
                    return 0

            h = RestoreHandler(app, m, repo=repo)
            h._transforms = []
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == 'id':
                    return ''
                if name == 'path':
                    return 'test'
                else:
                    return 0

            h = RestoreHandler(app, m, repo=repo)
            h._transforms = []
            h.get_argument = get_argument
            h.get()

            def get_argument(name, default):
                if name == 'id':
                    return 'test'
                if name == 'path':
                    return 'test'
                else:
                    return 0

            h = RestoreHandler(app, m, repo=repo)
            h._transforms = []
            h.get_argument = get_argument
            h.get()
