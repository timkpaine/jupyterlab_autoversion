import {Dialog, showDialog} from "@jupyterlab/apputils";
import {PageConfig} from "@jupyterlab/coreutils";
import {Widget} from "@lumino/widgets";
import {request} from "requests-helper";

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
