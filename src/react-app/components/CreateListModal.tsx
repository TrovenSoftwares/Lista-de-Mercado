import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { listsApi, marketsApi } from "@/react-app/lib/api";
import { useApi } from "@/react-app/hooks/useApi";
import type { Market } from "@/shared/types";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateListModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketIds, setSelectedMarketIds] = useState<number[]>([]);
  const { execute, loading, error } = useApi(listsApi.create);

  useEffect(() => {
    if (isOpen) {
      marketsApi.getAll().then(setMarkets);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute({
      name,
      market_ids: selectedMarketIds.length > 0 ? selectedMarketIds : undefined,
    });
    if (result) {
      setName("");
      setSelectedMarketIds([]);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Lista">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome da Lista"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Compras da Semana"
          error={error || undefined}
          required
        />
        
        {markets.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mercados (opcional)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {markets.map((market) => (
                <label
                  key={market.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
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

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Criar Lista
          </Button>
        </div>
      </form>
    </Modal>
  );
}
