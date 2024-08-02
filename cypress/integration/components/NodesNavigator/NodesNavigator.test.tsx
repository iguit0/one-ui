import React, { PropsWithChildren, useState } from "react";
import { mount } from "cypress/react";

import { InitialImplementation as Component } from "components/NodesNavigator/NodesNavigator.stories";
import NodesNavigator from "components/NodesNavigator";
import { randomColor } from "../../../utility/color";
import { calculateTargetIndex } from "components/NodesNavigator/NodesNavigator";

it.only("Should be able to calculate counter click", () => {
  cy.viewport(500, 500)
  const resultingAngles = [[calculateTargetIndex([], [0, 0], [0, 1]), [0, -1]]];

  cy.mount(
    <>
      {resultingAngles.map(([resultingAngle, expected], i) => (
        <>
          <h1>{i + 1}º</h1>
          <h3>Should be {expected.map((a) => a.toFixed(2)).join(", ")}</h3>
          <h2>{resultingAngle[0].toFixed(2)}</h2>
          <h2>{resultingAngle[1].toFixed(2)}</h2>
        </>
      ))}
    </>
  );
});

it("Should be able to distribute nodes based on a grandeur metric", () => {
  const randomNode = (seed: string) => (
    <div
      style={{
        backgroundColor: randomColor(seed),
        width: "100%",
        height: "100%",
      }}
    />
  );

  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <div
      style={{
        display: "inline-block",
        width: 500,
        height: 400,
        border: "2px solid black",
      }}
    >
      {children}
    </div>
  );

  const nodes = [
    { cover: randomNode("Node one"), grandeour: 100000 },
    { cover: randomNode("Node two"), grandeour: 500000 },
    { cover: randomNode("Node three"), grandeour: 500000 },
    { cover: randomNode("Node four"), grandeour: 500000 },
    { cover: randomNode("Node five"), grandeour: 500000 },
    { cover: randomNode("Node six"), grandeour: 500000 },
    { cover: randomNode("Node seven"), grandeour: 500000 },
  ];

  function Interactive() {
    const [c, sc] = useState(nodes[0]);
    return (
      <>
        <h1>A single node</h1>
        <Wrapper>
          <NodesNavigator nodes={[nodes[0]]} currentNode={nodes[0]} />
        </Wrapper>

        <h1>Adapt nodes</h1>
        <Wrapper>
          <NodesNavigator nodes={[nodes[0], nodes[1]]} currentNode={nodes[0]} />
        </Wrapper>
        <Wrapper>
          <NodesNavigator nodes={[...nodes]} currentNode={c} onClickNode={sc} />
        </Wrapper>

        <h1>No nodes</h1>
        <Wrapper>
          <NodesNavigator nodes={[]} currentNode={null} />
        </Wrapper>
      </>
    );
  }

  const chain = cy.mountChain(() => (
    <div
      style={{
        position: "relative",
        left: 200,
        top: 300,
      }}
    >
      <Interactive />
    </div>
  ));
  chain.remount();
});
