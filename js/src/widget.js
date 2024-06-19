import {Dialog, showDialog} from "@jupyterlab/apputils";
import {ServerConnection} from "@jupyterlab/services";
import {Panel, Widget} from "@lumino/widgets";
import {createEditorFactory} from "nbdime/lib/common/editor";
import {NotebookDiffModel} from "nbdime/lib/diff/model";
import {NotebookDiffWidget} from "nbdime/lib/diff/widget";

import "../style/index.css";

export class AutoversionWidget extends Widget {
  constructor(app, context, id, path) {
    /* Create version selector */
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

    const settings = ServerConnection.makeSettings();
    ServerConnection.makeRequest(`${settings.baseUrl}autoversion/get?id=${id}&path=${path}`, {}, settings).then(async (res) => {
      if (res.ok) {
        const versions = await res.json();
        versions.versions.forEach((record) => {
          const option = document.createElement("option");
          option.value = record;
          const timestamp = new Date(record[1]);

          option.textContent = `${record[0].slice(0, 6)} - ${timestamp}`;
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
  const settings = ServerConnection.makeSettings();
  ServerConnection.makeRequest(`${settings.baseUrl}autoversion/restore?id=${id}&path=${context.path}&version=${version}`, {}, settings).then(async (res) => {
    if (res.ok) {
      const data = await res.json();
      if (data.version.toString() === version) {
        context.model.fromJSON(data.nb);
      }
    }
  });
}

export function diff(app, rendermime, context, id, version) {
  const settings = ServerConnection.makeSettings();
  ServerConnection.makeRequest(`${settings.baseUrl}autoversion/diff?id=${id}&path=${context.path}&version=${version}`, {}, settings).then(async (res) => {
    if (res.ok) {
      const data = await res.json();
      const nbdModel = new NotebookDiffModel(data.base, data.diff);
      const nbdWidget = new NotebookDiffWidget({
        model: nbdModel,
        rendermime,
        editorFactory: createEditorFactory(),
        collapseIdentical: true,
      });

      const work = nbdWidget.init();
      await work;

      const {shell} = app;
      nbdWidget.id = id;

      /* mimic what nbdime does to match */
      const outer = new Panel();
      outer.id = id;
      outer.title.closable = true;
      outer.title.label = `Diff to ${id}`;
      outer.addClass("nbdime-Widget");

      const scroller = new Panel();
      scroller.addClass("nbdime-root");
      scroller.node.tabIndex = -1;

      shell.add(outer);
      outer.addWidget(scroller);
      scroller.addWidget(nbdWidget);
      shell.activateById(outer.id);
      // showDialog({
      //   body: nbdWidget,
      //   buttons: [Dialog.okButton({label: "Ok"})],
      //   focusNodeSelector: "input",
      //   title: "Diff:",
      // });
    }
  });
}

export function autoversion(app, rendermime, context) {
  const {model} = context;
  const id = model.metadata.autoversion || "";

  showDialog({
    body: new AutoversionWidget(app, context, id, context.path),
    buttons: [Dialog.cancelButton(), Dialog.okButton({label: "Diff"}), Dialog.okButton({label: "Ok"})],
    focusNodeSelector: "input",
    title: "Autoversion:",
  }).then((result) => {
    if (result.button.label === "Ok") {
      // narrow typing of .value since body.getValue != null
      const val = result.value.split(",");
      revision(app, context, val[2], val[3]);
    } else if (result.button.label === "Diff") {
      const val = result.value.split(",");
      diff(app, rendermime, context, val[2], val[3]);
    }
  });
}
