import React from 'react';
import { User, MessageSquare, Briefcase, Camera, FileCheck, Check } from 'lucide-react';

interface WizardStepsIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

const steps = [
  { number: 1, label: 'Información', icon: User },
  { number: 2, label: 'Sobre mí', icon: MessageSquare },
  { number: 3, label: 'Servicio', icon: Briefcase },
  { number: 4, label: 'Portafolio', icon: Camera },
  { number: 5, label: 'Verificación', icon: FileCheck }
];

const WizardStepsIndicator: React.FC<WizardStepsIndicatorProps> = ({
  currentStep,
  completedSteps,
  onStepClick
}) => {
  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'pending';
  };

  const getStepColor = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    if (status === 'completed') return 'bg-green-500 text-white border-green-500';
    if (status === 'current') return 'bg-blue-600 text-white border-blue-600';
    return 'bg-white text-gray-400 border-gray-300';
  };

  const getLineColor = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return 'bg-green-500';
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white border-b border-gray-200 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="relative">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.number);
              const Icon = step.icon;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center relative z-10">
                    <button
                      onClick={() => onStepClick(step.number)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all ${getStepColor(
                        step.number
                      )} cursor-pointer hover:scale-110`}
                    >
                      {status === 'completed' ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                    <span
                      className={`hidden sm:block mt-2 text-xs font-medium text-center ${
                        status === 'current' ? 'text-blue-600 font-bold' : status === 'completed' ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-300 mx-1 sm:mx-2 relative top-0 sm:top-[-20px]">
                      <div
                        className={`h-full transition-all ${getLineColor(step.number)}`}
                        style={{ width: completedSteps.includes(step.number) ? '100%' : '0%' }}
                      ></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* En mobile las etiquetas de los pasos están ocultas: mostramos aquí la del paso actual */}
            <span className="text-sm font-medium text-gray-600 truncate">
              <span className="sm:hidden">
                Paso {currentStep} de 5 · {steps.find(s => s.number === currentStep)?.label}
              </span>
              <span className="hidden sm:inline">Progreso</span>
            </span>
            <span className="text-sm font-bold text-blue-600 shrink-0">{(currentStep / 5) * 100}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardStepsIndicator;
