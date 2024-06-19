import hashlib
import os
import os.path
import nbformat
import tornado.web
from git import Git
from nbdime import diff_notebooks
from jupyter_server.base.handlers import JupyterHandler


class GitDiffHandler(JupyterHandler):
    def initialize(self, repo):
        self.repo = repo

    @tornado.web.authenticated
    def get(self):
        path = self.get_argument("path", "")
        id = self.get_argument("id", "")
        version = int(self.get_argument("version", 0))

        if not id and not path:
            self.finish({"id": "", "version": -1, "base": {}, "remote": {}, "diff": {}})
            return

        if not id and path:
            sha = hashlib.sha256()
            sha.update(path.encode())
            id = sha.hexdigest()

        try:
            tag = self.repo.tags[f"{id}-{version}"]
        except IndexError:
            self.finish({"id": "", "version": -1, "base": {}, "remote": {}, "diff": {}})
            return

        # original head index
        past = sorted(self.repo.tags, key=lambda t: t.commit.committed_datetime)[-1]

        # connect to git repo
        git = Git(self.repo.working_tree_dir)

        # read the current version of the notebook
        # NOTE: it is expected that we just saved
        base_path = os.path.join(self.repo.working_tree_dir, id)
        nb_path = os.path.join(base_path, "NOTEBOOK")
        if os.path.exists(base_path):
            if os.path.exists(nb_path):
                nb_current = nbformat.read(nb_path, 4)
            else:
                nb_current = {}
        else:
            nb_current = {}

        # checkout the tag we want to look at
        git.checkout(tag)

        # read the old version of the notebook
        if os.path.exists(base_path):
            if os.path.exists(nb_path):
                nb_old = nbformat.read(nb_path, 4)
            else:
                nb_old = {}
        else:
            nb_old = {}

        # diff the old notebook to the new notebook
        diff = diff_notebooks(nb_old, nb_current)

        # return the rendered html
        self.finish({"id": id, "version": version, "base": nb_old, "remote": nb_current, "diff": diff})

        # go back to head
        git.checkout(past)
