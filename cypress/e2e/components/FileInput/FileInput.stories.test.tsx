import React, { ComponentProps, useState } from "react";
import { mount } from "cypress/react";
import * as AllExamples from "../../../../src/components/FileInput/FileInput.stories";
import OneUIProvider, {
  OneUIContextSpecs,
} from "../../../../src/context/OneUIProvider";
import Compact, {
  ProgressIndicator,
} from "../../../../src/components/FileInput/View/Compact/Compact";
import BigFactory from "../../../../src/components/FileInput/View/BigFactory/BigFactory";
import FileInput, {
  FileInputProps,
} from "../../../../src/components/FileInput/FileInput";
import MutableHamburgerButton from "../../../../src/components/MutableHamburgerButton/MutableHamburgerButton";

it("All examples mount at least", () => {
  for (let ExampleName in AllExamples) {
    if (ExampleName === "default") return;
    const Example = AllExamples[ExampleName];
    mount(<Example {...Example.args} />);
    cy.wait(500);
  }
});

const COMPONENTS_TO_TEST = {
  //   Big: BigFactory(() => <MutableHamburgerButton size={48} />),
  Compact: Compact,
};

const labels = {
  fileProvided: {
    title: "The file has been provided",
    description: "There is a description now",
    button: "Remove the file",
  },
  waitingFile: {
    title: "Why this file is needed",
    description: "Another description",
    button: "Submit a file",
  },
} as FileInputProps["states"];

for (let compName in COMPONENTS_TO_TEST) {
  const Component =
    COMPONENTS_TO_TEST[compName as keyof typeof COMPONENTS_TO_TEST];
  describe("Business rules for component " + compName, () => {
    function Wrapper({
      Component,
      ...props
    }: Omit<ComponentProps<typeof FileInput>, "onFile" | "file"> & {
      Component: OneUIContextSpecs["component"]["fileInput"]["View"];
    }) {
      const [providedFile, setProvidedFile] = useState<File>();
      return (
        <OneUIProvider
          config={{
            component: {
              fileInput: {
                View: Component,
              },
            },
          }}
        >
          <FileInput
            {...props}
            file={providedFile}
            onFile={(f) => setProvidedFile(f)}
          />
        </OneUIProvider>
      );
    }
    it("Should display states correctly", () => {
      cy.mount(
        <Wrapper
          states={labels}
          footer="A description about the files to be provided"
          Component={Component}
        />
      );
      if (compName !== "Compact") cy.contains(labels.waitingFile.button);
      cy.contains(labels.waitingFile.title);

      cy.get("input").attachFile({
        fileContent: "Some file content" as any,
        fileName: "Upload example.json",
        mimeType: "text/plain",
      });
      if (compName !== "Compact") cy.contains(labels.fileProvided.button);
      cy.contains(labels.fileProvided.title);

      switch (compName) {
        case "Compact":
          cy.get("svg").click();
          break;
        case "Big":
          cy.get("button").click();
          break;
      }
      if (compName !== "Compact") cy.contains(labels.waitingFile.button);
      cy.contains(labels.waitingFile.title);
    });
    it("Should be able to display progress", () => {
      cy.viewport(400, 200);
      const chain = cy.mountChain((progress?: number) => {
        cy.log(`Rendering progress ${progress}`);
        return (
          <Component
            states={labels}
            footer="XPTO"
            inputEl={null}
            onAction={() => {}}
            progress={progress}
            file={progress !== undefined ? ({} as any) : undefined}
          />
        );
      });
      chain.remount().wait(1000);
      chain.remount(25).wait(500);
      chain.remount(50).wait(500);
      chain.remount(75).wait(500);
      chain.remount(85).wait(500);
      chain.remount(90).wait(500);
      chain.remount(93).wait(500);
      chain.remount(99).wait(500);
      chain.remount(100).wait(500);
    });
  });
}

it("Should be able to show custom icon on progress", () => {
  cy.mount(
    <ProgressIndicator
      defaultIcon={
        <g transform="translate(13.5, 13.5) scale(0.75)">
          <path
            d="M17.5673 14.8269C17.5673 17.3494 15.5225 19.3942 13 19.3942C10.4775 19.3942 8.4327 17.3494 8.4327 14.8269C8.4327 12.3045 10.4775 10.2596 13 10.2596C15.5225 10.2596 17.5673 12.3045 17.5673 14.8269Z"
            style={{ stroke: "var(--svg-color, #000)" }}
          />
          <path
            d="M1.125 21.125L1.125 9.99306C1.125 8.1223 2.64155 6.60576 4.5123 6.60576C5.79532 6.60576 6.96822 5.88087 7.542 4.7333L8.30968 3.19795C8.9449 1.9275 10.2434 1.12499 11.6638 1.125L14.3362 1.12501C15.7566 1.12502 17.0551 1.92753 17.6903 3.19796L18.458 4.73333C19.0318 5.8809 20.2047 6.60579 21.4877 6.60579C23.3585 6.60579 24.875 8.12233 24.875 9.99309V21.125C24.875 23.1961 23.1961 24.875 21.125 24.875H4.875C2.80393 24.875 1.125 23.1961 1.125 21.125Z"
            style={{ stroke: "var(--svg-color, #000)" }}
          />
        </g>
      }
    />
  );
});
