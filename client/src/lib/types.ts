export interface Stats {
  totalClients: number;
  activeClients: number;
  totalUsers: number;
  totalBackups: number;
}

export interface StatusBadgeProps {
  status: "active" | "inactive" | "pending";
}

export interface TableAction {
  icon: string;
  label: string;
  variant: "default" | "destructive";
  onClick: () => void;
}
