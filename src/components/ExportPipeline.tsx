// @ts-nocheck

import { RouteComponentProps } from "@reach/router";
import React from "react";
import { ProgressBar } from "react-bootstrap";
import { assetServer } from "../skulpt-connection/asset-server";
import { ensureSoundManager } from "../skulpt-connection/sound-manager";
import txt from "../assets/globaldata-pytch.json";

interface ExportPipelineProps extends RouteComponentProps {}

declare var Sk: any;

var code: String = "";
var errors: String = "";
var returnerrors: String = "";
var flag = 0;
var globalerrors: String = "";

const build = async (code: String, errors: String) => {
  Sk.configure({
    __future__: Sk.python3,
  });
  try {
    ensureSoundManager();
    Sk.pytch.async_load_image = (name: string) => {
      return assetServer.loadImage(name);
    };
    await Sk.pytchsupport.import_with_auto_configure(code);
    errors += " CORRECT: No errors were found";
  } catch (err: any) {
    if (err.tp$name !== "PytchBuildError") {
      errors += " NOT-BUILD: Error thrown during build was not PytchBuildError";
    }

    if (err.innerError.tp$name === "PytchAssetLoadError") {
      errors += " CORRECT: No errors were found";
      flag = 1;
    }

    if (err.innerError.tp$name === "TigerPythonSyntaxAnalysis") {
      errors +=
        " SYNTAX: While compiling your code, Pytch encountered the following syntax errors :- ";
      err.innerError.syntax_errors.forEach((er: any) => {
        errors += "\nLine " + er.$lineno + " : " + er.$msg.v;
      });
    }

    if (err.phase === "import") {
      if (err.innerError.tp$name !== "TigerPythonSyntaxAnalysis") {
        errors +=
          " BUILD: While building your code, Pytch encountered the following error :- ";
        err.innerError.args.v.forEach((e: any) => {
          errors += "\n" + e.v;
        });
        err.innerError.traceback.forEach((er: any) => {
          errors += "\nLine: " + er.lineno + ", Col: " + er.colno;
        });
      }
    } else {
      if (flag === 0) {
        errors += " UNDEFINED : The following errors occured :- ";
        errors += "\n" + err;
        console.log(err);
      }
    }
  }
  return errors;
};

const buildasync = async (code, errors) => {
  returnerrors = await build(code, errors);
  return returnerrors;
};

const ExportPipeline: React.FC<ExportPipelineProps> = (ExportPipelineProps) => {
  for (var i = 1; i <= 1; i++) {
    code = "";
    errors = "";
    flag = 0;

    code = txt[i]["code"];
    errors = buildasync(code, errors);
    globalerrors += "////\n";
    globalerrors += errors;
    console.log(errors);
  }

  const TextFile = () => {
    const element = document.createElement("a");
    const textFile = new Blob([JSON.stringify(globalerrors)], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(textFile);
    element.download = "data.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div align="center">
      <h3>Export Pipeline</h3>
      <ProgressBar now={70} label={"70%"} onClick={TextFile} />
    </div>
  );
};

export default ExportPipeline;
