/* eslint-disable max-classes-per-file */
import {ToolbarButton} from "@jupyterlab/apputils";
import {INotebookTracker} from "@jupyterlab/notebook";
import {DisposableDelegate} from "@lumino/disposable";

import {autoversion} from "./widget";
import {AUTOVERSION_CAPTION, AUTOVERSION_LABEL, AUTOVERSION_COMMAND} from "./common";
import {autoversionIcon} from "./icon";

import "../style/index.css";

export class AutoversionExtension {
  commands;

  constructor(commands) {
    this.commands = commands;
  }

  /**
   * Create a new extension object.
   */
  createNew(panel) {
    const button = new ToolbarButton({
      className: "autoversionButton",
      tooltip: AUTOVERSION_CAPTION,
      icon: autoversionIcon,
      onClick: () => {
        this.commands.execute(AUTOVERSION_COMMAND);
      },
    });

    panel.toolbar.insertAfter("restart-and-run", AUTOVERSION_LABEL, button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}

function activate(app, tracker) {
  const {commands} = app;
  app.docRegistry.addWidgetExtension("Notebook", new AutoversionExtension(commands));

  commands.addCommand(AUTOVERSION_COMMAND, {
    caption: AUTOVERSION_CAPTION,
    execute: () => {
      const current = tracker.currentWidget;
      if (!current) {
        return;
      }
      autoversion(app, current.context);
    },
    icon: autoversionIcon,
    isEnabled: () => tracker && tracker.currentWidget !== undefined && tracker.currentWidget !== null,
    label: AUTOVERSION_CAPTION,
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
