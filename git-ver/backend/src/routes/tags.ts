import express, { Request, Response } from 'express';
import { AddressTag } from '../types';

const router = express.Router();

// In-memory storage for tags
let tags: AddressTag[] = [];

// GET /api/address-tags
// Query params: address (optional)
router.get('/', (req: Request, res: Response) => {
    const { address } = req.query;
    if (address) {
        const filteredTags = tags.filter(t => t.address.toLowerCase() === (address as string).toLowerCase());
        return res.json({ code: 200, message: 'Success', data: { tags: filteredTags } });
    }
    return res.json({ code: 200, message: 'Success', data: { tags } });
});

// GET /api/address-tags/unique
router.get('/unique', (req: Request, res: Response) => {
    const uniqueTags = Array.from(new Set(tags.map(t => t.tag)));
    res.json({ code: 200, message: 'Success', data: { tags: uniqueTags } });
});

// POST /api/address-tags
router.post('/', (req: Request, res: Response) => {
    const { address, tag, description } = req.body;
    if (!address || !tag) {
        return res.status(400).json({ code: 400, message: 'Address and tag are required' });
    }

    // Check for duplicates (same address same tag)
    const exists = tags.some(t => t.address.toLowerCase() === address.toLowerCase() && t.tag === tag);
    if (exists) {
        return res.status(400).json({ code: 400, message: 'Tag already exists for this address' });
    }

    tags.push({ address, tag, description: description || '' });
    console.log(`Tag added: ${tag} for ${address}`);
    res.json({ code: 200, message: 'Tag added successfully' });
});

// PUT /api/address-tags
router.put('/', (req: Request, res: Response) => {
    const { address, tag, description } = req.body;
    if (!address || !tag) {
        return res.status(400).json({ code: 400, message: 'Address and tag are required' });
    }

    const index = tags.findIndex(t => t.address.toLowerCase() === address.toLowerCase() && t.tag === tag);
    if (index === -1) {
        return res.status(404).json({ code: 404, message: 'Tag not found' });
    }

    tags[index].description = description || '';
    res.json({ code: 200, message: 'Tag updated successfully' });
});

// DELETE /api/address-tags
router.delete('/', (req: Request, res: Response) => {
    const { address, tag } = req.body;
    if (!address || !tag) {
        return res.status(400).json({ code: 400, message: 'Address and tag are required' });
    }

    const initialLength = tags.length;
    tags = tags.filter(t => !(t.address.toLowerCase() === address.toLowerCase() && t.tag === tag));

    if (tags.length === initialLength) {
        return res.status(404).json({ code: 404, message: 'Tag not found' });
    }

    res.json({ code: 200, message: 'Tag deleted successfully' });
});

export default router;
