/** @jsxImportSource solid-js */

/**
 * @param {{role: string, token: string, class: string,}} properties
 */
function Swatch({ role, token, class: classes }) {
  return (
    <div class={`${classes} px-3 pb-3 pt-2.5 capitalize`}>
      <p>{role}</p>
      <p class="text-end">{token}</p>
    </div>
  );
}

export default function Scheme() {
  return (
    <article class="grid grid-cols-4 gap-4">
      <div class="col-span-3 grid grid-cols-subgrid gap-1">
        <div class="space-y-1">
          {/* Primary */}
          <div>
            <Swatch
              role="Primary"
              token="p-40"
              class="bg-primary-40 dark:bg-dark-primary text-light-on-primary dark:text-dark-on-primary"
            />
            <Swatch
              role="On Primary"
              token="p-100"
              class="bg-light-on-primary dark:bg-dark-on-primary text-light-primary dark:text-dark-primary"
            />
          </div>
          <div>
            <Swatch
              role="Primary Container"
              token="p-90"
              class="bg-light-primary-container dark:bg-dark-primary-container
                      text-light-on-primary-container dark:text-dark-on-primary-container"
            />
            <Swatch
              role="On Primary Container"
              token="p-10"
              class="bg-light-on-primary-container dark:bg-dark-on-primary-container
                      text-light-primary-container dark:text-dark-primary-container"
            />
          </div>
        </div>
        <div class="space-y-1">
          {/* Secondary */}
          <div>
            <Swatch
              role="secondary"
              token="s-40"
              class="bg-secondary-40 dark:bg-dark-secondary text-light-on-secondary dark:text-dark-on-secondary"
            />
            <Swatch
              role="On secondary"
              token="s-100"
              class="bg-light-on-secondary dark:bg-dark-on-secondary text-light-secondary dark:text-dark-secondary"
            />
          </div>
          <div>
            <Swatch
              role="secondary Container"
              token="s-90"
              class="bg-light-secondary-container dark:bg-dark-secondary-container
                      text-light-on-secondary-container dark:text-dark-on-secondary-container"
            />
            <Swatch
              role="On secondary Container"
              token="s-10"
              class="bg-light-on-secondary-container dark:bg-dark-on-secondary-container
                      text-light-secondary-container dark:text-dark-secondary-container"
            />
          </div>
        </div>{" "}
        <div class="space-y-1">
          {/* Tertiary */}
          <div>
            <Swatch
              role="tertiary"
              token="t-40"
              class="bg-tertiary-40 dark:bg-dark-tertiary text-light-on-tertiary dark:text-dark-on-tertiary"
            />
            <Swatch
              role="On tertiary"
              token="p-100"
              class="bg-light-on-tertiary dark:bg-dark-on-tertiary text-light-tertiary dark:text-dark-tertiary"
            />
          </div>
          <div>
            <Swatch
              role="tertiary Container"
              token="t-90"
              class="bg-light-tertiary-container dark:bg-dark-tertiary-container
                      text-light-on-tertiary-container dark:text-dark-on-tertiary-container"
            />
            <Swatch
              role="On tertiary Container"
              token="t-10"
              class="bg-light-on-tertiary-container dark:bg-dark-on-tertiary-container
                      text-light-tertiary-container dark:text-dark-tertiary-container"
            />
          </div>
        </div>
      </div>
      <div class="space-y-1">
        {/* Error */}
        <div>
          <Swatch
            role="error"
            token="e-40"
            class="bg-error-40 dark:bg-dark-error text-light-on-error dark:text-dark-on-error"
          />
          <Swatch
            role="On error"
            token="p-100"
            class="bg-light-on-error dark:bg-dark-on-error text-light-error dark:text-dark-error"
          />
        </div>
        <div>
          <Swatch
            role="error Container"
            token="e-90"
            class="bg-light-error-container dark:bg-dark-error-container
                      text-light-on-error-container dark:text-dark-on-error-container"
          />
          <Swatch
            role="On error Container"
            token="e-10"
            class="bg-light-on-error-container dark:bg-dark-on-error-container
                      text-light-error-container dark:text-dark-error-container"
          />
        </div>
      </div>
      <div class="col-span-3 grid grid-cols-subgrid gap-1">
        {/* Fixed colors */}
        <div class="grid grid-cols-2 ">
          {/* Primary Fixed */}
          <Swatch
            role="Primary Fixed"
            token="p-90"
            class="bg-light-primary-fixed dark:bg-dark-primary-fixed
            text-light-on-primary-fixed dark:text-dark-on-primary-fixed"
          />
          <Swatch
            role="Primary Fixed Dim"
            token="p-80"
            class="bg-light-primary-fixed-dim dark:bg-dark-primary-fixed-dim
            text-light-on-primary-fixed-variant dark:text-dark-on-primary-fixed-variant"
          />
          <Swatch
            role="On Primary Fixed"
            token="p-10"
            class="bg-light-on-primary-fixed dark:bg-dark-on-primary-fixed
            text-light-primary-fixed dark:text-dark-primary-fixed
            col-span-2"
          />
          <Swatch
            role="On Primary Fixed Variant"
            token="p-30"
            class="bg-light-on-primary-fixed-variant dark:bg-dark-primary-fixed-variant
            text-light-primary-fixed-dim dark:text-dark-primary-fixed-dim
            col-span-2"
          />
        </div>
        <div class="grid grid-cols-2">
          {/* Secondary Fixed */}
          <Swatch
            role="secondary Fixed"
            token="s-90"
            class="bg-light-secondary-fixed dark:bg-dark-secondary-fixed
            text-light-on-secondary-fixed dark:text-dark-on-secondary-fixed"
          />
          <Swatch
            role="secondary Fixed Dim"
            token="s-80"
            class="bg-light-secondary-fixed-dim dark:bg-dark-secondary-fixed-dim
            text-light-on-secondary-fixed-variant dark:text-dark-on-secondary-fixed-variant"
          />
          <Swatch
            role="On secondary Fixed"
            token="s-10"
            class="bg-light-on-secondary-fixed dark:bg-dark-on-secondary-fixed
            text-light-secondary-fixed dark:text-dark-secondary-fixed
            col-span-2"
          />
          <Swatch
            role="On secondary Fixed Variant"
            token="s-30"
            class="bg-light-on-secondary-fixed-variant dark:bg-dark-secondary-fixed-variant
            text-light-secondary-fixed-dim dark:text-dark-secondary-fixed-dim
            col-span-2"
          />
        </div>
        <div class="grid grid-cols-2">
          {/* Tertiary Fixed */}
          <Swatch
            role="tertiary Fixed"
            token="t-90"
            class="bg-light-tertiary-fixed dark:bg-dark-tertiary-fixed
            text-light-on-tertiary-fixed dark:text-dark-on-tertiary-fixed"
          />
          <Swatch
            role="tertiary Fixed Dim"
            token="t-80"
            class="bg-light-tertiary-fixed-dim dark:bg-dark-tertiary-fixed-dim
            text-light-on-tertiary-fixed-variant dark:text-dark-on-tertiary-fixed-variant"
          />
          <Swatch
            role="On tertiary Fixed"
            token="t-10"
            class="bg-light-on-tertiary-fixed dark:bg-dark-on-tertiary-fixed
            text-light-tertiary-fixed dark:text-dark-tertiary-fixed
            col-span-2"
          />
          <Swatch
            role="On tertiary Fixed Variant"
            token="t-30"
            class="bg-light-on-tertiary-fixed-variant dark:bg-dark-tertiary-fixed-variant
            text-light-tertiary-fixed-dim dark:text-dark-tertiary-fixed-dim
            col-span-2"
          />
        </div>
      </div>
      <div class="grid col-span-3 grid-cols-subgrid gap-1">
        {/* Bottom row */}
        <div class="col-span-3 grid grid-cols-subgrid gap-0">
          <Swatch
            role="Surface Dim"
            token="n-87"
            class="bg-light-surface-dim dark:bg-dark-surface-dim"
          />
          <Swatch
            role="Surface"
            token="n-98"
            class="bg-light-surface dark:bg-dark-surface"
          />
          <Swatch
            role="Surface Bright"
            token="n-98"
            class="bg-light-surface-bright  dark:bg-dark-surface-bright"
          />
        </div>
        <div class="col-span-3 grid grid-flow-col">
          <Swatch
            role="Surf. Container Lowest"
            token="n-100"
            class="bg-light-surface-container-lowest dark:bg-dark-surface-container-lowest"
          />
          <Swatch
            role="Surf. Container Low"
            token="n-96"
            class="bg-light-surface-container-low dark:bg-dark-surface-container-low"
          />
          <Swatch
            role="Surf. Container"
            token="n-94"
            class="bg-light-surface-container dark:bg-dark-surface-container"
          />
          <Swatch
            role="Surf. Container High"
            token="n-92"
            class="bg-light-surface-container-high dark:bg-dark-surface-container-high"
          />
          <Swatch
            role="Surf. Container Highest"
            token="n-90"
            class="bg-light-surface-container-highest dark:bg-dark-surface-container-highest"
          />
        </div>
        <div class="col-span-3 grid grid-flow-col">
          <Swatch
            role="On Surface"
            token="n-10"
            class="bg-light-on-surface dark:bg-dark-on-surface text-light-surface"
          />
          <Swatch
            role="On Surface Var."
            token="NV-30"
            class="bg-light-on-surface-variant dark:bg-dark-on-surface-variant text-light-surface"
          />
          <Swatch
            role="Outline"
            token="NV-50"
            class="bg-light-outline dark:bg-dark-outline text-light-surface"
          />
          <Swatch
            role="Outline"
            token="NV-80"
            class="bg-light-outline-variant dark:bg-dark-outline-variant text-light-inverse-surface"
          />
        </div>
      </div>
      <div class="space-y-1">
        <div>
          {/* Inverses */}
          <Swatch
            role="Inverse Surface"
            token="N-20"
            class="bg-light-inverse-surface dark:bg-dark-inverse-surface text-light-inverse-on-surface"
          />
          <Swatch
            role="Inverse On Surface"
            token="N-95"
            class=" bg-light-inverse-on-surface dark:bg-dark-inverse-on-surface text-light-inverse-surface"
          />
        </div>
        <Swatch
          role="Inverse Primary"
          token="P-80"
          class="bg-light-inverse-primary dark:bg-dark-inverse-primary text-light-on-primary-container"
        />
        <div class="grid grid-cols-2 gap-4">
          <Swatch
            role="Scrim"
            token="N-0"
            class="bg-light-scrim dark:bg-dark-scrim text-light-surface"
          />
          <Swatch
            role="Shadow"
            token="N-0"
            class="bg-light-shadow dark:bg-dark-shadow text-light-surface"
          />
        </div>
      </div>
    </article>
  );
}
