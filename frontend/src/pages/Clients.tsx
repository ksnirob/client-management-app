import React, { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import { apiService } from '../services/apiService';
import type { Client } from '../services/dataService';

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getClients();
        console.log('Fetched clients:', data);
        setClients(data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(err instanceof Error ? err.message : 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: number) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await apiService.deleteClient(clientId);
        setClients(prev => prev.filter(client => client.id !== clientId));
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  const handleSubmit = async (formData: Omit<Client, 'id' | 'projects'>) => {
    try {
      if (selectedClient) {
        // Update existing client
        const updated = await apiService.updateClient(selectedClient.id, formData);
        setClients(prev => prev.map(client =>
          client.id === selectedClient.id ? updated : client
        ));
      } else {
        // Add new client
        const newClient = await apiService.createClient(formData);
        setClients(prev => [...prev, newClient]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving client:', err);
      alert('Failed to save client. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
        <button
          onClick={handleAddClient}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Add New Client
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No clients found. Click "Add New Client" to create one.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.projects?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClient ? 'Edit Client' : 'Add New Client'}
      >
        <ClientForm
          initialData={selectedClient ? {
            id: selectedClient.id.toString(),
            name: selectedClient.company_name,
            email: selectedClient.email,
            phone: selectedClient.phone,
            address: selectedClient.address || ''
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Clients; 