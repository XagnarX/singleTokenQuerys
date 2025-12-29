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
    const { contractAddress, buyAddressGroups, sellAddressGroups } = req.body;

    if (!contractAddress) {
        return res.status(400).json({ code: 400, message: 'Contract address is required' });
    }

    const responseData: AggregateResponse['data'] = {
        buyGroups: [],
        sellGroups: [],
        summary: {
            groupSuccessCount: 0,
            totalTransactionCount: 0
        }
    };

    // Process Buy Groups
    if (buyAddressGroups && Array.isArray(buyAddressGroups)) {
        responseData.buyGroups = buyAddressGroups.map((group: any) => {
            const count = Math.floor(Math.random() * 300) + 200; // 200-500 transactions per group
            const transactions = Array(count).fill(null).map(() =>
                generateMockTransaction(contractAddress, group.from, group.to)
            );
            responseData.summary.totalTransactionCount += count;
            return { transactions };
        });
        responseData.summary.groupSuccessCount += buyAddressGroups.length;
    }

    // Process Sell Groups
    if (sellAddressGroups && Array.isArray(sellAddressGroups)) {
        responseData.sellGroups = sellAddressGroups.map((group: any) => {
            const count = Math.floor(Math.random() * 300) + 200; // 200-500 transactions per group
            const transactions = Array(count).fill(null).map(() =>
                generateMockTransaction(contractAddress, group.from, group.to)
            );
            responseData.summary.totalTransactionCount += count;
            return { transactions };
        });
        responseData.summary.groupSuccessCount += sellAddressGroups.length;
    }

    // If no specific groups, generate some random data
    if ((!responseData.buyGroups || responseData.buyGroups.length === 0) &&
        (!responseData.sellGroups || responseData.sellGroups.length === 0)) {
        // Generate some generic "All" view data if needed, but the frontend usually sends groups.
        // For this mock, if nothing requested, return empty or a default set.
    }

    console.log(`Served aggregated analysis for ${contractAddress}`);
    res.json({ code: 200, message: 'Success', data: responseData });
});

export default router;
