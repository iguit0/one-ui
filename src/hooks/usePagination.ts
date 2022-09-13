import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAsyncControl from "./useAsyncControl";
import throttle from "lodash/throttle";

type UpdateEvent<I extends any> = {
  finished: boolean;
  items: I;
  totalItems: number;
};

export default function usePagination<I extends any, A extends any[]>(
  request: (page: number, currItems?: I, ...args: A) => Promise<UpdateEvent<I>>,
  paginationId: (...args: A) => string = () => "default"
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

  const currentPageRef = useRef<{ [d: string]: number }>({});
  const { current: currentPage } = currentPageRef;

  const [items, setItems] = useState<[string, I]>();
  const { process, ...control } = useAsyncControl();

  function updateItems(cb: (prevItems?: I) => UpdateEvent<I>["items"]) {
    setItems(prev => [prev![0], cb()]);
  }

  const _requestPage = useCallback(function (page: number, ...args: A) {
    const id = paginationId(...args);
    if (paginationData[id]?.finished || control.loading) return;
    process(async () => {
      const result = await request(page, items?.[0] === id ? items?.[1] : undefined, ...args);
      currentPage[id] = page;
      paginationData[id] = {
        finished: result.finished,
        totalItems: result.totalItems,
      };
      setItems([id, result.items]);
    });
  }, [items, request, control.loading])


  return {
    updateItems,
    getNextPage: (...args: A) =>
      _requestPage((currentPage[paginationId(...args)] || 0) + 1, ...args),
    getPage: _requestPage,
    totalItems: (...args) => paginationData[paginationId(...args)]?.totalItems,
    loading: control.loading,
    error: control.error,
    items: items?.[1],
    setError: control.setError
  };
}

export type Paginable<I extends any, A extends any[] = [], E extends any = any> = {
  updateItems: (cb: (prevItems?: I) => UpdateEvent<I>["items"]) => void;
  getNextPage: (...args: A) => void;
  getPage: (page: number, ...args: A) => void;
  totalItems: (...args: A) => number | undefined;
  loading: boolean;
  error: E | Error | undefined;
  items: I | undefined;
  setError: ReturnType<typeof useAsyncControl>["setError"];
};

/**
 * This returns a ref to be bound to an elements so it can be able to detect when a pagination whould occur
 */
export function useContainerPagination(cb: () => void) {
  const scrollableRef = useRef<HTMLDivElement>(null);
  const customOptionsRef = useRef<() => ({ offsetBottom: number })>();

  useEffect(() => {
    const el = scrollableRef.current!
    const scrollElement = (el as unknown as typeof window.document).scrollingElement || el;
    const calculateIfReachedLimit = throttle(() => {
      const customOptions = customOptionsRef.current?.() || { offsetBottom: 0 }
      const offsetLimit = scrollElement.scrollHeight - customOptions.offsetBottom - scrollElement.clientHeight * 0.6;
      const offset = scrollElement.clientHeight + scrollElement.scrollTop;
      if (offset >= offsetLimit) {
        cb();
      }
    }, 250, {
      leading: false,
      trailing: true
    })

    el.addEventListener("scroll", calculateIfReachedLimit)
    return () => el.removeEventListener('scroll', calculateIfReachedLimit);
  }, [cb])

  return {
    scrollableRef,
    customOptionsRef
  }
}

/**
 * This function receives an amount of local instances and paginates it
 */
export function useLocalPagination<L>(items: L[], pageSize: number) {
  const cb = useCallback((page: number, currItems: L[] = []) => {
    const from = pageSize * page;
    const newArray = [...currItems, ...items.slice(from, from + pageSize)]
    return Promise.resolve({
      finished: newArray.length === items.length,
      totalItems: items.length,
      items: newArray
    });
  }, [pageSize, items])
  const instanceID = useMemo(() => Date.now(), [items]);
  const pagination = usePagination<L[], []>(cb, () => `${instanceID}`);

  return pagination
}