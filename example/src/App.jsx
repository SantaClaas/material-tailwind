import Scheme from "./Scheme";

export default function App() {
  return (
    <>
      <hgroup>
        <h1 class="text-display-lg text-light-on-surface dark:text-dark-on-surface capitalize">
          Material color roles
        </h1>
        <p class="text-title-md">
          <span>Powered by </span>
          <a
            class="text-light-primary dark:text-dark-primary"
            href="https://github.com/santaclaas/material-tailwind"
          >
            @claas.dev/material-tailwind
          </a>
        </p>
        <p class="text-body-md text-light-on-surface-variant dark:text-dark-on-surface-variant mb-4">
          Every color below is generated at build time from the source color,
          variant and spec version in <code>src/index.css</code>. Edit them
          there and the whole page follows.
        </p>
      </hgroup>
      <Scheme />
    </>
  );
}
