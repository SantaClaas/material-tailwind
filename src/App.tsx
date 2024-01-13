import { createSignal, createMemo, createEffect } from "solid-js";
import {
  argbFromHex,
  themeFromSourceColor,
  applyTheme,
} from "@material/material-color-utilities";
import { Config } from "tailwindcss/";

function App() {
  const [color, setColor] = createSignal("#C14450");
  const [configuration, setConfiguration] = createSignal<Config>({
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {},
    },
  });

  const theme = createMemo(() => themeFromSourceColor(argbFromHex(color())));

  // Update tailwind configuration when color changes
  // createEffect(() => {
  //   const colors = theme().schemes;

  //   setConfiguration((previous) => {
  //     if (previous.theme) {
  //       previous.theme.colors = colors;

  //       return { ...previous };
  //     }

  //     previous.theme = {
  //       colors,
  //     };

  //     return { ...previous };
  //   });
  // });

  const themeJson = () => {
    return JSON.stringify(theme(), null, 2);
  };

  createEffect(() => {
    console.debug("Theme", theme());
  });

  const configurationJson = () => JSON.stringify(configuration(), null, 2);

  function handleColorChange(
    event: InputEvent & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    }
  ) {
    const color = argbFromHex(event.target.value);
    console.log(color);
    setColor(event.target.value);
  }

  return (
    <>
      <h1 class="text-display-lg text-dark-on-error-container bg-dark-error-container rounded-xl">
        Error
      </h1>
      <label for="color">Select color</label>
      <input
        type="color"
        id="color"
        value={color()}
        onInput={handleColorChange}
      />
      {/* <pre>{defaultConfigurations()}</pre> */}

      {/* <pre>{themeJson()}</pre> */}
      <button
        onclick={() => navigator.clipboard.writeText(configurationJson())}
      >
        Copy
      </button>

      <h1 class="text-primary-70">Test Phrase</h1>
      {/* <pre>{configurationJson()}</pre> */}
    </>
  );
}

export default App;
