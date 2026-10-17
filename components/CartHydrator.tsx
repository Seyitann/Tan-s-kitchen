"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

// Loads the saved cart from the browser once the page is on screen
export default function CartHydrator() {
  useEffect(() => {
    // hydrated tells pages the saved cart has finished loading
    Promise.resolve(useCart.persist.rehydrate()).finally(() =>
      useCart.setState({ hydrated: true })
    );
  }, []);

  return null;
}
