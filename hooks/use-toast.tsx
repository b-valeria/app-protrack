import { toast as toastify, type ToastOptions } from "react-toastify";

type Props = {
  title: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning" | "default";
  options?: ToastOptions;
};

export function useToast() {
  const toast = ({ title, description, type = "default", options }: Props) => {
    const toastContent = (
      <div className="cursor-default text-foreground py-1 px-2 gap-0.5 flex flex-col">
        <p className="text-md font-bold">{title}</p>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
    );

    switch (type) {
      case "success":
        toastify.success(toastContent, options);
        break;
      case "error":
        toastify.error(toastContent, options);
        break;
      case "info":
        toastify.info(toastContent, options);
        break;
      case "warning":
        toastify.warn(toastContent, options);
        break;
      default:
        toastify(toastContent, options);
        break;
    }
  };

  return { toast };
}
