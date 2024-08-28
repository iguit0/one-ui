import { extractVars } from "./css-inliner";

it.each([
  ["blue", undefined, []],
  ["var(--x)", undefined, ["--x"]],
  ["var(--a, red)", "red", ["--a"]],
  ["var(--a, var(--b, yellow))", "yellow", ["--a", "--b"]],
] as [cssVarString: string, defaultColor: string | undefined, vars: string[]][])(
  "Should be able to extract vars",
  (cssVarString, expectedDefault, expectedVars) => {
    const foundVars = [] as string[];
    const defaultColor = extractVars(cssVarString, foundVars);
    expect(defaultColor).toEqual(expectedDefault);
    expect(foundVars).toEqual(expectedVars);
  }
);
