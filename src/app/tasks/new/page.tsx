/**
 * Create Task Page
 * /tasks/new
 */

import { CreateTaskForm } from "@/components/CreateTaskForm";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function NewTaskPage() {
  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tasks</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Escrow Protected on Monad</span>
        </div>
      </div>

      <div className="text-center space-y-2 max-w-xl mx-auto pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Post a Human Micro-Task
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Deposit MON reward into trustless escrow. Verified providers will accept, execute, and submit structured results.
        </p>
      </div>

      <CreateTaskForm />
    </div>
  );
}
