import Styles from "./style.module.scss";
import OneUIButton from "../../../src/components/Button";

const DEBUG = false;

export default function Cenario() {
  return (
    <>
      <div className={Styles.root}>
        <div>
          <p className={Styles.paragraph}>This should color red</p>
        </div>
        <div>
          <p className={Styles.paragraph}>This should color green</p>
        </div>
        <div>
          <p className={Styles.paragraph}>This should color blue</p>
        </div>
        <div>
          <h1 className={Styles.box} data-debug={DEBUG}>
            This should have a green background
          </h1>
          <h1>All buttons should have a green background</h1>
          <button style={{ backgroundColor: "var(--var-b)" }}>
            Inline style works
          </button>
          <button className={Styles.buttonStyle}>Style via class</button>
          {/* Somehow, the one-ui button is not getting it's correct background when on rarum */}
          <OneUIButton variant="filled">
            What about the one-ui button
          </OneUIButton>
          <button className={Styles.stateClass} color="hippie">A complex css selector</button>
        </div>
      </div>
    </>
  );
}
