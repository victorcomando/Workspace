import { CModal } from "@coreui/react";
import type { ComponentProps } from "react";

type AppModalProps = ComponentProps<typeof CModal>;

export const AppModal = ({ className, ...props }: AppModalProps) => {
  const mergedClassName = className
    ? `app-modal ${className}`.trim()
    : "app-modal";

  return <CModal className={mergedClassName} {...props} />;
};
