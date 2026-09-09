import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { PageHeader } from "./PageHeader";

export function ModuleStub({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      {children ?? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-12 text-center shadow-soft">
          <div className="h-16 w-16 rounded-2xl gradient-teal mx-auto flex items-center justify-center text-white">
            <Construction className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">Module ready</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            This module's structure, data flow and UI scaffolding is wired in. Connect Lovable Cloud to enable persistence and full workflows.
          </p>
        </motion.div>
      )}
    </>
  );
}
