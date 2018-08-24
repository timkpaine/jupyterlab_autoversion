import uuid
from notebook.base.handlers import IPythonHandler


class GetHandler(IPythonHandler):
    def initialize(self, repo):
        self.repo = repo

    def get(self):
        notebook = self.get_argument('notebook')
        id = self.get_argument('id', None)
        if id:
        uuid.uuid4().hex
        self.finish(notebook)


class RestoreHandler(IPythonHandler):
    def initialize(self, repo):
        self.repo = repo

    def get(self):
        notebook = self.get_argument('notebook')
        self.finish(notebook)
