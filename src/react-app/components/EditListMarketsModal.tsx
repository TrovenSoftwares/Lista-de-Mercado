import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { listsApi, marketsApi } from "@/react-app/lib/api";
import { useApi } from "@/react-app/hooks/useApi";
import type { Market, ListWithItems } from "@/shared/types";

interface EditListMarketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  list: ListWithItems;
}

export default function EditListMarketsModal({
  isOpen,
  onClose,
  onSuccess,
  list,
}: EditListMarketsModalProps) {
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [selectedMarketIds, setSelectedMarketIds] = useState<number[]>([]);
  const { execute, loading, error } = useApi(listsApi.update);

  useEffect(() => {
    if (isOpen) {
      marketsApi.getAll().then(setAllMarkets);
      setSelectedMarketIds(list.markets.map((m) => m.id));
    }
  }, [isOpen, list.markets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute(list.id, {
      market_ids: selectedMarketIds,
    });
    if (result) {
      onSuccess();
      onClose();
    }
  };

  const toggleMarket = (marketId: number) => {
    setSelectedMarketIds((prev) =>
      prev.includes(marketId)
        ? prev.filter((id) => id !== marketId)
        : [...prev, marketId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Mercados da Lista">
      <form onSubmit={handleSubmit} className="space-y-4">
        {allMarkets.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              Nenhum mercado cadastrado ainda
            </p>
            <p className="text-sm text-gray-500">
              Cadastre mercados na página de gerenciamento para associá-los às suas listas
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione os mercados
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allMarkets.map((market) => (
                <label
                  key={market.id}
                  className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMarketIds.includes(market.id)}
                    onChange={() => toggleMarket(market.id)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{market.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
