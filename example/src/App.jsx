import "./App.css";
import Scheme from "./Scheme";

export default function App() {
  return (
    <>
      <hgroup>
        <h1 class="text-display-lg text-light-on-surface dark:text-dark-on-surface capitalize">
          Material color roles
        </h1>
        <p class="text-title-md mb-4">
          Powered by{" "}
          <a
            class="text-light-primary dark:text-dark-primary"
            href="https://github.com/santaclaas/material-tailwind"
          >
            @claas.dev/material-tailwind
          </a>
        </p>
      </hgroup>
      <Scheme />
    </>
  );
}
