import data from '../data/db.json';

export type ProjectStatus = 'not-started' | 'in-progress' | 'completed';
export type TransactionType = 'invoice' | 'payment';
export type TaskType = 'development' | 'design' | 'fixing' | 'feedback' | 'round-r1' | 'round-r2' | 'round-r3';

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: 'not-started' | 'in-progress' | 'completed';
  description: string;
  dueDate: string;
  assignedTo?: string;
  projectId: string;
  clientId: string;
  budget: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  description: string;
  url: string;
  username: string;
  password: string;
  clientId: string;
  clientName: string;
  tasks: Task[];
  files?: { name: string; url: string }[];
}

interface Transaction {
  id: string;
  clientId: string;
  projectId: string;
  amount: number;
  date: string;
  type: TransactionType;
  description: string;
}

interface Database {
  clients: Client[];
  transactions: Transaction[];
}

class DataService {
  private static instance: DataService;
  private data: Database;

  private constructor() {
    // Type assertion to ensure the imported data matches our Database interface
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

  public getClient(id: string): Client | undefined {
    return this.data.clients.find(client => client.id === id);
  }

  public addClient(client: Omit<Client, 'id' | 'projects'>): Client {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      projects: []
    };
    this.data.clients.push(newClient);
    this.saveData();
    return newClient;
  }

  public updateClient(id: string, clientData: Partial<Client>): Client | undefined {
    const index = this.data.clients.findIndex(client => client.id === id);
    if (index === -1) return undefined;

    this.data.clients[index] = {
      ...this.data.clients[index],
      ...clientData
    };
    this.saveData();
    return this.data.clients[index];
  }

  public deleteClient(id: string): boolean {
    const initialLength = this.data.clients.length;
    this.data.clients = this.data.clients.filter(client => client.id !== id);
    this.saveData();
    return this.data.clients.length !== initialLength;
  }

  // Project operations
  public getProjects(): Project[] {
    return this.data.clients.flatMap(client => client.projects);
  }

  public getProject(id: string): Project | undefined {
    return this.getProjects().find(project => project.id === id);
  }

  public addProject(clientId: string, project: Omit<Project, 'id'>): Project | undefined {
    const client = this.getClient(clientId);
    if (!client) return undefined;

    const newProject: Project = {
      ...project,
      id: `p${Date.now()}`
    };
    client.projects.push(newProject);
    this.saveData();
    return newProject;
  }

  public updateProject(id: string, projectData: Partial<Project>): Project | undefined {
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

  public deleteProject(id: string): boolean {
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

  public getTransaction(id: string): Transaction | undefined {
    return this.data.transactions.find(transaction => transaction.id === id);
  }

  public addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `t${Date.now()}`
    };
    this.data.transactions.push(newTransaction);
    this.saveData();
    return newTransaction;
  }

  public updateTransaction(id: string, transactionData: Partial<Transaction>): Transaction | undefined {
    const index = this.data.transactions.findIndex(transaction => transaction.id === id);
    if (index === -1) return undefined;

    this.data.transactions[index] = {
      ...this.data.transactions[index],
      ...transactionData
    };
    this.saveData();
    return this.data.transactions[index];
  }

  public deleteTransaction(id: string): boolean {
    const initialLength = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(transaction => transaction.id !== id);
    this.saveData();
    return this.data.transactions.length !== initialLength;
  }

  private saveData(): void {
    // In a real application, you would write to a file here
    // For now, we'll just keep it in memory
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
      clientId: client.id,
      clientName: client.name
    }))
  }));
};

export const transformedData = transformData(data); 