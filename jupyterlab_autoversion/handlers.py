from notebook.base.handlers import IPythonHandler


class GetHandler(IPythonHandler):
    def initialize(self, root):
        self.root = root

    def get(self):
        notebook = self.get_argument('notebook')
        self.finish(notebook)


class RestoreHandler(IPythonHandler):
    def initialize(self, root):
        self.root = root

    def get(self):
        notebook = self.get_argument('notebook')
        self.finish(notebook)
