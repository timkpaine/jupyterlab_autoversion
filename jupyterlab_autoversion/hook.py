import hashlib
import json
import os
import os.path


def _post_save_autocommit(repo, model, *args, **kwargs):
    """convert notebooks to Python script after save with nbconvert
    replaces `jupyter notebook --script`
    """
    if model['type'] != 'notebook':
        return

    if model.get('content') and model.get('path'):
        id = model['content']['metadata'].get('autoversion', '')

        if not id:
            sha = hashlib.sha256()
            sha.update(model['path'].encode())
            id = sha.hexdigest()

        path = os.path.join(repo.working_tree_dir, id)

        if not os.path.exists(path):
            os.mkdir(path)

        nb = os.path.join(path, 'NOTEBOOK')
        with open(nb, 'w') as fp:
            fp.write(json.dumps(model['content']))

        last = os.path.join(path, 'LAST')

        if os.path.exists(last):
            with open(last, 'r') as fp:
                version = int(fp.read().strip())
        else:
            version = -1
        with open(last, 'w') as fp:
            fp.write(str(version+1))

        repo.index.add([nb, last])
        repo.index.commit('%s-%d' % (id, version+1))
