import express, { Request, Response } from 'express';
import { AggregateResponse, Transaction } from '../types';

const router = express.Router();

const generateMockTransaction = (
    contractAddress: string,
    from?: string,
    to?: string,
    minAmount?: string,
    maxAmount?: string
): Transaction => {
    const randomAmount = Math.random() * 1000 + 10;
    const amount = randomAmount.toFixed(6);

    return {
        tx_hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        block_number: 25000000 + Math.floor(Math.random() * 10000),
        from_address: from || '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        to_address: to || '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        contract_address: contractAddress,
        amount: amount,
        amount_decimal: amount,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000)).toISOString(),
        type: Math.random() > 0.5 ? 'buy' : 'sell'
    };
};

router.post('/aggregate', (req: Request, res: Response) => {
    const { contractAddress, buyAddressGroups, sellAddressGroups, page = 1, pageSize = 20, flatList = false } = req.body;

    if (!contractAddress) {
        return res.status(400).json({ code: 400, message: 'Contract address is required' });
    }

    const currentPage = Number(page);
    const size = Number(pageSize);

    const responseData: AggregateResponse['data'] = {
        buyGroups: [],
        sellGroups: [],
        summary: {
            groupSuccessCount: 0,
            totalTransactionCount: 0
        },
        pagination: {
            page: currentPage,
            pageSize: size,
            total: 0
        }
    };

    let allTransactions: Transaction[] = [];

    // Process Buy Groups (Mock)
    if (buyAddressGroups && Array.isArray(buyAddressGroups)) {
        responseData.buyGroups = buyAddressGroups.map((group: any) => {
            // If flatList is requested (pagination mode), don't return full transactions in groups to save bandwidth
            // Just simulate counts
            const count = Math.floor(Math.random() * 300) + 200;
            responseData.summary.totalTransactionCount += count;

            // Only generate detailed mock data if we are NOT in flatList mode OR if we need to mock "All"
            // For efficient mock pagination, we just generate the SLICE later. 
            // Here we just return empty transactions array for groups if flatList is on.
            if (flatList) {
                return { transactions: [], _count: count }; // _count is internal mock helper
            }

            const transactions = Array(count).fill(null).map(() =>
                generateMockTransaction(contractAddress, group.from, group.to)
            );
            return { transactions };
        });
        responseData.summary.groupSuccessCount += buyAddressGroups.length;
    }

    // Process Sell Groups (Mock)
    if (sellAddressGroups && Array.isArray(sellAddressGroups)) {
        responseData.sellGroups = sellAddressGroups.map((group: any) => {
            const count = Math.floor(Math.random() * 300) + 200;
            responseData.summary.totalTransactionCount += count;
            if (flatList) {
                return { transactions: [], _count: count };
            }
            const transactions = Array(count).fill(null).map(() =>
                generateMockTransaction(contractAddress, group.from, group.to)
            );
            return { transactions };
        });
        responseData.summary.groupSuccessCount += sellAddressGroups.length;
    }

    // Simple Pagination Logic for Mock Data
    if (flatList) {
        // Generate ONLY the requested slice
        // We know total count from above. 
        if (responseData.pagination) {
            responseData.pagination.total = responseData.summary.totalTransactionCount;
        }

        const sliceCount = Math.min(size, responseData.summary.totalTransactionCount - (currentPage - 1) * size);
        if (sliceCount > 0) {
            responseData.transactions = Array(sliceCount).fill(null).map(() =>
                generateMockTransaction(contractAddress)
            );
        } else {
            responseData.transactions = [];
        }
    }

    console.log(`Served aggregated analysis for ${contractAddress} (Page ${currentPage})`);
    res.json({ code: 200, message: 'Success', data: responseData });
});

export default router;
