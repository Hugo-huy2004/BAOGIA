import { Icon as Iconify } from "@iconify/react";
import type { ComponentProps } from "react";
import { useMounted } from "./useMounted";

export default function Icon(props: ComponentProps<typeof Iconify>) {
  return useMounted() ? <Iconify {...props} /> : null;
}
