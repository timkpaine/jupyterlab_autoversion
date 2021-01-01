import hashlib
import json
import os
import os.path


def post_save_autocommit_git(repo, model, *args, **kwargs):
    """convert notebooks to Python script after save with nbconvert
    replaces `jupyter notebook --script`
    """
    if model["type"] != "notebook":
        return

    if model.get("content") and model.get("path"):
        id = model["content"]["metadata"].get("autoversion", "")

        if not id:
            sha = hashlib.sha256()
            sha.update(model["path"].encode())
            id = sha.hexdigest()

        path = os.path.join(repo.working_tree_dir, id)

        if not os.path.exists(path):
            os.mkdir(path)

        nb = os.path.join(path, "NOTEBOOK")
        with open(nb, "w") as fp:
            fp.write(json.dumps(model["content"]))

        last = len([x for x in repo.tags if id in x.name])

        repo.index.add([nb])
        repo.index.commit("%s-%d" % (id, last))
        repo.create_tag("%s-%d" % (id, last))
