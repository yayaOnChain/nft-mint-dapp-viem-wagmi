import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

describe("Card", () => {
  describe("rendering", () => {
    it("should render card with children", () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("should have default variant styles", () => {
      render(<Card>Default</Card>);
      const card = screen.getByText("Default").closest("div");
      expect(card).toHaveClass("bg-gray-800");
      expect(card).toHaveClass("border border-gray-700");
    });

    it("should have rounded-xl and p-6 classes by default", () => {
      render(<Card>Styled</Card>);
      const card = screen.getByText("Styled").closest("div");
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("p-6");
    });

    it("should have transition classes", () => {
      render(<Card>Transition</Card>);
      const card = screen.getByText("Transition").closest("div");
      expect(card).toHaveClass("transition-all");
      expect(card).toHaveClass("duration-300");
    });
  });

  describe("variants", () => {
    it("should have default variant", () => {
      render(<Card variant="default">Default</Card>);
      const card = screen.getByText("Default").closest("div");
      expect(card).toHaveClass("bg-gray-800");
      expect(card).toHaveClass("border border-gray-700");
    });

    it("should have outlined variant", () => {
      render(<Card variant="outlined">Outlined</Card>);
      const card = screen.getByText("Outlined").closest("div");
      expect(card).toHaveClass("bg-transparent");
      expect(card).toHaveClass("border-2 border-gray-700");
    });

    it("should have elevated variant", () => {
      render(<Card variant="elevated">Elevated</Card>);
      const card = screen.getByText("Elevated").closest("div");
      expect(card).toHaveClass("bg-gray-800");
      expect(card).toHaveClass("shadow-lg");
      expect(card).toHaveClass("shadow-purple-900/20");
    });
  });

  describe("custom className", () => {
    it("should merge custom className with base styles", () => {
      render(<Card className="custom-class">Custom</Card>);
      const card = screen.getByText("Custom").closest("div");
      expect(card).toHaveClass("custom-class");
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("p-6");
    });
  });

  describe("forwardRef", () => {
    it("should forward ref to div element", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Ref Test</Card>);
      expect(ref.current).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("should have displayName Card", () => {
      expect(Card.displayName).toBe("Card");
    });
  });
});

describe("CardHeader", () => {
  describe("rendering", () => {
    it("should render card header with children", () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("should have mb-4 class", () => {
      render(<CardHeader>Header</CardHeader>);
      const header = screen.getByText("Header").closest("div");
      expect(header).toHaveClass("mb-4");
    });
  });

  describe("custom className", () => {
    it("should merge custom className with base styles", () => {
      render(<CardHeader className="custom-header">Custom</CardHeader>);
      const header = screen.getByText("Custom").closest("div");
      expect(header).toHaveClass("custom-header");
      expect(header).toHaveClass("mb-4");
    });
  });

  describe("forwardRef", () => {
    it("should forward ref to div element", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<CardHeader ref={ref}>Ref Test</CardHeader>);
      expect(ref.current).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("should have displayName CardHeader", () => {
      expect(CardHeader.displayName).toBe("CardHeader");
    });
  });
});

describe("CardTitle", () => {
  describe("rendering", () => {
    it("should render card title with children", () => {
      render(<CardTitle>Title content</CardTitle>);
      expect(screen.getByText("Title content")).toBeInTheDocument();
    });

    it("should render as h3 element", () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    });

    it("should have default text styles", () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText("Title");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-semibold");
      expect(title).toHaveClass("text-white");
    });
  });

  describe("custom className", () => {
    it("should merge custom className with base styles", () => {
      render(<CardTitle className="custom-title">Custom</CardTitle>);
      const title = screen.getByText("Custom");
      expect(title).toHaveClass("custom-title");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-semibold");
    });
  });

  describe("forwardRef", () => {
    it("should forward ref to h3 element", () => {
      const ref = { current: null as HTMLHeadingElement | null };
      render(<CardTitle ref={ref}>Ref Test</CardTitle>);
      expect(ref.current).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("should have displayName CardTitle", () => {
      expect(CardTitle.displayName).toBe("CardTitle");
    });
  });
});

describe("CardContent", () => {
  describe("rendering", () => {
    it("should render card content with children", () => {
      render(<CardContent>Content here</CardContent>);
      expect(screen.getByText("Content here")).toBeInTheDocument();
    });

    it("should render as div element", () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText("Content").tagName).toBe("DIV");
    });
  });

  describe("custom className", () => {
    it("should merge custom className with base styles", () => {
      render(<CardContent className="custom-content">Custom</CardContent>);
      const content = screen.getByText("Custom");
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("forwardRef", () => {
    it("should forward ref to div element", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<CardContent ref={ref}>Ref Test</CardContent>);
      expect(ref.current).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("should have displayName CardContent", () => {
      expect(CardContent.displayName).toBe("CardContent");
    });
  });
});
