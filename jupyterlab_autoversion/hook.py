
def _post_save_autocommit(model, os_path, contents_manager, **kwargs):
    """convert notebooks to Python script after save with nbconvert
    replaces `jupyter notebook --script`
    """
    if model['type'] != 'notebook':
        return
    base, ext = os.path.splitext(os_path)
    base = contents_manager.root_dir
