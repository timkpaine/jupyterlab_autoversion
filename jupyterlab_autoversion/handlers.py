import os
import os.path
import uuid
from notebook.base.handlers import IPythonHandler


class GetHandler(IPythonHandler):
    def initialize(self, repo):
        self.repo = repo

    def get(self):
        id = self.get_argument('id', None)
        if id:
            path = os.path.join(self.repo.git_dir, id)
            last = os.path.join(path, 'LAST')
            if os.path.exists(path):
                if os.path.exists(last):
                    with open(last, 'r') as fp:
                        self.finish({'id': id, 'last': fp.read()})

                else:
                    self.finish({'id': id, 'last': ''})
            else:
                self.finish({'id': id, 'last': ''})
        id = uuid.uuid4().hex
        self.finish({'id': id, 'last': ''})


class RestoreHandler(IPythonHandler):
    def initialize(self, repo):
        self.repo = repo

    def get(self):
        notebook = self.get_argument('notebook')
        self.finish(notebook)
