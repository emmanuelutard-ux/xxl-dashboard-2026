import { RealEstateProgram } from "../types";

export const MOCK_PROGRAMS: RealEstateProgram[] = [
    {
        id: 'p1',
        name: 'Résidence Les Cèdres',
        location: 'Bordeaux',
        promoter_name: 'Promoteur A',
        status: 'marketing',
        stats: {
            total_budget: 15000,
            spent_budget: 8450,
            leads: 145,
            appointments: 12,
            cpl: 58,
            sales: 2,
        },
        history: [
            { month: 'Jan', leads: 30, appointments: 2 },
            { month: 'Fév', leads: 45, appointments: 4 },
            { month: 'Mars', leads: 70, appointments: 6 },
        ],
        campaigns: [
            {
                id: 'c1',
                name: 'Search Bordeaux',
                platform: 'google',
                status: 'active',
                spent: 4000,
                clicks: 850,
                impressions: 12000,
            },
            {
                id: 'c2',
                name: 'Retargeting FB',
                platform: 'meta',
                status: 'active',
                spent: 4450,
                clicks: 1200,
                impressions: 45000,
            },
        ],
    },
    {
        id: 'p2',
        name: 'Tour Horizon',
        location: 'La Défense',
        promoter_name: 'Promoteur B',
        status: 'construction',
        stats: {
            total_budget: 50000,
            spent_budget: 12000,
            leads: 45,
            appointments: 5,
            cpl: 266, // 12000 / 45 approx
            sales: 0,
        },
        history: [
            { month: 'Jan', leads: 15, appointments: 1 },
            { month: 'Fév', leads: 15, appointments: 2 },
            { month: 'Mars', leads: 15, appointments: 2 },
        ],
        campaigns: [
            {
                id: 'c3',
                name: 'LinkedIn B2B',
                platform: 'linkedin',
                status: 'active',
                spent: 8000,
                clicks: 150,
                impressions: 5000,
            },
            {
                id: 'c4',
                name: 'Google Brand',
                platform: 'google',
                status: 'paused',
                spent: 4000,
                clicks: 300,
                impressions: 8000,
            },
        ],
    },
];
