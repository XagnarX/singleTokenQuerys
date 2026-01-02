export interface AddressTag {
    address: string;
    tag: string;
    description: string;
}

export interface Transaction {
    tx_hash: string;
    block_number: number;
    from_address: string;
    to_address: string;
    contract_address: string;
    amount: string;
    amount_decimal?: string;
    timestamp: string;
    type?: 'buy' | 'sell';
    from_address_tag?: string;
    to_address_tag?: string;
}

export interface AggregateResponse {
    code: number;
    message: string;
    data: {
        buyGroups?: { transactions: Transaction[], error?: string, status?: string }[];
        sellGroups?: { transactions: Transaction[], error?: string, status?: string }[];
        summary: {
            groupSuccessCount: number;
            totalTransactionCount: number;
        };
        transactions?: Transaction[];
        pagination?: {
            page: number;
            pageSize: number;
            total: number;
        };
    }
}
