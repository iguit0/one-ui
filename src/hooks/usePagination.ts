import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useAsyncControl from "./useAsyncControl";
import throttle from "lodash/throttle";

type UpdateEvent<I extends any> = {
  finished: boolean;
  items: I[];
  totalItems: number;
};

export default function usePagination<I extends any, A extends any[]>(
  request: (
    page: number,
    pageSize: number | "all",
    currItems?: I[],
    ...args: A
  ) => Promise<UpdateEvent<I>>,
  paginationId: (...args: A) => string = () => "default",
  startingItems?: I[]
): Paginable<I, A> {
  const paginationDataRef = useRef<{
    [d: string]:
      | {
          finished: boolean;
          totalItems: number;
        }
      | undefined;
  }>({});
  const { current: paginationData } = paginationDataRef;

  const [items, setItems] = useState<
    [paginationId: string, items: I[]] | undefined
  >(() => {
    if (startingItems) return [(paginationId as any)(), startingItems];
    else return undefined;
  });
  const { process, ...control } = useAsyncControl();

  function updateItems(cb: (prevItems?: I) => UpdateEvent<I>["items"]) {
    setItems((prev) => [prev![0], cb()]);
  }

  const derivateCurrentPage = (pageSize: number) => {
    if (items === undefined) return 0;
    const currentPage = Math.ceil((items?.[1].length ?? 0) / pageSize) - 1;
    return currentPage;
  };

  const _requestPage = useCallback(
    function (page: number, pageSize: number | "all", ...args: A) {
      const id = paginationId(...args);
      process(async () => {
        if (paginationData[id]?.finished) return;
        const result = await request(
          page,
          pageSize,
          items?.[0] === id && page !== 0
            ? pageSize === "all"
              ? undefined
              : items?.[1].slice(0, page * pageSize)
            : undefined,
          ...args
        );
        paginationData[id] = {
          finished: result.finished,
          totalItems: result.totalItems,
        };
        setItems((prev) => {
          if (page === 0) return [id, result.items];
          else if (!prev || id === prev[0]) return [id, result.items];
          return prev;
        });
      });
    },
    [items, request]
  );

  return {
    updateItems,
    getNextPage: (pageSize: number, ...args: A) => {
      _requestPage(derivateCurrentPage(pageSize) + 1, pageSize, ...args);
    },
    getPage: _requestPage,
    getAll: (...args: A) => {
      _requestPage(0, "all", ...args);
    },
    refreshCurrentPage: (pageSize: number, ...args: A) => {
      _requestPage(derivateCurrentPage(pageSize), pageSize, ...args);
    },
    totalItems: (...args) => paginationData[paginationId(...args)]?.totalItems,
    loading: control.loading,
    error: control.error,
    items: items?.[1],
    setError: control.setError,
  };
}

export type Paginable<
  I extends any,
  A extends any[] = [],
  E extends any = any
> = {
  updateItems: (cb: (prevItems?: I) => UpdateEvent<I>["items"]) => void;
  getNextPage: (pageSize: number, ...args: A) => void;
  refreshCurrentPage: (pageSize: number, ...args: A) => void;
  getPage: (page: number, pageSize: number, ...args: A) => void;
  getAll: (...args: A) => void;
  totalItems: (...args: A) => number | undefined;
  loading: boolean;
  error: E | Error | undefined;
  items: I[] | undefined;
  setError: ReturnType<typeof useAsyncControl>["setError"];
};

export type LocalPaginable<
  I extends any,
  A extends any[] = [],
  E extends any = any
> = Paginable<I, A, E> & {
  src: I;
};

/**
 * This returns a ref to be bound to an elements so it can be able to detect when a pagination whould occur
 */
export function useContainerPagination(
  cb: (pageSize: number) => void,
  pageSize: number,
  direction: "h" | "v" = "v"
) {
  const scrollableRef = useRef<HTMLDivElement>(null);
  const customOptionsRef =
    useRef<() => { offsetBottom?: number; offsetLeft?: number }>();

  useEffect(() => {
    const el = scrollableRef.current!;
    const scrollElement =
      (el as unknown as typeof window.document).scrollingElement || el;
    const calculateIfReachedLimit = throttle(
      () => {
        const { offsetBottom = 0, offsetLeft = 0 } =
          customOptionsRef.current?.() || {};
        const offsetLimit =
          direction === "v"
            ? scrollElement.scrollHeight -
              offsetBottom -
              scrollElement.clientHeight * 0.6
            : scrollElement.scrollWidth -
              offsetLeft -
              scrollElement.clientWidth * 0.6;
        const offset =
          direction === "v"
            ? scrollElement.clientHeight + scrollElement.scrollTop
            : scrollElement.clientWidth + scrollElement.scrollLeft;
        if (offset >= offsetLimit) {
          cb(pageSize);
        }
      },
      250,
      {
        leading: false,
        trailing: true,
      }
    );

    el.addEventListener("scroll", calculateIfReachedLimit, {
      passive: true,
    });
    return () => el.removeEventListener("scroll", calculateIfReachedLimit);
  }, [cb, pageSize]);

  return {
    scrollableRef,
    customOptionsRef,
  };
}

/**
 * This function receives an amount of local instances and paginates it
 */
export function useLocalPagination<L>(items: L[] | undefined) {
  const instanceID = useMemo(() => Date.now(), [items]);
  const cb = useCallback(
    (page: number, pageSize: number, currItems: L[] = []) => {
      if (!items)
        return Promise.resolve({
          finished: false,
          totalItems: 0,
          items: [],
        });
      const from = pageSize * page;
      const newArray = [...currItems, ...items.slice(from, from + pageSize)];

      return Promise.resolve({
        finished: newArray.length === items.length,
        totalItems: items.length,
        items: newArray,
      });
    },
    [items]
  );
  const pagination = usePagination<L, []>(cb, () => `${instanceID}`);
  const pagSrc = useMemo(() => items, [pagination.items]);

  return {
    ...pagination,
    loading: items === undefined,
    src: pagSrc,
  };
}
