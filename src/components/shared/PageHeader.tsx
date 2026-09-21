import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
    >
      <div>
        <h1 className=" md:text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </motion.div>
  );
}
