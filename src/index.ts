import {
  IDisposable
} from '@phosphor/disposable';

import {
  ToolbarButton, ICommandPalette, showDialog, Dialog
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  PageConfig
} from '@jupyterlab/coreutils'

import {
  NotebookPanel, INotebookModel
} from '@jupyterlab/notebook';

import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  IDocumentManager
} from '@jupyterlab/docmanager';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import {
  ILauncher
} from '@jupyterlab/launcher';

import {
  IMainMenu
} from '@jupyterlab/mainmenu';

import {
  Widget
} from '@phosphor/widgets';

import {
  request, RequestResult
} from './request';

import '../style/index.css';

const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_autoversion',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, IFileBrowserFactory],
  optional: [ILauncher],
  activate: activate
};


export
class AutoversionWidget extends Widget {
  constructor(app: JupyterLab, context: DocumentRegistry.IContext<INotebookModel>, id: string, path: string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    let default_none = document.createElement('option');
    default_none.selected = false;
    default_none.disabled = true;
    default_none.hidden = false;
    default_none.style.display = 'none';
    default_none.value = '';

    let type = document.createElement('select');
    type.appendChild(default_none);

    request('get', PageConfig.getBaseUrl() + "autoversion/get?id=" + id + "&path=" + path).then((res: RequestResult) => {
      if(res.ok){
        let versions = res.json() as {[key: string]: string};
        for (let record of versions['versions']){
          let option = document.createElement('option');
          option.value = record;
          let timestamp = new Date(record[1]);

          option.textContent = timestamp + ' -- ' + record[0].slice(0, 6    );
          type.appendChild(option);
        }
        console.log(versions)
      }
    });
    type.style.marginBottom = '15px';
    type.style.minHeight = '25px';
    body.appendChild(type);

    super({ node: body });
  }

  getValue(): string {
    return this.inputNode.value;
  }

  get inputNode(): HTMLSelectElement {
    return this.node.getElementsByTagName('select')[0] as HTMLSelectElement;
  }

}

export
function autoversion(app: JupyterLab, context: DocumentRegistry.IContext<INotebookModel>): void {
    let model = context.model;
    console.log(model);
    let id = (model.metadata as any)['autoversion'] || '';

    showDialog({
        title: 'Autoversion:',
        body: new AutoversionWidget(app, context, id, context.path),
        focusNodeSelector: 'input',
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Ok' })]
    }).then(result => {
        if (result.button.label === 'CANCEL') {
            return;
        } else {
            let val = result.value.split(',');
            revision(app, context, val[2], val[3]);
        }
    });

}

export
function revision(app: JupyterLab, context: DocumentRegistry.IContext<INotebookModel>, id: string, version: string): void {
    console.log(id);
    console.log(version);

    request('get', PageConfig.getBaseUrl() + "autoversion/restore?id=" + id + "&path=" + context.path + '&version=' + version).then((res:RequestResult)=>{
      if(res.ok){
        let data = res.json() as {[key: string]: string};
        console.log(data);
        if(data['version'].toString() === version) {
          context.model.fromJSON(data['nb']);
        }
      }      
    })
}

export
class AutoversionExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  constructor(app: JupyterLab) {
    this.app = app;
  }

  readonly app: JupyterLab;

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    // Create the toolbar button
    let button = new ToolbarButton({
      className: 'autoversionButton',
      iconClassName: 'fa fa-fast-backward',
      onClick: () => autoversion(this.app, context),
      tooltip: 'Autoversion'
    });

    // Add the toolbar button to the notebook
    panel.toolbar.insertItem(7, 'autoversion', button);
    return button;
  }
}


function activate(app: JupyterLab,
                  docManager: IDocumentManager,
                  palette: ICommandPalette,
                  restorer: ILayoutRestorer,
                  mainMenu: IMainMenu,
                  browser: IFileBrowserFactory,
                  launcher: ILauncher | null) {

  let avExtension = new AutoversionExtension(app);

  app.docRegistry.addWidgetExtension('Notebook', avExtension);

  app.contextMenu.addItem({
    selector: '.jp-Notebook',
    command: 'notebook:autoversion',
    rank: -0.5
  });

  console.log('JupyterLab extension jupyterlab_autoversion is activated!');
};


export default extension;
export {activate as _activate};
