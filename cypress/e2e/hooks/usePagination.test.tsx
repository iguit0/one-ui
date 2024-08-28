import { mount } from "cypress/react";
import {
  MutableRefObject,
  PropsWithChildren,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useElementFit from "../../../src/hooks/useElementFit";
import usePagination, {
  useLocalPagination,
  useContainerPagination,
} from "../../../src/hooks/usePagination";
import { randomColor } from "../../utility/color";
import useMergeRefs from "hooks/useMergeRefs";

describe("Business rules", () => {
  describe("Paginating an scrollable element", () => {
    it("Shoulld get next page when it scrolls 70% of the total height", () => {
      cy.viewport(1920, 1000);
      const paginationCallback = cy.spy();
      function Wrapper({ amount }: { amount: number }) {
        const { scrollableRef } = useContainerPagination(paginationCallback, 2);
        return (
          <div
            ref={scrollableRef}
            style={{
              height: "100vh",
              width: "100vw",
              background: "linear-gradient(#f00, #f006)",
              overflow: "auto",
            }}
            data-testid="root"
          >
            {new Array(amount).fill(
              <div
                style={{
                  background: "linear-gradient(#0f0a, #0f06)",
                  width: "100%",
                  height: 100,
                }}
              />
            )}
          </div>
        );
      }
      const chain = cy.mountChain((amount: number) => (
        <Wrapper amount={amount} />
      ));
      chain.remount(20);
      cy.byTestId("root")
        .scrollTo(0, 100)
        .wait(500)
        .scrollTo(0, 200)
        .wait(500)
        .scrollTo(0, 300)
        .wait(500)
        .scrollTo(0, 399)
        .wait(500)
        .then(() => expect(paginationCallback).to.not.be.called);
      cy.byTestId("root")
        .scrollTo(0, 200)
        .wait(500)
        .scrollTo(0, 550)
        .wait(500)
        .then(() => expect(paginationCallback).to.be.calledOnce);
      chain.remount(40).then(() => paginationCallback.resetHistory());
      cy.byTestId("root")
        .scrollTo(0, 600)
        .wait(500)
        .then(() => expect(paginationCallback).to.not.be.called);
      cy.byTestId("root")
        .scrollTo(0, 2400)
        .wait(500)
        .then(() => expect(paginationCallback).to.be.calledOnce);
    });

    const Square = ({ num }: { num: string }) => {
      return (
        <div
          data-testid="square"
          style={{
            backgroundColor: "black",
            width: 180,
            height: 210,
            fontSize: 48,
            textAlign: "center",
            color: "white",
          }}
        >
          {num}
        </div>
      );
    };
    const Wrapper = ({ localItems }: { localItems: any[] }) => {
      const { ref, itemsToShow } = useElementFit(180, 210);
      const { items, getPage, getNextPage } = useLocalPagination(localItems);
      const cb = useCallback(() => {
        getNextPage((itemsToShow || 0) * 2);
      }, [getNextPage, itemsToShow]);
      const { scrollableRef } = useContainerPagination(
        cb,
        (itemsToShow || 0) * 2
      );

      useEffect(() => {
        if (itemsToShow && localItems) {
          alert("Getting first page of items");
          getPage(0, (itemsToShow || 0) * 2);
        }
      }, [itemsToShow, localItems]);

      return (
        <div
          ref={(thisRef) => {
            (scrollableRef as MutableRefObject<HTMLDivElement>).current = (
              ref as MutableRefObject<HTMLDivElement>
            ).current = thisRef!;
          }}
          data-testid="root"
          style={{
            height: "100vh",
            width: "100vw",
            // background: "linear-gradient(#00f, #00f6)",
            display: "flex",
            flexWrap: "wrap",
            overflow: "auto",
          }}
        >
          {items?.map((i) => (
            <Square key={i} num={i} />
          ))}
        </div>
      );
    };

    function newArr(prefix: string = "") {
      return new Array(2000)
        .fill(undefined)
        .map((_, i) => prefix + String(i + 1));
    }

    it("Should be able to paginate local instance items", () => {
      const localItems = newArr();
      for (let [w, h, l] of [
        [2000, 1000, 55],
        [320, 640, 4],
      ]) {
        cy.viewport(w, h);
        mount(<Wrapper localItems={localItems} />).wait(1000);
        cy.byTestId("square").should("have.length", l * 2);
        for (let i = 0; i < 20; i++) {
          cy.byTestId("root").scrollTo("bottom");
          cy.byTestId("square").should("have.length", l * 2 + l * (++i + 1));
        }
      }
    });
    it("Should be able to handle changes correctly", () => {
      const chain = cy.mountChain((arr: any[]) => <Wrapper localItems={arr} />);
      cy.viewport(800, 600);
      const l = 12;
      for (let arr of [newArr("_ "), newArr(". ")]) {
        chain.remount(arr).wait(1000);
        for (let i = 0; i < 20; i++) {
          cy.byTestId("root").scrollTo("bottom");
        }
        cy.get("body").then((a) => cy.wrap(a.get(0).innerText).snapshot());
      }
    });
  });

  describe("New way to organize pagination size", () => {
    function expectedText(howManyElements: number) {
      return new Array(howManyElements)
        .fill(undefined)
        .map((_, i) => String(i))
        .join("");
    }
    const components = new Array(1000)
      .fill(undefined)
      .map((_, i) => <Square>{i}</Square>);
    function Square({ children }: PropsWithChildren) {
      const randColor = randomColor(Math.random().toString());
      return (
        <div style={{ width: 200, height: 500, backgroundColor: randColor }}>
          {children}
        </div>
      );
    }
    function Cenario() {
      const { itemsToShow: howManyItemsFit, ref } = useElementFit(200, 500);
      const pagination = useLocalPagination(components);
      const { scrollableRef } = useContainerPagination(
        pagination.getNextPage,
        (howManyItemsFit ?? 0) * 2
      );

      useEffect(() => {
        if (howManyItemsFit) pagination.refreshCurrentPage(howManyItemsFit * 2);
      }, [howManyItemsFit]);

      const refs = useMergeRefs(scrollableRef, ref);

      return (
        <div
          ref={refs}
          data-testid="root"
          style={{
            width: "100vw",
            height: "100vh",
            overflow: "auto",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {pagination.items}
        </div>
      );
    }
    function hasElements(num: number) {
      cy.byTestId("root")
        .children()
        .should("contain.text", expectedText(num))
        .should("have.length", num);
    }
    function triggerScroll() {
      cy.wait(500)
        .byTestId("root")
        .then((el) => {
          cy.byTestId("root").scrollTo(0, el.get(0).scrollHeight - 100, {
            duration: 200,
          });
        });
    }
    it("Should be able to simple pagination", () => {
      cy.viewport(1000, 1000);
      cy.mount(<Cenario />);

      hasElements(20);
      triggerScroll();
      hasElements(40);
      triggerScroll();
      hasElements(60);
      triggerScroll();
      hasElements(80);
      triggerScroll();
      hasElements(100);
    });

    it("Should be able to paginate when the view changes size", () => {
      /** Here we can fit 10 elements per screen */
      cy.viewport(1000, 1000);
      cy.mount(<Cenario />);

      /** Should request 20 items (The dev measures 10 items X 2 to keep a hidden page) */
      hasElements(20);
      expectedText(20);

      /** Now we can only keep 3 */
      cy.viewport(600, 500).wait(500);
      /**
       * It should keep all the 20 items and add 4
       * because when we change the page size, we already have 20 items, but each page contain 6
       * so the total of items should be multiple of 6 to fit the available dimensions correctly
       *
       * page 0 = 6
       * page 1 = 12
       * page 2 = 18
       * page 3 = 24
       * */
      hasElements(24);
      triggerScroll();
      hasElements(30);
      triggerScroll();
      hasElements(36);
      triggerScroll();
      hasElements(42);
    });
  });

  describe("Improvements to pagination interface", () => {
    it.only("Should change pagination data when changing pagination function", () => {
      const fakeItems = [
        ["b", "p"],
        ["b", "m"],
        ["b", "m"],
        ["g", "g"],
        ["g", "g"],
        ["r", "p"],
        /** Duplications */
        ["b", "p"],
        ["b", "m"],
        ["b", "m"],
        ["g", "g"],
        ["g", "g"],
        ["r", "p"],
        ["b", "p"],
        ["b", "m"],
        ["b", "m"],
        ["g", "g"],
        ["g", "g"],
        ["r", "p"],
      ] as [color: "r" | "g" | "b", size: "p" | "m" | "g"][];
      const filterByColor = (filterByColor: typeof fakeItems[number][0]) =>
        fakeItems.filter(([color]) => color === filterByColor);
      const filterBySize = (filterBySize: typeof fakeItems[number][1]) =>
        fakeItems.filter(([_color, size]) => size === filterBySize);

      function Cenario() {
        const [currentFilter, setCurrentFilter] = useState(
          () => async () => filterByColor("b")
        );
        const paginationCb = useCallback<Parameters<typeof usePagination>[0]>(
          async (page: number, pageSize: number | "all", prevItems = []) => {
            const items = await currentFilter();
            const newItems = [
              ...prevItems,
              ...(pageSize === "all"
                ? items
                : items.slice(page * pageSize, page * pageSize + pageSize)),
            ];
            return {
              finished: newItems.length === items.length,
              items: newItems,
              totalItems: items.length,
            };
          },
          [currentFilter]
        );

        const pagination = usePagination(paginationCb);

        useEffect(() => {
          pagination.getPage(0, 2);
        }, [pagination.id()]);

        return (
          <>
            {pagination.items?.map((item) => <h1>{JSON.stringify(item)}</h1>) ??
              "Loading"}
            <h2>
              Finished {pagination.totalItems() === pagination.items?.length}
            </h2>
            <h2>Total items {pagination.totalItems()}</h2>
            <h2>Current items {pagination.items?.length}</h2>
            <button onClick={() => pagination.getNextPage(2)}>Next page</button>
          </>
        );
      }

      cy.mount(<Cenario />);
    });
  });
});
