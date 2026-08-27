"use client";

import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  isValid?: boolean | (() => boolean | Promise<boolean>);
}

export interface FormWizardProps {
  steps: WizardStep[];
  currentStep?: number;
  onStepChange?: (stepIndex: number) => void;
  onComplete: () => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  className?: string;
}

export function FormWizard({
  steps,
  currentStep: controlledStep,
  onStepChange,
  onComplete,
  isSubmitting = false,
  submitLabel = "Submit Order",
  className,
}: FormWizardProps) {
  const [internalStep, setInternalStep] = useState<number>(0);
  const [validating, setValidating] = useState<boolean>(false);

  const activeStepIndex = controlledStep !== undefined ? controlledStep : internalStep;
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === steps.length - 1;
  const activeStep = steps[activeStepIndex];

  const handleStepChange = (targetIndex: number) => {
    if (controlledStep === undefined) {
      setInternalStep(targetIndex);
    }
    onStepChange?.(targetIndex);
  };

  const validateStep = async (step: WizardStep): Promise<boolean> => {
    if (step.isValid === undefined) return true;
    if (typeof step.isValid === "boolean") return step.isValid;
    if (typeof step.isValid === "function") {
      setValidating(true);
      try {
        return await step.isValid();
      } finally {
        setValidating(false);
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!activeStep) return;
    const isValid = await validateStep(activeStep);
    if (!isValid) return;

    if (isLastStep) {
      await onComplete();
    } else {
      handleStepChange(activeStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    handleStepChange(activeStepIndex - 1);
  };

  return (
    <div className={cn("w-full flex flex-col gap-6", className)}>
      {/* Wizard Header / Step Progress Indicator */}
      <div className="w-full bg-white p-4 rounded-md border border-border-main shadow-xs">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, index) => {
            const isCompleted = index < activeStepIndex;
            const isCurrent = index === activeStepIndex;

            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-center gap-3 relative flex-1",
                  index !== steps.length - 1 &&
                    "after:content-[''] after:w-full after:h-0.5 after:bg-neutral-100 after:inline-block after:mx-2 flex-1"
                )}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-mono font-semibold text-xs transition-colors shrink-0",
                      isCompleted && "bg-success text-white",
                      isCurrent && "bg-accent text-white ring-4 ring-accent-light",
                      !isCompleted && !isCurrent && "bg-neutral-100 text-muted"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
                  </div>

                  <div className="hidden md:flex flex-col">
                    <span
                      className={cn(
                        "text-xs font-semibold leading-tight",
                        isCurrent && "text-brand",
                        isCompleted && "text-text-main",
                        !isCompleted && !isCurrent && "text-text-placeholder"
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="text-[10px] text-muted">{step.description}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step Content */}
      <div className="bg-white p-6 rounded-md border border-border-main shadow-xs min-h-[240px]">
        <div className="mb-4 pb-3 border-b border-neutral-100">
          <h3 className="font-serif font-semibold text-lg text-brand">
            {activeStep?.title}
          </h3>
          {activeStep?.description && (
            <p className="text-xs text-muted mt-0.5">{activeStep.description}</p>
          )}
        </div>

        <div>{activeStep?.content}</div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between bg-white p-4 rounded-md border border-border-main shadow-xs">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep || isSubmitting || validating}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <Button
          variant={isLastStep ? "primary" : "secondary"}
          onClick={handleNext}
          isLoading={isSubmitting || validating}
          rightIcon={!isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined}
        >
          {isLastStep ? submitLabel : "Next Step"}
        </Button>
      </div>
    </div>
  );
}
