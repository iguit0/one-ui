import { JSDOM } from "jsdom";

it("Should be able to parse css variables", () => {
  const instance = new JSDOM(`<html>
    <head>
        <style>
            body {
                --example-css-var: blue;
            }
        </style>
    </head>
    <body>
        <h1 style="color: var(--example-css-var, red)">Example title</h1>
    </body>
</html>`);
  const styles = instance.window.getComputedStyle(
    instance.window.document.querySelector("h1")!
  );
});
