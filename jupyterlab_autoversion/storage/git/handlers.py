import hashlib
import os
import os.path
import nbformat
from git import Git
from notebook.base.handlers import IPythonHandler


class GitGetHandler(IPythonHandler):
    def initialize(self, repo):
        self.repo = repo

    def get(self):
        path = self.get_argument('path', '')
        id = self.get_argument('id', '')

        if not id and not path:
            self.finish({'id': '', 'last': ''})
            return

        if not id and path:
            sha = hashlib.sha256()
            sha.update(path.encode())
            id = sha.hexdigest()

        last = list(reversed([[x.commit.hexsha, x.commit.authored_date*1000] + x.name.split('-') for x in self.repo.tags if id in x.name]))
        self.finish({'id': id, 'versions': last})
        return


class GitRestoreHandler(IPythonHandler):
    def initialize(self, repo):
        self.repo = repo

    def get(self):
        path = self.get_argument('path', '')
        id = self.get_argument('id', '')
        version = int(self.get_argument('version', 0))

        if not id and not path:
            self.finish({'id': '', 'version': -1, 'contents': {}})
            return

        if not id and path:
            sha = hashlib.sha256()
            sha.update(path.encode())
            id = sha.hexdigest()

        try:
            tag = self.repo.tags['%s-%d' % (id, version)]
        except IndexError:
            self.finish({'id': '', 'version': -1, 'contents': {}})
            return

        past = self.repo.tags[-1]

        git = Git(self.repo.working_tree_dir)
        git.checkout(tag)

        path = os.path.join(self.repo.working_tree_dir, id)
        nb = os.path.join(path, 'NOTEBOOK')

        if os.path.exists(path):
            if os.path.exists(nb):
                nb = nbformat.read(nb, 4)
            else:
                nb = {}
        else:
            nb = {}

        self.finish({'id': id, 'version': version, 'nb': nb})

        git.checkout(past)
