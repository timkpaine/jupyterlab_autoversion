/* eslint-disable max-classes-per-file */
import {
  Dialog, showDialog, CommandToolbarButton,
} from "@jupyterlab/apputils";

import {
  DocumentRegistry,
} from "@jupyterlab/docregistry";

import {
  PageConfig,
} from "@jupyterlab/coreutils";

import {
  INotebookModel, NotebookPanel, INotebookTracker,
} from "@jupyterlab/notebook";

import {
  JupyterFrontEnd, JupyterFrontEndPlugin,
} from "@jupyterlab/application";

import {
  find,
} from "@lumino/algorithm";

import {
  CommandRegistry,
} from "@lumino/commands";


import {
  IDisposable, DisposableDelegate,
} from "@lumino/disposable";

import {
  Widget,
} from "@lumino/widgets";

import {
  IRequestResult, request,
} from "requests-helper";

import "../style/index.css";

export
const AUTOVERSION_COMMAND = "notebook:autoversion";

const extension: JupyterFrontEndPlugin<void> = {
  activate,
  autoStart: true,
  id: "jupyterlab_autoversion",
  requires: [INotebookTracker],
};

export
class AutoversionWidget extends Widget {
  public constructor(app: JupyterFrontEnd, context: DocumentRegistry.IContext<INotebookModel>, id: string, path: string) {
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

    void request("get",
      PageConfig.getBaseUrl() + "autoversion/get?id=" + id + "&path=" + path).then((res: IRequestResult) => {
      if (res.ok) {
        const versions: any = res.json();
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

  public get inputNode(): HTMLSelectElement {
    return this.node.getElementsByTagName("select")[0];
  }

}

export
function autoversion(app: JupyterFrontEnd, context: DocumentRegistry.IContext<INotebookModel>): void {
  const model = context.model;
  const id = (model.metadata as any).autoversion || "";

  void showDialog({
    body: new AutoversionWidget(app, context, id, context.path),
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "Ok" })],
    focusNodeSelector: "input",
    title: "Autoversion:",
  }).then((result) => {
    if (result.button.label === "Cancel") {
      return;
    } else {
      // narrow typing of .value since body.getValue != null
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
  void request("get",
    PageConfig.getBaseUrl() + "autoversion/restore?id=" +
            id + "&path=" + context.path + "&version=" + version).then((res: IRequestResult) => {
    if (res.ok) {
      const data: any = res.json();
      if (data.version.toString() === version) {
        context.model.fromJSON(data.nb);
      }
    }
  });
}


export
class AutoversionExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  protected commands: CommandRegistry;

  public constructor(commands: CommandRegistry) {

    this.commands = commands;
  }

  /**
   * Create a new extension object.
   */
  public createNew(nb: NotebookPanel): IDisposable {
    // Create extension here

    // Add buttons to toolbar
    const buttons: CommandToolbarButton[] = [];
    let insertionPoint = -1;
    find(nb.toolbar.children(), (tbb, index) => {
      if (tbb.hasClass("jp-Notebook-toolbarCellType")) {
        insertionPoint = index;
        return true;
      }
      return false;
    });
    let i = 1;
    for (const id of [AUTOVERSION_COMMAND]) {
      const button = new CommandToolbarButton({
        commands: this.commands,
        id,
      });
      button.addClass("autoversionButton");
      if (insertionPoint >= 0) {
        nb.toolbar.insertItem(insertionPoint + i++, this.commands.label(id), button);
      } else {
        nb.toolbar.addItem(this.commands.label(id), button);
      }
      buttons.push(button);
    }


    return new DisposableDelegate(() => {
      // Cleanup extension here
      for (const btn of buttons) {
        btn.dispose();
      }
    });
  }
}


function activate(app: JupyterFrontEnd, tracker: INotebookTracker): void {
  const {commands} = app;
  const avExtension = new AutoversionExtension(commands);
  app.docRegistry.addWidgetExtension("Notebook", avExtension);

  commands.addCommand(AUTOVERSION_COMMAND, {
    caption: "Restore previous version notebooks",
    execute: () => {
      const current = tracker.currentWidget;
      if (!current) {
        return;
      }
      autoversion(app, current.context);
    },
    iconClass: "jp-Icon jp-Icon-16 fa fa-fast-backward",
    iconLabel: "autoversion",
    isEnabled: () => tracker.currentWidget !== undefined && tracker.currentWidget !== null,
    label: "",
  });

  // eslint-disable-next-line no-console
  console.log("JupyterLab extension jupyterlab_autoversion is activated!");
}

export default extension;
export {activate as _activate};
