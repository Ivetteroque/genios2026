import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';

interface SubscriptionSectionProps {
  price: number;
  currency: string;
  daysRemaining: number;
  isActive: boolean;
  onManageSubscription: () => void;
}

export default function SubscriptionSection({
  price,
  currency,
  daysRemaining,
  isActive,
  onManageSubscription
}: SubscriptionSectionProps) {
  const currencySymbol = currency === 'PEN' ? 'S/' : '$';

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Suscripción</h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start gap-6">
          <div className="p-4 rounded-xl bg-amber-50">
            <CheckCircle2 className="w-8 h-8 text-amber-500" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">Plan activo: Genio</h3>
            </div>

            <p className="text-2xl font-bold text-gray-900 mb-1">
              {currencySymbol}{price} al año
            </p>

            <p className="text-sm text-gray-600 mb-6">
              Te quedan <span className="font-semibold text-blue-600">{daysRemaining} días</span> de visibilidad
            </p>

            <button
              onClick={onManageSubscription}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Gestionar suscripción
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isActive && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                Tu suscripción ha expirado. Renueva para seguir apareciendo en las búsquedas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}