"use client";

import { useState } from "react";
import { useShowings } from "@/hooks/use-showings";
import { LocationSearchBox } from "@/components/search/location-search-box";

/**
 * Add a property to the tracker by hand (issue #29 / per-home tracking) — for
 * homes the buyer found off-platform (a yard sign, an open house, another
 * portal). Stored as a `manual` record so it isn't linked to a listing page.
 *
 * UX continuity (Item 4 / S0b): the shared S0a {@link LocationSearchBox}
 * pre-fills city/state (and a full street address when the pick is an address)
 * from a resolved place, so the buyer doesn't re-type the city/state. The
 * street-address field stays editable for a final tweak.
 *
 * GUARDRAIL (#22): address/area facts only — no protected-class fields. The box
 * resolves geography only (FHA).
 */
export function ManualAddShowing() {
  const { track, hydrated } = useShowings();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !city.trim() || !state.trim()) return;
    track({
      listingId: `manual-${Date.now()}`,
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase().slice(0, 2),
      manual: true,
    });
    setAddress("");
    setCity("");
    setState("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!hydrated}
        className="btn-secondary"
      >
        + Add a property manually
      </button>
    );
  }

  return (
    <form onSubmit={add} className="card space-y-3">
      <p className="text-sm font-semibold text-ink">Add a property</p>
      <LocationSearchBox
        label="Find the place"
        placeholder="Search a ZIP, address, or city"
        onResolve={(value, pickedLabel) => {
          // A full-address pick fills the street line; any pick fills city/state.
          if (value.mode === "current" && pickedLabel !== "Current location") {
            setAddress(pickedLabel);
          }
          if (value.city) setCity(value.city);
          if (value.state) setState(value.state);
        }}
      />
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Street address"
        aria-label="Street address"
        className="field"
      />
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          aria-label="City"
          className="field"
        />
        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
          aria-label="State"
          maxLength={2}
          className="field uppercase"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-sm">
          Add to tracker
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
