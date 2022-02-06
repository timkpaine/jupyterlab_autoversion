/* eslint-disable max-classes-per-file */
import {Dialog, showDialog, CommandToolbarButton} from "@jupyterlab/apputils";

import {PageConfig} from "@jupyterlab/coreutils";

import {INotebookTracker} from "@jupyterlab/notebook";

import {find} from "@lumino/algorithm";

import {DisposableDelegate} from "@lumino/disposable";

import {Widget} from "@lumino/widgets";

import {request} from "requests-helper";

import "../style/index.css";

export const AUTOVERSION_COMMAND = "notebook:autoversion";

export class AutoversionWidget extends Widget {
  constructor(app, context, id, path) {
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

    request("get", `${PageConfig.getBaseUrl()}autoversion/get?id=${id}&path=${path}`).then((res) => {
      if (res.ok) {
        const versions = res.json();
        versions.versions.forEach((record) => {
          const option = document.createElement("option");
          option.value = record;
          const timestamp = new Date(record[1]);

          option.textContent = `${timestamp} -- ${record[0].slice(0, 6)}`;
          type.appendChild(option);
        });
      }
    });
    type.style.marginBottom = "15px";
    type.style.minHeight = "25px";
    body.appendChild(type);

    super({node: body});
  }

  getValue() {
    return this.inputNode.value;
  }

  get inputNode() {
    return this.node.getElementsByTagName("select")[0];
  }
}

export function revision(app, context, id, version) {
  request("get", `${PageConfig.getBaseUrl()}autoversion/restore?id=${id}&path=${context.path}&version=${version}`).then((res) => {
    if (res.ok) {
      const data = res.json();
      if (data.version.toString() === version) {
        context.model.fromJSON(data.nb);
      }
    }
  });
}

export function autoversion(app, context) {
  const {model} = context;
  const id = model.metadata.autoversion || "";

  showDialog({
    body: new AutoversionWidget(app, context, id, context.path),
    buttons: [Dialog.cancelButton(), Dialog.okButton({label: "Ok"})],
    focusNodeSelector: "input",
    title: "Autoversion:",
  }).then((result) => {
    if (result.button.label !== "Cancel") {
      // narrow typing of .value since body.getValue != null
      const val = result.value.split(",");
      revision(app, context, val[2], val[3]);
    }
  });
}

export class AutoversionExtension {
  commands;

  constructor(commands) {
    this.commands = commands;
  }

  /**
   * Create a new extension object.
   */
  createNew(nb) {
    // Create extension here

    // Add buttons to toolbar
    const buttons = [];
    let insertionPoint = -1;
    find(nb.toolbar.children(), (tbb, index) => {
      if (tbb.hasClass("jp-Notebook-toolbarCellType")) {
        insertionPoint = index;
        return true;
      }
      return false;
    });
    let i = 1;

    const button = new CommandToolbarButton({
      commands: this.commands,
      AUTOVERSION_COMMAND,
    });
    button.addClass("autoversionButton");
    if (insertionPoint >= 0) {
      nb.toolbar.insertItem(insertionPoint + i++, this.commands.label(AUTOVERSION_COMMAND), button);
    } else {
      nb.toolbar.addItem(this.commands.label(AUTOVERSION_COMMAND), button);
    }
    buttons.push(button);

    return new DisposableDelegate(() => {
      // Cleanup extension here
      buttons.forEach((btn) => {
        btn.dispose();
      });
    });
  }
}

function activate(app, tracker) {
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

const extension = {
  activate,
  autoStart: true,
  id: "jupyterlab_autoversion",
  requires: [INotebookTracker],
};

export default extension;
export {activate as _activate};
