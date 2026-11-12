'use client';

import { useEffect, useState } from 'react';
import { auditLogsApi, AuditLog, AuditLogSummary } from '@/lib/api/audit-logs';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [logsData, summaryData] = await Promise.all([
        auditLogsApi.getLogs({
          action: filterAction || undefined,
          resource: filterResource || undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
          limit,
          offset: (page - 1) * limit,
        }),
        auditLogsApi.getSummary(),
      ]);
      setLogs(logsData.data);
      setTotal(logsData.total);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterAction, filterResource, filterStartDate, filterEndDate]);

  const handleResetFilter = () => {
    setFilterAction('');
    setFilterResource('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchTerm('');
    setPage(1);
  };

  const getActionInfo = (action: string) => {
    const badges: Record<string, { label: string; color: string; icon: string }> = {
      CREATE: { label: 'Create', color: 'badge-success', icon: '➕' },
      UPDATE: { label: 'Update', color: 'badge-info', icon: '✏️' },
      DELETE: { label: 'Delete', color: 'badge-danger', icon: '🗑️' },
      LOGIN: { label: 'Login', color: 'badge-warning', icon: '🔑' },
      LOGOUT: { label: 'Logout', color: 'badge-gray', icon: '🚪' },
      PUBLISH: { label: 'Publish', color: 'badge-info', icon: '📢' },
      READ: { label: 'Read', color: 'badge-gray', icon: '👁️' },
    };
    return badges[action] || { label: action, color: 'badge-gray', icon: '📋' };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);

  const filteredLogs = logs.filter(
    (log) =>
      (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading && logs.length === 0 && !summary) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton"></div>
        <div className="h-96 skeleton"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">📋</span>
            Audit Log
          </h1>
          <p className="text-gray-500 mt-1">
            Riwayat aktivitas pengguna sistem ({total} aktivitas)
          </p>
        </div>
        <button onClick={fetchData} className="btn-primary">
          🔄 Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-2 animate-slide-in">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Total Aktivitas</p>
                <p className="text-4xl font-bold mt-2">{summary.total}</p>
              </div>
              <div className="text-4xl opacity-80">📋</div>
            </div>
          </div>
          <div className="card-gradient bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Hari Ini</p>
                <p className="text-4xl font-bold mt-2">{summary.todayCount}</p>
              </div>
              <div className="text-4xl opacity-80">📅</div>
            </div>
          </div>
          <div className="card-gradient bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Aksi Terbanyak</p>
                <p className="text-2xl font-bold mt-2">
                  {summary.byAction[0]?.action || '-'}
                </p>
                <p className="text-sm opacity-90">
                  {summary.byAction[0]?.count || 0} aktivitas
                </p>
              </div>
              <div className="text-4xl opacity-80">🔥</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
              📊 Aktivitas per Aksi
            </h3>
            <div className="space-y-3">
              {summary.byAction.slice(0, 5).map((item) => {
                const info = getActionInfo(item.action);
                const percent = summary.total > 0 ? (item.count / summary.total) * 100 : 0;
                return (
                  <div key={item.action}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className={`${info.color} text-xs`}>
                        {info.icon} {info.label}
                      </span>
                      <span className="font-semibold text-gray-700">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {summary.byAction.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  Belum ada data
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
              📊 Aktivitas per Resource
            </h3>
            <div className="space-y-3">
              {summary.byResource.slice(0, 5).map((item) => {
                const percent = summary.total > 0 ? (item.count / summary.total) * 100 : 0;
                return (
                  <div key={item.resource}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 capitalize">
                        📁 {item.resource}
                      </span>
                      <span className="font-semibold text-gray-700">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {summary.byResource.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  Belum ada data
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔍</span>
          <h3 className="font-semibold text-gray-700">Filter Aktivitas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Aksi</label>
            <select
              className="input"
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              <option value="CREATE">➕ Create</option>
              <option value="UPDATE">✏️ Update</option>
              <option value="DELETE">🗑️ Delete</option>
              <option value="LOGIN">🔑 Login</option>
              <option value="LOGOUT">🚪 Logout</option>
              <option value="PUBLISH">📢 Publish</option>
            </select>
          </div>
          <div>
            <label className="label">Resource</label>
            <select
              className="input"
              value={filterResource}
              onChange={(e) => {
                setFilterResource(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              <option value="auth">🔑 Auth</option>
              <option value="users">👥 Users</option>
              <option value="regions">📍 Regions</option>
              <option value="villages">🏘️ Villages</option>
              <option value="news">📰 News</option>
              <option value="announcements">📢 Announcements</option>
              <option value="agendas">📅 Agendas</option>
              <option value="documents">📄 Documents</option>
            </select>
          </div>
          <div>
            <label className="label">Dari Tanggal</label>
            <input
              type="date"
              className="input"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="label">Sampai Tanggal</label>
            <input
              type="date"
              className="input"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleResetFilter}
              className="btn-secondary w-full"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            className="input pl-12"
            placeholder="Cari berdasarkan nama, email, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="card">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>User</th>
                    <th>Aksi</th>
                    <th>Resource</th>
                    <th>Deskripsi</th>
                    <th className="text-right">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    return (
                      <tr key={log.id}>
                        <td>
                          <span className="text-sm text-gray-600">
                            {formatDate(log.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                              {(log.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {log.userName || 'System'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {log.userEmail || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={actionInfo.color}>
                            {actionInfo.icon} {actionInfo.label}
                          </span>
                        </td>
                        <td>
                          <span className="badge-gray capitalize">
                            📁 {log.resource}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600 line-clamp-1">
                            {log.description || '-'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                              title="Lihat Detail"
                            >
                              👁️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-5xl">📋</span>
                          <p className="text-gray-500 font-medium">
                            {searchTerm || filterAction || filterResource
                              ? 'Tidak ada log yang cocok'
                              : 'Belum ada aktivitas'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Menampilkan{' '}
                  <span className="font-semibold">
                    {((page - 1) * limit) + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-semibold">
                    {Math.min(page * limit, total)}
                  </span>{' '}
                  dari <span className="font-semibold">{total}</span> aktivitas
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary btn-sm disabled:opacity-50"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-sm">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="btn-secondary btn-sm disabled:opacity-50"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Detail */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg">
                  📋
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Detail Audit Log</h3>
                  <p className="text-sm text-gray-500">Informasi lengkap aktivitas</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Waktu</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(selectedLog.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Aksi</p>
                  <span className={getActionInfo(selectedLog.action).color}>
                    {getActionInfo(selectedLog.action).icon}{' '}
                    {getActionInfo(selectedLog.action).label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Resource</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">
                    {selectedLog.resource}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-700 font-medium mb-1">User</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedLog.userName || '-'}
                  </p>
                  <p className="text-xs text-gray-600">{selectedLog.userEmail || '-'}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-xs text-purple-700 font-medium mb-1">IP Address</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedLog.ipAddress || '-'}
                  </p>
                </div>
              </div>

              {selectedLog.description && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">Deskripsi</p>
                  <p className="text-sm text-gray-800">{selectedLog.description}</p>
                </div>
              )}

              {selectedLog.resourceId && (
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-xs text-yellow-700 font-medium mb-1">Resource ID</p>
                  <p className="text-xs text-gray-700 break-all font-mono">
                    {selectedLog.resourceId}
                  </p>
                </div>
              )}

              {selectedLog.oldValues && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    📝 Data Lama
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    ✨ Data Baru
                  </p>
                  <pre className="bg-gray-900 text-cyan-400 p-4 rounded-xl text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}