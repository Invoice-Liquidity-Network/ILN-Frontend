import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageHeader from "../PageHeader";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
  });

  it("renders description", () => {
    render(<PageHeader title="Dashboard" description="Test description here." />);
    expect(screen.getByText("Test description here.")).toBeInTheDocument();
  });

  it("renders breadcrumbs", () => {
    render(
      <PageHeader
        title="Details"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Details" },
        ]}
      />
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Details", { selector: "span" })).toBeInTheDocument();
  });

  it("renders actions", () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button>Create</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders complete layout", () => {
    render(
      <PageHeader
        title="Complete Layout"
        description="A full test."
        breadcrumbs={[{ label: "Nav", href: "/nav" }]}
        actions={<button>Action</button>}
      />
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Complete Layout");
    expect(screen.getByText("A full test.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nav" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("does not render optional sections when absent", () => {
    render(<PageHeader title="Minimal" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Minimal");
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // Ensuring no random text block exists
    const pElements = document.querySelectorAll("p");
    expect(pElements.length).toBe(0);
  });
});
