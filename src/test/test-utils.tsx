import { render } from "@testing-library/react";
import { type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { QueryClient } from "@tanstack/react-query";
import { TestProviders } from "./TestProviders";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}
    
     const customRender = (
       ui: ReactElement,
       { ...renderOptions }: CustomRenderOptions = {},
     ) => {
       return render(ui, {
         wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
         ...renderOptions,
       });
     };
     
     export { customRender as render };
