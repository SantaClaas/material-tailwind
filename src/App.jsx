import {
  argbFromHex,
  themeFromSourceColor,
  applyTheme,
} from "@material/material-color-utilities";
import { createMemo, createSignal } from "solid-js";
// import configuration from "../tailwind.config";
import defaultConfiguration from "tailwindcss/defaultConfig";

function App() {
  const [color, setColor] = createSignal("#C14450");

  const theme = () => {
    return themeFromSourceColor(color());
  };

  const themeJson = () => {
    return JSON.stringify(theme(), null, 2);
  };

  const defaultConfigurations = createMemo(() =>
    JSON.stringify(defaultConfiguration, null, 2)
  );

  function handleColorChange(event) {
    const color = argbFromHex(event.target.value);
    setColor(event.target.value);
  }

  return (
    <>
      <label for="color">Select color</label>
      <input
        type="color"
        id="color"
        value={color()}
        onInput={handleColorChange}
      />
      {/* <pre>{defaultConfigurations()}</pre> */}

      <pre>{themeJson()}</pre>
    </>
  );
}

export default App;
