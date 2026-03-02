import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  NFTCardSkeleton,
  TransactionRowSkeleton,
  MintFormSkeleton,
} from "../Skeleton";

describe("Skeleton", () => {
  describe("rendering", () => {
    it("should render skeleton div", () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("should have base styles", () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
      expect(skeleton).toHaveClass("bg-gray-700");
    });

    it("should have rect variant styles by default", () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-lg");
    });
  });

  describe("variants", () => {
    it("should have text variant", () => {
      render(<Skeleton variant="text" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-4");
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("rounded");
    });

    it("should have circle variant", () => {
      render(<Skeleton variant="circle" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("should have rect variant", () => {
      render(<Skeleton variant="rect" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-lg");
    });

    it("should have card variant", () => {
      render(<Skeleton variant="card" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-xl");
    });
  });

  describe("custom className", () => {
    it("should merge custom className with base styles", () => {
      render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("custom-skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
      expect(skeleton).toHaveClass("bg-gray-700");
    });
  });

  describe("data-testid", () => {
    it("should have data-testid attribute when provided", () => {
      render(<Skeleton data-testid="test-skeleton" />);
      expect(screen.getByTestId("test-skeleton")).toBeInTheDocument();
    });

    it("should not have data-testid attribute when not provided", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).not.toHaveAttribute("data-testid");
    });
  });
});

describe("NFTCardSkeleton", () => {
  it("should render NFT card skeleton structure", () => {
    render(<NFTCardSkeleton />);
    expect(screen.getByTestId("nft-card-skeleton")).toBeInTheDocument();
  });

  it("should have card container styles", () => {
    render(<NFTCardSkeleton />);
    const container = screen.getByTestId("nft-card-skeleton");
    expect(container).toHaveClass("bg-gray-800");
    expect(container).toHaveClass("rounded-lg");
    expect(container).toHaveClass("overflow-hidden");
    expect(container).toHaveClass("border border-gray-700");
  });

  it("should have image placeholder skeleton", () => {
    render(<NFTCardSkeleton />);
    const container = screen.getByTestId("nft-card-skeleton");
    const imageSkeleton = container.querySelector("[class*='aspect-square']");
    expect(imageSkeleton).toBeInTheDocument();
    expect(imageSkeleton).toHaveClass("w-full");
  });

  it("should have info section with text skeletons", () => {
    render(<NFTCardSkeleton />);
    const container = screen.getByTestId("nft-card-skeleton");
    const infoSection = container.querySelector(".p-3");
    expect(infoSection).toBeInTheDocument();
    expect(infoSection).toHaveClass("space-y-2");

    const textSkeletons = infoSection?.querySelectorAll("[class*='animate-pulse']");
    expect(textSkeletons).toHaveLength(2);
  });
});

describe("TransactionRowSkeleton", () => {
  it("should render table row skeleton", () => {
    render(
      <table>
        <tbody>
          <TransactionRowSkeleton />
        </tbody>
      </table>,
    );
    expect(screen.getByRole("row")).toBeInTheDocument();
  });

  it("should have 4 table cells", () => {
    render(
      <table>
        <tbody>
          <TransactionRowSkeleton />
        </tbody>
      </table>,
    );
    const row = screen.getByRole("row");
    const cells = row.querySelectorAll("td");
    expect(cells).toHaveLength(4);
  });

  it("should have border styles", () => {
    render(
      <table>
        <tbody>
          <TransactionRowSkeleton />
        </tbody>
      </table>,
    );
    const row = screen.getByRole("row");
    expect(row).toHaveClass("border-b");
    expect(row).toHaveClass("border-gray-700/50");
  });

  it("should have skeleton in each cell", () => {
    render(
      <table>
        <tbody>
          <TransactionRowSkeleton />
        </tbody>
      </table>,
    );
    const row = screen.getByRole("row");
    const cells = row.querySelectorAll("td");
    cells.forEach((cell) => {
      expect(cell.querySelector("[class*='animate-pulse']")).toBeInTheDocument();
    });
  });
});

describe("MintFormSkeleton", () => {
  it("should render mint form skeleton structure", () => {
    render(<MintFormSkeleton />);
    expect(screen.getByTestId("mint-form-skeleton")).toBeInTheDocument();
  });

  it("should have container styles", () => {
    render(<MintFormSkeleton />);
    const container = screen.getByTestId("mint-form-skeleton");
    expect(container).toHaveClass("p-6");
    expect(container).toHaveClass("bg-gray-800");
    expect(container).toHaveClass("rounded-lg");
    expect(container).toHaveClass("border border-gray-700");
    expect(container).toHaveClass("max-w-md");
    expect(container).toHaveClass("mx-auto");
    expect(container).toHaveClass("space-y-4");
  });

  it("should have title skeleton", () => {
    render(<MintFormSkeleton />);
    const container = screen.getByTestId("mint-form-skeleton");
    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild).toHaveClass("w-1/2");
    expect(firstChild).toHaveClass("h-8");
  });

  it("should have 5 form field skeletons", () => {
    render(<MintFormSkeleton />);
    const container = screen.getByTestId("mint-form-skeleton");
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons).toHaveLength(5); // 1 title + 4 fields
  });
});
