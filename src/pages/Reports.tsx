// To use export features, install:
// npm install html2canvas jspdf xlsx

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import data from '../data/db.json';

const getDateRange = (filter: string, fromDate: string, toDate: string) => {
  const now = new Date();
  let start: Date, end: Date;
  if (filter === 'custom' && fromDate && toDate) {
    start = new Date(fromDate);
    end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  switch (filter) {
    case 'weekly':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = now;
      break;
    case 'monthly':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      end = now;
      break;
    case 'yearly':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      end = now;
      break;
    default:
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      end = now;
  }
  return { start, end };
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'projects' | 'clients'>('overview');
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const { start, end } = getDateRange(timeFilter, fromDate, toDate);

  // Filtered data examples
  const filteredTransactions = data.transactions.filter((t: any) => {
    const transDate = new Date(t.date);
    return transDate >= start && transDate <= end;
  });
  const filteredProjects = data.clients.flatMap((client: any) =>
    client.projects.filter((project: any) => {
      const projDate = new Date(project.endDate);
      return projDate >= start && projDate <= end;
    }).map((project: any) => ({ ...project, client: client.name }))
  );
  const filteredClients = data.clients.filter((client: any) => {
    // Example: show all clients (or filter by created date if available)
    return true;
  });

  // Export handlers
  const handleExportPNG = async () => {
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current);
      const link = document.createElement('a');
      link.download = `${activeTab}-report.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleExportPDF = async () => {
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape' });
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${activeTab}-report.pdf`);
    }
  };

  const handleExportExcel = () => {
    let wsData: any[][] = [];
    if (activeTab === 'income') {
      wsData = [
        ['ID', 'Client', 'Project', 'Amount', 'Date', 'Type'],
        ...filteredTransactions.map((t: any) => [t.id, t.clientId, t.projectId, t.amount, t.date, t.type])
      ];
    } else if (activeTab === 'projects') {
      wsData = [
        ['ID', 'Name', 'Client', 'Status', 'End Date', 'Budget'],
        ...filteredProjects.map((p: any) => [p.id, p.name, p.client, p.status, p.endDate, p.budget])
      ];
    } else if (activeTab === 'clients') {
      wsData = [
        ['ID', 'Name', 'Email', 'Phone', 'Address'],
        ...filteredClients.map((c: any) => [c.id, c.name, c.email, c.phone, c.address])
      ];
    } else {
      wsData = [['Overview report export is not available as table']];
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${activeTab}-report.xlsx`);
  };

  const handleExportCSV = () => {
    let wsData: any[][] = [];
    if (activeTab === 'income') {
      wsData = [
        ['ID', 'Client', 'Project', 'Amount', 'Date', 'Type'],
        ...filteredTransactions.map((t: any) => [t.id, t.clientId, t.projectId, t.amount, t.date, t.type])
      ];
    } else if (activeTab === 'projects') {
      wsData = [
        ['ID', 'Name', 'Client', 'Status', 'End Date', 'Budget'],
        ...filteredProjects.map((p: any) => [p.id, p.name, p.client, p.status, p.endDate, p.budget])
      ];
    } else if (activeTab === 'clients') {
      wsData = [
        ['ID', 'Name', 'Email', 'Phone', 'Address'],
        ...filteredClients.map((c: any) => [c.id, c.name, c.email, c.phone, c.address])
      ];
    } else {
      wsData = [['Overview report export is not available as table']];
    }
    const csv = wsData.map(row => row.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}-report.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>
      <nav className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'overview' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'income' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('income')}
        >
          Income
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'projects' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'clients' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('clients')}
        >
          Clients
        </button>
      </nav>
      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="flex gap-2 items-center">
          <button onClick={() => { setTimeFilter('weekly'); setFromDate(''); setToDate(''); }} className={`px-3 py-1 rounded ${timeFilter === 'weekly' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Weekly</button>
          <button onClick={() => { setTimeFilter('monthly'); setFromDate(''); setToDate(''); }} className={`px-3 py-1 rounded ${timeFilter === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Monthly</button>
          <button onClick={() => { setTimeFilter('yearly'); setFromDate(''); setToDate(''); }} className={`px-3 py-1 rounded ${timeFilter === 'yearly' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Yearly</button>
          <span className="ml-2 text-sm text-gray-600">From</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setTimeFilter('custom'); }}
          />
          <span className="text-sm text-gray-600">To</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setTimeFilter('custom'); }}
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={handleExportPNG} className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200">Export PNG</button>
          <button onClick={handleExportPDF} className="px-3 py-1 rounded bg-red-100 hover:bg-red-200">Export PDF</button>
          <button onClick={handleExportExcel} className="px-3 py-1 rounded bg-green-100 hover:bg-green-200">Export Excel</button>
          <button onClick={handleExportCSV} className="px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200">Export CSV</button>
        </div>
      </div>
      {/* Report Content */}
      <div ref={reportRef} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Overview Report</h2>
            <p className="text-gray-600 mb-4">Summary of all key metrics and activities for the selected period.</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Total Clients: {filteredClients.length}</li>
              <li>Total Projects: {filteredProjects.length}</li>
              <li>Total Income: ${filteredTransactions.filter((t: any) => t.type === 'payment').reduce((acc: number, t: any) => acc + t.amount, 0).toLocaleString()}</li>
            </ul>
          </div>
        )}
        {activeTab === 'income' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Income Report</h2>
            <div className="mb-4 text-lg font-bold text-green-700">
              Total Income: $
              {filteredTransactions
                .filter((t: any) => t.type === 'payment')
                .reduce((acc: number, t: any) => acc + t.amount, 0)
                .toLocaleString()}
            </div>
            <table className="min-w-full mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Project</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t: any) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2">{t.id}</td>
                    <td className="px-4 py-2">{t.clientId}</td>
                    <td className="px-4 py-2">{t.projectId}</td>
                    <td className="px-4 py-2">${t.amount.toLocaleString()}</td>
                    <td className="px-4 py-2">{t.date}</td>
                    <td className="px-4 py-2">{t.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'projects' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Projects Report</h2>
            <table className="min-w-full mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">End Date</th>
                  <th className="px-4 py-2 text-left">Budget</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.id}</td>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.client}</td>
                    <td className="px-4 py-2">{p.status}</td>
                    <td className="px-4 py-2">{p.endDate}</td>
                    <td className="px-4 py-2">${p.budget.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'clients' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Clients Report</h2>
            <table className="min-w-full mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.id}</td>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">{c.email}</td>
                    <td className="px-4 py-2">{c.phone}</td>
                    <td className="px-4 py-2">{c.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 