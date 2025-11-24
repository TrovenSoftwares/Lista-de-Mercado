import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, Calendar, Store, ShoppingCart, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import Button from "@/react-app/components/Button";
import { analyticsApi } from "@/react-app/lib/analytics-api";
import type { DayAnalytics, MarketAnalytics, AnalyticsSummary } from "@/shared/analytics-types";

const COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'];

export default function Analytics() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dayData, setDayData] = useState<DayAnalytics[]>([]);
  const [marketData, setMarketData] = useState<MarketAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, dayRes, marketRes] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getByDay(),
          analyticsApi.getByMarket(),
        ]);
        setSummary(summaryRes);
        setDayData(dayRes);
        setMarketData(marketRes);
      } catch (error) {
        console.error("Erro ao carregar analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin">
          <ShoppingCart className="w-10 h-10 text-emerald-600" />
        </div>
      </div>
    );
  }

  const bestDay = dayData.length > 0 
    ? dayData.reduce((prev, current) => 
        current.avg_spent < prev.avg_spent ? current : prev
      ) 
    : null;

  const bestMarket = marketData.filter(m => m.items_purchased > 0).length > 0
    ? marketData.filter(m => m.items_purchased > 0).reduce((prev, current) =>
        current.avg_item_cost < prev.avg_item_cost ? current : prev
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Dashboard de Análises</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Insights sobre seus padrões de compra e economia
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              <span className="text-xs sm:text-sm text-gray-500">Total Gasto</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              R$ {summary?.total_spent.toFixed(2) || "0.00"}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-xs sm:text-sm text-gray-500">Itens Comprados</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {summary?.total_items || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <span className="text-xs sm:text-sm text-gray-500">Listas Completas</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {summary?.total_lists || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
              <span className="text-xs sm:text-sm text-gray-500">Média por Lista</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              R$ {summary?.avg_list_cost.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold">Melhor Dia para Comprar</h3>
                <p className="text-emerald-100 text-xs sm:text-sm">Com base no menor custo médio</p>
              </div>
            </div>
            {bestDay ? (
              <>
                <p className="text-3xl sm:text-4xl font-bold mb-2">{bestDay.day_name}</p>
                <p className="text-emerald-100 text-sm sm:text-base">
                  Média de R$ {bestDay.avg_spent.toFixed(2)} por item
                </p>
                <p className="text-emerald-100 text-xs sm:text-sm mt-2">
                  {bestDay.purchase_count} compras realizadas neste dia
                </p>
              </>
            ) : (
              <p className="text-emerald-100 text-sm sm:text-base">Dados insuficientes ainda</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <Store className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold">Mercado Mais Econômico</h3>
                <p className="text-blue-100 text-xs sm:text-sm">Com base no menor custo médio por item</p>
              </div>
            </div>
            {bestMarket ? (
              <>
                <p className="text-3xl sm:text-4xl font-bold mb-2 truncate">{bestMarket.name}</p>
                <p className="text-blue-100 text-sm sm:text-base">
                  Média de R$ {bestMarket.avg_item_cost.toFixed(2)} por item
                </p>
                <p className="text-blue-100 text-xs sm:text-sm mt-2">
                  Total gasto: R$ {bestMarket.total_spent.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-blue-100 text-sm sm:text-base">Dados insuficientes ainda</p>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week Chart */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              Compras por Dia da Semana
            </h3>
            {dayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day_name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "total_spent") return [`R$ ${value.toFixed(2)}`, "Total Gasto"];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="total_spent" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p className="text-sm">Nenhum dado disponível ainda</p>
              </div>
            )}
          </div>

          {/* Market Spending Pie Chart */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              Gastos por Mercado
            </h3>
            {marketData.filter(m => m.total_spent > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={marketData.filter(m => m.total_spent > 0)}
                    dataKey="total_spent"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ value }) => `R$ ${(value as number).toFixed(2)}`}
                  >
                    {marketData.filter(m => m.total_spent > 0).map((_item, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p className="text-sm">Nenhum dado disponível ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Market Details Table */}
        {marketData.filter(m => m.items_purchased > 0).length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mt-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Detalhes por Mercado
            </h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                      Mercado
                    </th>
                    <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                      Itens
                    </th>
                    <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                      Total
                    </th>
                    <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marketData
                    .filter(m => m.items_purchased > 0)
                    .map((market) => (
                      <tr key={market.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Store className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{market.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 text-sm sm:text-base">
                          {market.items_purchased}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-700 text-sm sm:text-base">
                          R$ {market.total_spent.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 text-sm sm:text-base">
                          R$ {market.avg_item_cost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
