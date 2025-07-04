export interface SocialContacts {
  whatsapp?: string;
  linkedin?: string;
}

export interface ClientInput {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  country: string | null;
  social_contacts?: SocialContacts;
  status: 'active' | 'inactive';
}

export interface Client {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  country: string | null;
  social_contacts: SocialContacts | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  projects: Project[];
}

export interface Project {
  id: number;
  name: string;
  description: string;
  client_id: number;
  client_name: string;
  status: 'active' | 'inactive' | 'completed' | 'in_progress';
  created_at: string;
  updated_at: string;
  budget?: number;
  // Budget calculation fields
  static_budget?: number;
  total_payments?: number;
  total_expenses?: number;
} 