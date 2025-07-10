import data from '../data/db.json';

export type ProjectStatus = 'not_started' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TransactionType = 'invoice' | 'payment';
export type TaskType = 'development' | 'design' | 'fixing' | 'feedback' | 'round-r1' | 'round-r2' | 'round-r3';
export type TaskStatus = 'not_started' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description?: string;
  project_id: number;
  project_title?: string;
  client_id: number;
  client_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
  due_date: string;
  budget?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string | null;
  country: string | null;
  social_contacts?: {
    whatsapp?: string;
    linkedin?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  projects: Project[];
}

export interface Project {
  id: number;
  title: string;
  description: string;
  client_id: number;
  status: ProjectStatus;
  priority: TaskPriority;
  start_date: string | null;
  end_date: string | null;
  due_date: string;
  budget: number;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  tasks?: Task[];
  task_count?: number;
  project_live_url?: string;
  project_files?: string;
  admin_login_url?: string;
  username_email?: string;
  password?: string;
  hosting_login_url?: string;
  hosting_username_email?: string;
  hosting_password?: string;
  // Budget calculation fields
  static_budget?: number;
  total_payments?: number;
  total_expenses?: number;
}

interface Transaction {
  id: number;
  client_id: number;
  project_id: number;
  amount: number;
  date: string;
  type: TransactionType;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Database {
  clients: Client[];
  transactions: Transaction[];
}

class DataService {
  private static instance: DataService;
  private data: Database;

  private constructor() {
    this.data = data as unknown as Database;
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Client operations
  public getClients(): Client[] {
    return this.data.clients;
  }

  public getClient(id: number): Client | undefined {
    return this.data.clients.find(client => client.id === id);
  }

  public addClient(client: Omit<Client, 'id' | 'projects'>): Client {
    const newClient: Client = {
      ...client,
      id: Date.now(),
      projects: []
    };
    this.data.clients.push(newClient);
    this.saveData();
    return newClient;
  }

  public updateClient(id: number, clientData: Partial<Client>): Client | undefined {
    const index = this.data.clients.findIndex(client => client.id === id);
    if (index === -1) return undefined;

    this.data.clients[index] = {
      ...this.data.clients[index],
      ...clientData
    };
    this.saveData();
    return this.data.clients[index];
  }

  public deleteClient(id: number): boolean {
    const initialLength = this.data.clients.length;
    this.data.clients = this.data.clients.filter(client => client.id !== id);
    this.saveData();
    return this.data.clients.length !== initialLength;
  }

  // Project operations
  public getProjects(): Project[] {
    return this.data.clients.flatMap(client => client.projects);
  }

  public getProject(id: number): Project | undefined {
    return this.getProjects().find(project => project.id === id);
  }

  public addProject(clientId: number, project: Omit<Project, 'id'>): Project | undefined {
    const client = this.getClient(clientId);
    if (!client) return undefined;

    const newProject: Project = {
      ...project,
      id: Date.now()
    };
    client.projects.push(newProject);
    this.saveData();
    return newProject;
  }

  public updateProject(id: number, projectData: Partial<Project>): Project | undefined {
    for (const client of this.data.clients) {
      const projectIndex = client.projects.findIndex(project => project.id === id);
      if (projectIndex !== -1) {
        client.projects[projectIndex] = {
          ...client.projects[projectIndex],
          ...projectData
        };
        this.saveData();
        return client.projects[projectIndex];
      }
    }
    return undefined;
  }

  public deleteProject(id: number): boolean {
    let deleted = false;
    for (const client of this.data.clients) {
      const initialLength = client.projects.length;
      client.projects = client.projects.filter(project => project.id !== id);
      if (client.projects.length !== initialLength) {
        deleted = true;
      }
    }
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  // Transaction operations
  public getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  public getTransaction(id: number): Transaction | undefined {
    return this.data.transactions.find(transaction => transaction.id === id);
  }

  public addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now()
    };
    this.data.transactions.push(newTransaction);
    this.saveData();
    return newTransaction;
  }

  public updateTransaction(id: number, transactionData: Partial<Transaction>): Transaction | undefined {
    const index = this.data.transactions.findIndex(transaction => transaction.id === id);
    if (index === -1) return undefined;

    this.data.transactions[index] = {
      ...this.data.transactions[index],
      ...transactionData
    };
    this.saveData();
    return this.data.transactions[index];
  }

  public deleteTransaction(id: number): boolean {
    const initialLength = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(transaction => transaction.id !== id);
    this.saveData();
    return this.data.transactions.length !== initialLength;
  }

  private saveData(): void {
    console.log('Data updated:', this.data);
  }
}

export const dataService = DataService.getInstance();

// Transform the data to match our interfaces
const transformData = (rawData: any) => {
  return rawData.clients.map((client: any) => ({
    ...client,
    projects: client.projects.map((project: any) => ({
      ...project,
      status: project.status as ProjectStatus,
      tasks: project.tasks || [],
      url: project.url || '',
      username: project.username || '',
      password: project.password || '',
      client_id: client.id,
      client_name: client.name
    }))
  }));
};

export const transformedData = transformData(data); 