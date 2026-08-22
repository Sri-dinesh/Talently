/**
 * Create Task Page — Claude Brand Theme
 * /tasks/new
 */

import { CreateTaskForm } from "@/components/CreateTaskForm";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function NewTaskPage() {
  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A857B] dark:text-[#7D7970] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tasks</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-[#C15F3C] dark:text-[#D97757] font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Escrow Protected on Monad</span>
        </div>
      </div>

      <div className="text-center space-y-1.5 max-w-xl mx-auto pb-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A18] dark:text-[#F4F3EE]">
          Post a Human Micro-Task
        </h1>
        <p className="text-xs sm:text-sm text-[#8A857B] dark:text-[#7D7970] font-normal">
          Deposit MON reward into trustless escrow. Verified providers will accept, execute, and submit structured proof.
        </p>
      </div>

      <CreateTaskForm />
    </div>
  );
}
