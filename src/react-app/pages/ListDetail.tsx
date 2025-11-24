import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  ShoppingBag,
  Store,
  Edit2,
  Share2,
} from "lucide-react";
import Button from "@/react-app/components/Button";
import AddItemModal from "@/react-app/components/AddItemModal";
import MarkPurchasedModal from "@/react-app/components/MarkPurchasedModal";
import EditListMarketsModal from "@/react-app/components/EditListMarketsModal";
import ShareListModal from "@/react-app/components/ShareListModal";
import { listsApi, itemsApi } from "@/react-app/lib/api";
import type { ListWithItems, Item } from "@/shared/types";

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ListWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showEditMarketsModal, setShowEditMarketsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const fetchList = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await listsApi.getById(parseInt(id));
      setList(data);
    } catch (error) {
      console.error("Erro ao carregar lista:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [id]);

  const handleTogglePurchased = async (item: Item) => {
    if (item.is_purchased) {
      try {
        await itemsApi.unmarkPurchased(item.id);
        fetchList();
      } catch (error) {
        console.error("Erro ao desmarcar item:", error);
      }
    } else {
      setSelectedItem(item);
      setShowMarkModal(true);
    }
  };

  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (confirm(`Tem certeza que deseja excluir "${itemName}"?`)) {
      try {
        await itemsApi.delete(itemId);
        fetchList();
      } catch (error) {
        console.error("Erro ao excluir item:", error);
      }
    }
  };

  if (loading || !list) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin">
          <ShoppingBag className="w-10 h-10 text-emerald-600" />
        </div>
      </div>
    );
  }

  const pendingItems = list.items.filter((item) => !item.is_purchased);
  const purchasedItems = list.items.filter((item) => item.is_purchased);
  const total = purchasedItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  const totalByMarket = list.markets.reduce((acc, market) => {
    const marketTotal = purchasedItems
      .filter((item) => item.market_id === market.id)
      .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    acc[market.id] = marketTotal;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {list.name}
                  </h1>
                  {list.is_shared && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                      Compartilhada
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  {new Date(list.created_at).toLocaleDateString("pt-BR", {
                    dateStyle: "long",
                  })}
                </p>
              </div>
              {!list.is_shared && (
                <Button
                  onClick={() => setShowShareModal(true)}
                  variant="secondary"
                  className="gap-2 flex-shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {list.markets.length > 0 ? (
                <>
                  {list.markets.map((market) => (
                    <span
                      key={market.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium"
                    >
                      <Store className="w-4 h-4" />
                      {market.name}
                    </span>
                  ))}
                  <button
                    onClick={() => setShowEditMarketsModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Editar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowEditMarketsModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Mercados
                </button>
              )}
            </div>
          </div>

          {total > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-emerald-100 mb-1 text-sm sm:text-base">Total da Lista</p>
                  <p className="text-3xl sm:text-4xl font-bold">R$ {total.toFixed(2)}</p>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-2">
                    {purchasedItems.length} de {list.items.length} itens comprados
                  </p>
                </div>
                <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-200 opacity-50 flex-shrink-0" />
              </div>

              {list.markets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-400/30">
                  <p className="text-emerald-100 text-xs sm:text-sm mb-2">Total por Mercado</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {list.markets.map((market) => {
                      const marketTotal = totalByMarket[market.id] || 0;
                      if (marketTotal === 0) return null;
                      return (
                        <div key={market.id} className="bg-white/10 rounded-lg px-3 py-2">
                          <p className="text-emerald-100 text-xs truncate">{market.name}</p>
                          <p className="text-white font-semibold text-sm sm:text-base">
                            R$ {marketTotal.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Adicionar Produto
          </Button>
        </div>

        {pendingItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Itens Pendentes ({pendingItems.length})
            </h2>
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleTogglePurchased(item)}
                      className="mt-1 w-6 h-6 border-2 border-gray-300 rounded-md hover:border-emerald-500 transition-colors flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.category && (
                        <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {purchasedItems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Itens Comprados ({purchasedItems.length})
            </h2>
            <div className="space-y-3">
              {purchasedItems.map((item) => {
                const subtotal = (item.price || 0) * (item.quantity || 0);
                const market = list.markets.find((m) => m.id === item.market_id);
                
                return (
                  <div
                    key={item.id}
                    className="bg-emerald-50 rounded-xl p-4 shadow-md border border-emerald-200"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleTogglePurchased(item)}
                        className="mt-1 w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center flex-shrink-0"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-through decoration-2">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          <span className="text-gray-700">
                            Qtd: {item.quantity}
                          </span>
                          <span className="text-gray-700">
                            R$ {item.price?.toFixed(2)}
                          </span>
                          <span className="font-semibold text-emerald-700">
                            Subtotal: R$ {subtotal.toFixed(2)}
                          </span>
                        </div>
                        {market && (
                          <div className="flex items-center gap-1 mt-2">
                            <Store className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {market.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {list.items.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Lista vazia
            </h3>
            <p className="text-gray-600 mb-6">
              Adicione produtos para começar suas compras
            </p>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Produto
            </Button>
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchList}
        listId={parseInt(id!)}
      />

      <MarkPurchasedModal
        isOpen={showMarkModal}
        onClose={() => {
          setShowMarkModal(false);
          setSelectedItem(null);
        }}
        onSuccess={fetchList}
        item={selectedItem}
        markets={list.markets}
      />

      <EditListMarketsModal
        isOpen={showEditMarketsModal}
        onClose={() => setShowEditMarketsModal(false)}
        onSuccess={fetchList}
        list={list}
      />

      {!list.is_shared && (
        <ShareListModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onSuccess={fetchList}
          listId={parseInt(id!)}
          sharedUsers={list.shared_users || []}
        />
      )}
    </div>
  );
}
