import React from "react";
import Styles from "./MutableHamburgerButton.module.scss";

/**
 * A hamburger button that mutates according to it's state
 **/
export default function MutableHamburgerButton({
  state = "default",
  size,
  className = "",
  ...props
}: {
  state?:
    | "default"
    | "closed"
    | "arrow-up"
    | "arrow-down"
    | "search"
    | "loading"
    | "checkmark"
    | "pencil"
    | "hamburger";
  size: number;
} & React.HTMLProps<HTMLDivElement>) {
  const stateClass = state in Styles ? Styles[state] : "";

  return (
    <div
      {...props}
      className={`${Styles.container} ${stateClass} ${className}`}
      style={{ fontSize: `${size}px` }}
    >
      <div />
      <div />
      <div />
    </div>
  );
}
