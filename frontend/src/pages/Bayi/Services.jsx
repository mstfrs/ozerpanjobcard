import React, { useEffect, useState } from 'react'
import { getIssuesByLoggedCustomer } from '../../services/DelaerServices'

const Services = () => {
  const [issuesData, setIssuesData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const loadIssues = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getIssuesByLoggedCustomer({ status: statusFilter || null, page, pageSize: 20 })
      setIssuesData(data)
    } catch (e) {
      setError('Kayıtlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIssues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <select
          className="border rounded p-2"
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
        >
          <option value="">Tümü</option>
          <option value="Open">Açık</option>
          <option value="Replied">Cevaplandı</option>
          <option value="On Hold">Beklemede</option>
          <option value="Resolved">Çözüldü</option>
          <option value="Closed">Kapandı</option>
        </select>
        {loading && <span>Yükleniyor...</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>

      {issuesData && (
        <div className="space-y-2">
          <div className="text-sm text-gray-700 mb-2">
            Bayi: <b>{issuesData.customer}</b> — Toplam: <b>{issuesData.total}</b>
          </div>
          {issuesData.issues && issuesData.issues.length > 0 ? (
            <ul className="space-y-2">
              {issuesData.issues.map((issue) => (
                <li key={issue.name} className="border rounded p-3 bg-white">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">{issue.subject || issue.name}
                    {issue.custom_end_customer && (
                    <div className="text-sm text-gray-700 mt-1">
                      {issue.custom_end_customer}
                    </div>
                  )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-200">{issue.status}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(issue.creation).toLocaleString('tr-TR')}
                  </div>
                  {issue.installation_date && (
                    <div className="text-xs text-green-700 mt-1">
                      Montaj Tarihi: {new Date(issue.installation_date).toLocaleDateString('tr-TR')}
                    </div>
                  )}
                  
                  {issue.description && (
                    <div className="text-sm text-gray-800 mt-2 line-clamp-2">
                      {issue.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-2">
                    {issue.serial_no && <span>Seri: {issue.serial_no}</span>}
                    {issue.sales_order && <span>Sipariş: {issue.sales_order}</span>}
                    {issue.item_code && <span>Ürün: {issue.item_code}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-600">Kayıt bulunamadı</div>
          )}

          {issuesData.pagination && (
            <div className="flex items-center gap-2 mt-4">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!issuesData.pagination.has_prev}
              >
                Önceki
              </button>
              <span className="text-sm">
                {issuesData.pagination.current_page} / {issuesData.pagination.total_pages}
                {' '}
                <span className="text-gray-500">({issuesData.pagination.showing})</span>
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
                disabled={!issuesData.pagination.has_next}
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Services