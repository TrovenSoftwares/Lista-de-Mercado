import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { itemsApi } from "@/react-app/lib/api";
import { useApi } from "@/react-app/hooks/useApi";
import type { Item, Market } from "@/shared/types";

interface MarkPurchasedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Item | null;
  markets: Market[];
}

export default function MarkPurchasedModal({
  isOpen,
  onClose,
  onSuccess,
  item,
  markets,
}: MarkPurchasedModalProps) {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [marketId, setMarketId] = useState<number | undefined>();
  const { execute, loading, error } = useApi(itemsApi.markPurchased);

  useEffect(() => {
    if (isOpen && item) {
      setPrice("");
      setQuantity("1");
      setMarketId(markets.length === 1 ? markets[0].id : undefined);
    }
  }, [isOpen, item, markets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const result = await execute(item.id, {
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      market_id: marketId,
    });
    
    if (result) {
      onSuccess();
      onClose();
    }
  };

  if (!item) return null;

  const subtotal = price && quantity ? parseFloat(price) * parseFloat(quantity) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marcar como Comprado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Produto</p>
          <p className="font-medium text-gray-900">{item.name}</p>
          {item.category && (
            <p className="text-xs text-gray-500 mt-1">{item.category}</p>
          )}
        </div>

        <Input
          label="Preço (R$)"
          type="number"
          step="0.01"
          min="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          required
        />

        <Input
          label="Quantidade"
          type="number"
          step="0.01"
          min="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1"
          required
        />

        {markets.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mercado {markets.length > 1 ? "(opcional)" : ""}
            </label>
            <select
              value={marketId || ""}
              onChange={(e) => setMarketId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            >
              {markets.length > 1 && <option value="">Selecione um mercado</option>}
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {subtotal > 0 && (
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-700">Subtotal</p>
            <p className="text-2xl font-bold text-emerald-900">
              R$ {subtotal.toFixed(2)}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
