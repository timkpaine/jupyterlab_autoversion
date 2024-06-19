import hashlib
import os
import os.path
import nbformat
import tornado.web
from git import Git
from jupyter_server.base.handlers import JupyterHandler


class GitGetHandler(JupyterHandler):
    def initialize(self, repo):
        self.repo = repo

    @tornado.web.authenticated
    def get(self):
        path = self.get_argument("path", "")
        id = self.get_argument("id", "")

        if not id and not path:
            self.finish({"id": "", "last": ""})
            return

        if not id and path:
            sha = hashlib.sha256()
            sha.update(path.encode())
            id = sha.hexdigest()

        last = [
            [x.commit.hexsha, x.commit.authored_date * 1000] + x.name.split("-")
            for x in reversed(sorted(self.repo.tags, key=lambda t: t.commit.committed_datetime))
            if id in x.name
        ]

        self.finish({"id": id, "versions": last})
        return


class GitRestoreHandler(JupyterHandler):
    def initialize(self, repo):
        self.repo = repo

    @tornado.web.authenticated
    def get(self):
        path = self.get_argument("path", "")
        id = self.get_argument("id", "")
        version = int(self.get_argument("version", 0))

        if not id and not path:
            self.finish({"id": "", "version": -1, "contents": {}})
            return

        if not id and path:
            sha = hashlib.sha256()
            sha.update(path.encode())
            id = sha.hexdigest()

        try:
            tag = self.repo.tags[f"{id}-{version}"]
        except IndexError:
            self.finish({"id": "", "version": -1, "contents": {}})
            return

        # original head index
        past = sorted(self.repo.tags, key=lambda t: t.commit.committed_datetime)[-1]

        # connect to git repo
        git = Git(self.repo.working_tree_dir)

        # checkout the tag we want to look at
        git.checkout(tag)

        # read the old version of the notebook
        base_path = os.path.join(self.repo.working_tree_dir, id)
        nb_path = os.path.join(base_path, "NOTEBOOK")
        if os.path.exists(base_path):
            if os.path.exists(nb_path):
                nb = nbformat.read(nb_path, 4)
            else:
                nb = {}
        else:
            nb = {}

        # return the old notebook
        self.finish({"id": id, "version": version, "nb": nb})

        # go back to head
        git.checkout(past)
