import React, { useEffect, useState } from 'react';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import { apiService } from '../services/apiService';
import type { Client, ClientInput, Project, SocialContacts } from '../types/client';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  socialContacts: SocialContacts | null;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const renderSocialContacts = (client: Client) => {
    console.log('Rendering social contacts for client:', {
      id: client.id,
      company_name: client.company_name,
      social_contacts: client.social_contacts,
      social_contacts_type: typeof client.social_contacts
    });

    if (!client.social_contacts) {
      return <span className="text-gray-400">-</span>;
    }

    const { whatsapp, linkedin } = client.social_contacts;

    if (!whatsapp && !linkedin) {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <div className="flex items-center space-x-3">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-600 transition-colors"
            title={`WhatsApp: ${whatsapp}`}
          >
            <FaWhatsapp className="w-5 h-5" />
          </a>
        )}
        {linkedin && (
          <a
            href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 transition-colors"
            title={`LinkedIn: ${linkedin}`}
          >
            <FaLinkedin className="w-5 h-5" />
          </a>
        )}
      </div>
    );
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getClients();
      console.log('Raw client data:', JSON.stringify(data, null, 2));
      
      // Validate and transform client data
      const validClients: Client[] = data
        .filter(client => {
          const isValid = client && typeof client.id === 'number' && typeof client.company_name === 'string';
          if (!isValid) {
            console.warn('Invalid client data:', client);
          }
          return isValid;
        })
        .map(client => {
          const status = client.status === 'inactive' ? 'inactive' : 'active';
          const projects = (client.projects || []).map(project => {
            const projectStatus = 
              typeof project.status === 'string' && ['completed', 'in_progress', 'inactive', 'active'].includes(project.status)
                ? project.status as 'completed' | 'in_progress' | 'inactive' | 'active'
                : 'active';
            return {
              id: project.id,
              name: project.title || '',
              description: project.description || '',
              client_id: project.client_id,
              client_name: project.client_name || '',
              status: projectStatus,
              created_at: project.created_at,
              updated_at: project.updated_at
            };
          }) as Project[];
          
          // Parse social contacts if it's a string
          let socialContacts = null;
          if (client.social_contacts) {
            try {
              socialContacts = typeof client.social_contacts === 'string' 
                ? JSON.parse(client.social_contacts) 
                : client.social_contacts;
            } catch (e) {
              console.warn(`Failed to parse social_contacts for client ${client.id}:`, e);
            }
          }
          
          return {
            ...client,
            country: client.country || null,
            address: client.address || '',
            social_contacts: socialContacts,
            projects,
            status
          } as Client;
        });

      console.log('Processed client data:', JSON.stringify(validClients, null, 2));
      setClients(validClients);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEditClient = (client: Client) => {
    console.log('Editing client:', client);
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!clientId || window.confirm('Are you sure you want to delete this client?')) {
      try {
        await apiService.deleteClient(clientId);
        await fetchClients(); // Refresh the list after deletion
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Failed to delete client. Please try again.');
      }
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
          onClick={() => {
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No clients found. Click "Add New Client" to create one.
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                if (!client || !client.id) {
                  console.warn('Invalid client data in map:', client);
                  return null;
                }
                
                const rowKey = `client-${client.id}-${client.email}`;
                console.log('Rendering client:', {
                  id: client.id,
                  company_name: client.company_name,
                  country: client.country,
                  social_contacts: client.social_contacts,
                  rowKey
                });

                return (
                  <tr key={rowKey} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.company_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.country || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.projects?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderSocialContacts(client)}
                    </td>
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
                );
              })
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
            id: selectedClient.id,
            name: selectedClient.company_name,
            email: selectedClient.email,
            phone: selectedClient.phone,
            address: selectedClient.address || '',
            country: selectedClient.country || '',
            socialContacts: selectedClient.social_contacts
          } : undefined}
          onSubmit={async (formData) => {
            try {
              console.log('Form data received:', formData);
              const country = formData.country.trim();
              
              const clientData: ClientInput = {
                company_name: formData.name.trim(),
                contact_person: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                country: country || null,
                social_contacts: formData.socialContacts || undefined,
                status: 'active' as const
              };

              console.log('Client data to send:', clientData);

              if (selectedClient) {
                console.log('Updating client:', selectedClient.id);
                try {
                  const response = await apiService.updateClient(selectedClient.id, clientData);
                  console.log('Updated client response:', response);
                  
                  if (!response || !response.id) {
                    throw new Error('Invalid response from server: Missing client data');
                  }

                  // Refresh the client list after successful update
                  await fetchClients();
                } catch (updateError) {
                  console.error('Error updating client:', updateError);
                  const errorMessage = updateError instanceof Error ? updateError.message : 'Failed to update client';
                  alert(`Failed to update client: ${errorMessage}`);
                  return;
                }
              } else {
                console.log('Creating new client');
                try {
                  const response = await apiService.createClient(clientData);
                  console.log('Created client response:', response);
                  
                  if (!response || !response.id) {
                    throw new Error('Invalid response from server: Missing client data');
                  }

                  // Refresh the client list after successful creation
                  await fetchClients();
                } catch (createError) {
                  console.error('Error creating client:', createError);
                  const errorMessage = createError instanceof Error ? createError.message : 'Failed to create client';
                  alert(`Failed to create client: ${errorMessage}`);
                  return;
                }
              }

              setIsModalOpen(false);
            } catch (err) {
              console.error('Error in form submission:', err);
              const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
              alert(`Failed to save client: ${errorMessage}`);
            }
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Clients; 