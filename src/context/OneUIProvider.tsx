import get from "lodash/get";
import merge from "lodash/merge";
import clone from "lodash/cloneDeep";
import { Get } from "type-fest";
import React, { ReactElement, useMemo } from "react";
import { createContext, PropsWithChildren, useContext } from "react";
import { FieldPath } from "../type-utils";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Function ? T[P] : DeepPartial<T[P]>;
};

export type OneUIContextSpecs = {
  component: {
    text?: {
      className?: {
        [k in React.ComponentProps<
          typeof import("../components/Text")["default"]
        >["type"]]?: string;
      };
    };
    button?: {
      className?: {
        [k in NonNullable<
          React.ComponentProps<
            typeof import("../components/Button")["default"]
          >["variant"]
        >]?: string;
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
      className?: {
        dropdown?: string;
        item?: string;
        selectedItem?: string;
      };
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
  hook: {
    ui: {
      usePaginationControls: {
        LeftControl: () => ReactElement;
        RightControl: () => ReactElement;
        className?: string;
      };
    };
  };
};

type ContextConfigSpecs = DeepPartial<OneUIContextSpecs>;

const Context = createContext<ContextConfigSpecs>(null as any);

export default function OneUIProvider({
  children,
  config,
}: PropsWithChildren<{ config: ContextConfigSpecs }>) {
  const prevCtx = useContext(Context);

  const mergedConfig = useMemo(() => {
    return merge(clone(prevCtx), config);
  }, [prevCtx, config]);

  return <Context.Provider value={mergedConfig}>{children}</Context.Provider>;
}

function ErrorWrapper(
  originalObject: any,
  path: string = "config"
): typeof Proxy {
  return new Proxy(
    typeof originalObject !== "object" ? {} : originalObject || {},
    {
      get(_target, key) {
        if (key === Symbol.toPrimitive) {
          return () => _target[key];
        }
        try {
          const value = originalObject[key];
          if (typeof value === "undefined") return undefined;
          if (typeof value === "object")
            return ErrorWrapper(value, [path, key].filter(Boolean).join("."));
          return value;
        } catch (e) {
          const pathJson = path
            .split(".")
            .concat(key as string)
            .reduce((result, key, idx, arr) => {
              (
                arr.slice(0, idx).reduce((r, k) => (r as any)[k], result) as any
              )[key] = idx === arr.length - 1 ? `THE_MISSING_CONFIG` : {};
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
    }
  );
}

export function useOneUIContext() {
  const context = useContext(Context);

  if (process.env.NODE_ENV === "development")
    return ErrorWrapper(context) as unknown as OneUIContextSpecs;

  return context as OneUIContextSpecs;
}

export function useOneUIConfig<
  P extends FieldPath<OneUIContextSpecs>,
  T extends Get<OneUIContextSpecs, P>
>(prop: P, defaultValue?: T): NonNullable<Get<OneUIContextSpecs, P>> {
  const context = useContext(Context);
  if (process.env.NODE_ENV === "development") {
    const val = useMemo(() => {
      return get(context, prop);
    }, [context, prop]);
    if (typeof val === "string" || typeof val === "function") return val as any;
    return ErrorWrapper(val || defaultValue) as unknown as NonNullable<T>;
  }
  const value = useMemo(() => {
    return get(context, prop);
  }, [context, prop]);
  return value || defaultValue;
}
