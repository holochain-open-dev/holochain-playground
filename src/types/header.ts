export interface Header {
  entry_address: string;
  last_header_address: string | undefined;
  replaced_entry_address: string | undefined;
  agent_id: string;
  timestamp: number;
}
