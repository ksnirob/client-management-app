import React, { useEffect, useState } from 'react';
import { FaWhatsapp, FaLinkedin, FaPlus, FaUsers, FaEdit, FaTrash, FaGlobe, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSpinner, FaExclamationTriangle, FaUserTie } from 'react-icons/fa';
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
      return <span className="text-gray-400 text-sm">No social links</span>;
    }

    const { whatsapp, linkedin } = client.social_contacts;

    if (!whatsapp && !linkedin) {
      return <span className="text-gray-400 text-sm">No social links</span>;
    }

    return (
      <div className="flex items-center space-x-3">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            title={`WhatsApp: ${whatsapp}`}
          >
            <FaWhatsapp className="w-4 h-4" />
          </a>
        )}
        {linkedin && (
          <a
            href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            title={`LinkedIn: ${linkedin}`}
          >
            <FaLinkedin className="w-4 h-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600 mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading Clients</div>
          <div className="text-sm text-gray-500">Fetching your client data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-6" />
            <div className="text-xl font-semibold text-gray-800 mb-4">Unable to load clients</div>
            <div className="text-gray-600 mb-6">{error}</div>
            <button
              onClick={fetchClients}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 bg-clip-text text-transparent">
                Clients
              </h1>
              <p className="text-lg text-gray-600">Manage your client relationships and contacts</p>
            </div>
            <button
              onClick={() => {
                setSelectedClient(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FaPlus className="w-4 h-4" />
              Add New Client
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <FaUsers className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">{clients.length}</p>
                    <p className="text-sm text-gray-500">Total Clients</p>
                  </div>
                </div>
                <p className="text-gray-600">Active business relationships</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <FaGlobe className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">
                      {new Set(clients.map(c => c.country).filter(Boolean)).size}
                    </p>
                    <p className="text-sm text-gray-500">Countries</p>
                  </div>
                </div>
                <p className="text-gray-600">Global reach</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <FaUserTie className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">
                      {clients.reduce((total, client) => total + (client.projects?.length || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-500">Total Projects</p>
                  </div>
                </div>
                <p className="text-gray-600">Combined work</p>
              </div>
            </div>
          </div>

          {/* Clients Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <FaUsers className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Client Directory</h2>
              </div>
            </div>
            
            {clients.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FaUsers className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No clients yet</h3>
                <p className="text-gray-500 mb-6">Start building your client base by adding your first client</p>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setIsModalOpen(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Add Your First Client
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaUserTie className="w-4 h-4" />
                          Company
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="w-4 h-4" />
                          Contact
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4" />
                          Location
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Projects</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Social</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {clients.map((client) => {
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
                        <tr key={rowKey} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200">
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 mr-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-semibold text-lg">
                                    {client.company_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{client.company_name}</div>
                                {/* <div className="text-sm text-gray-500">{client.email}</div> */}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-900">
                                <FaEnvelope className="w-3 h-3 text-gray-400 mr-2" />
                                {client.email}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <FaPhone className="w-3 h-3 text-gray-400 mr-2" />
                                {client.phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900">
                              {client.country ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <FaGlobe className="w-3 h-3 mr-1" />
                                  {client.country}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">Not specified</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {client.projects?.length || 0}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {renderSocialContacts(client)}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditClient(client)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                title="Edit client"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                title="Delete client"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClient ? 'Edit Client' : 'Add New Client'}
        size="md"
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