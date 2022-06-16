import { debounce } from "lodash";
import React, { useEffect } from "react";
import { createContext, PropsWithChildren, useContext } from "react";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Function ? T[P] : DeepPartial<T[P]>;
};

type ContextSpecs = {
  component: {
    text: {
      className: {
        [k in React.ComponentProps<
          typeof import("../components/Text")["default"]
        >["type"]]?: string;
      };
    };
    input: {
      className: string;
      border: boolean;
    };
    fileInput: {
      Icon: () => JSX.Element;
    };
    passwordInput: {
      iconSrc: {
        passwordHidden: string;
        passwordVisible: string;
      };
    };
    asyncWrapper: {
      LoadingComponent?: () => JSX.Element;
      messages: {
        error: {
          title: string;
          retryBtn: string;
        };
      };
    };
    select: {
      StateIndicator: (props: { open: boolean }) => JSX.Element;
    };
    header: {
      LogoImage: () => JSX.Element;
      MoreOptions: ({ open }: { open: boolean }) => JSX.Element;
    };
    table: {
      controls: {
        PrevPage: ({ disabled }: { disabled: boolean }) => JSX.Element;
        NextPage: ({ disabled }: { disabled: boolean }) => JSX.Element;
      };
    };
    tooltip: {
      className?: string;
    };
  };
};

type ContextConfigSpecs = DeepPartial<ContextSpecs>;

const Context = createContext<ContextConfigSpecs>(null as any);

export default function OneUIProvider({
  children,
  config,
}: PropsWithChildren<{ config: ContextConfigSpecs }>) {
  return <Context.Provider value={config}>{children}</Context.Provider>;
}

const debouncedError = debounce((message: string) => {
  const event = new Event("error");
  (event as any).error = new Error(message);
  window.dispatchEvent(event);
}, 100);

function ErrorWrapper(
  originalObject: any,
  path: string = "config"
): typeof Proxy {
  return new Proxy(originalObject || {}, {
    get(_target, key) {
      try {
        const value = originalObject[key];
        if (typeof value === "undefined" || typeof value === "object")
          return ErrorWrapper(value, [path, key].filter(Boolean).join("."));
        return value;
      } catch (e) {
        const pathJson = path
          .split(".")
          .concat(key as string)
          .reduce((result, key, idx, arr) => {
            (arr.slice(0, idx).reduce((r, k) => (r as any)[k], result) as any)[
              key
            ] = idx === arr.length - 1 ? `THE_MISSING_CONFIG` : {};
            return result;
          }, {});
        throw new Error(
          `A component is using the UI config ${[path, key].join(".")}.

Please define it using:
import OneUIProvider from "@onepercent/one-ui/dist/context/OneUIProvider";

  ...
${`<OneUIProvider config={${JSON.stringify(pathJson, null, 4)}}>
...
</OneUIProvider>`.replace(/[ ]/g, "-")}`
        );
      }
    },
  });
}

export function useOneUIContext() {
  const context = useContext(Context);

  if (process.env.NODE_ENV === "development")
    return ErrorWrapper(context) as unknown as ContextSpecs;

  return context as ContextSpecs;
}
