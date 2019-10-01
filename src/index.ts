import {
  IDisposable,
} from "@phosphor/disposable";

import {
  Dialog, ICommandPalette, showDialog, ToolbarButton,
} from "@jupyterlab/apputils";

import {
  DocumentRegistry,
} from "@jupyterlab/docregistry";

import {
  PageConfig,
} from "@jupyterlab/coreutils";

import {
  INotebookModel, NotebookPanel,
} from "@jupyterlab/notebook";

import {
  ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin,
} from "@jupyterlab/application";

import {
  IDocumentManager,
} from "@jupyterlab/docmanager";

import {
  IFileBrowserFactory,
} from "@jupyterlab/filebrowser";

import {
  ILauncher,
} from "@jupyterlab/launcher";

import {
  IMainMenu,
} from "@jupyterlab/mainmenu";

import {
  Widget,
} from "@phosphor/widgets";

import {
  IRequestResult, request,
} from "requests-helper";

import "../style/index.css";

// tslint:disable: variable-name

const extension: JupyterFrontEndPlugin<void> = {
  activate,
  autoStart: true,
  id: "jupyterlab_autoversion",
  optional: [ILauncher],
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, IFileBrowserFactory],
};

export
class AutoversionWidget extends Widget {
  constructor(app: JupyterFrontEnd, context: DocumentRegistry.IContext<INotebookModel>, id: string, path: string) {
    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";

    const default_none = document.createElement("option");
    default_none.selected = false;
    default_none.disabled = true;
    default_none.hidden = false;
    default_none.style.display = "none";
    default_none.value = "";

    const type = document.createElement("select");
    type.appendChild(default_none);

    request("get",
            PageConfig.getBaseUrl() + "autoversion/get?id=" + id + "&path=" + path).then((res: IRequestResult) => {
      if (res.ok) {
        const versions = res.json() as {[key: string]: string};
        for (const record of versions.versions) {
          const option = document.createElement("option");
          option.value = record;
          const timestamp = new Date(record[1]);

          option.textContent = timestamp + " -- " + record[0].slice(0, 6    );
          type.appendChild(option);
        }
      }
    });
    type.style.marginBottom = "15px";
    type.style.minHeight = "25px";
    body.appendChild(type);

    super({ node: body });
  }

  public getValue(): string {
    return this.inputNode.value;
  }

  get inputNode(): HTMLSelectElement {
    return this.node.getElementsByTagName("select")[0] as HTMLSelectElement;
  }

}

export
function autoversion(app: JupyterFrontEnd, context: DocumentRegistry.IContext<INotebookModel>): void {
    const model = context.model;
    const id = (model.metadata as any).autoversion || "";

    showDialog({
      body: new AutoversionWidget(app, context, id, context.path),
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "Ok" })],
      focusNodeSelector: "input",
      title: "Autoversion:",
      }).then((result) => {
        if (result.button.label === "Cancel") {
            return;
        } else {
            const val = result.value.split(",");
            revision(app, context, val[2], val[3]);
        }
    });

}

export
function revision(app: JupyterFrontEnd,
                  context: DocumentRegistry.IContext<INotebookModel>,
                  id: string,
                  version: string): void {
    request("get",
            PageConfig.getBaseUrl() + "autoversion/restore?id=" +
            id + "&path=" + context.path + "&version=" + version).then((res: IRequestResult) => {
      if (res.ok) {
        const data = res.json() as {[key: string]: string};
        if (data.version.toString() === version) {
          context.model.fromJSON(data.nb);
        }
      }
    });
}

// tslint:disable-next-line:max-classes-per-file
export
class AutoversionExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  public readonly app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    this.app = app;
  }

  public createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    // Create the toolbar button
    const button = new ToolbarButton({
      className: "autoversionButton",
      iconClassName: "fa fa-fast-backward",
      onClick: () => autoversion(this.app, context),
      tooltip: "Autoversion",
    });

    // Add the toolbar button to the notebook
    panel.toolbar.insertItem(7, "autoversion", button);
    return button;
  }
}

function activate(app: JupyterFrontEnd,
                  docManager: IDocumentManager,
                  palette: ICommandPalette,
                  restorer: ILayoutRestorer,
                  mainMenu: IMainMenu,
                  browser: IFileBrowserFactory,
                  launcher: ILauncher | null) {

  const avExtension = new AutoversionExtension(app);

  app.docRegistry.addWidgetExtension("Notebook", avExtension);

  app.contextMenu.addItem({
    command: "notebook:autoversion",
    rank: -0.5,
    selector: ".jp-Notebook",
  });

  // tslint:disable-next-line:no-console
  console.log("JupyterLab extension jupyterlab_autoversion is activated!");
}

export default extension;
export {activate as _activate};
