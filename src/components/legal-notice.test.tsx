import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  LegalNotice,
  NOT_A_LAW_FIRM,
  SUBJECT_TO_ATTORNEY_REVIEW,
} from "./legal-notice";

describe("LegalNotice constants", () => {
  it("the NOT_A_LAW_FIRM constant carries the key phrases", () => {
    expect(NOT_A_LAW_FIRM).toMatch(/not a law firm/i);
    expect(NOT_A_LAW_FIRM).toMatch(/brokerage/i);
    expect(NOT_A_LAW_FIRM).toMatch(/does not provide legal advice/i);
  });

  it("the SUBJECT_TO_ATTORNEY_REVIEW constant carries the key phrases", () => {
    expect(SUBJECT_TO_ATTORNEY_REVIEW).toMatch(/subject to review by a licensed attorney/i);
    expect(SUBJECT_TO_ATTORNEY_REVIEW).toMatch(/education/i);
  });
});

describe("LegalNotice (banner)", () => {
  it("renders the not-a-law-firm framing", () => {
    render(<LegalNotice />);
    expect(screen.getByText(/not a law firm/i)).toBeInTheDocument();
    expect(screen.getByText(/does not provide legal advice/i)).toBeInTheDocument();
  });

  it("renders the subject-to-attorney-review framing", () => {
    render(<LegalNotice />);
    expect(
      screen.getByText(/subject to review by a licensed attorney/i),
    ).toBeInTheDocument();
  });

  it("is announced as a note for assistive tech", () => {
    render(<LegalNotice />);
    expect(screen.getByRole("note")).toBeInTheDocument();
  });
});

describe("LegalNotice (inline)", () => {
  it("still carries both phrases in the compact variant", () => {
    render(<LegalNotice variant="inline" />);
    expect(screen.getByText(/not a law firm/i)).toBeInTheDocument();
    expect(
      screen.getByText(/subject to review by a licensed attorney/i),
    ).toBeInTheDocument();
  });
});
