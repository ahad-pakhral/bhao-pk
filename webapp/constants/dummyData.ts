// Comprehensive product data with features and reviews (matches web app structure)

export const TRENDING_PRODUCTS = [
    {
        id: '1',
        name: 'iPhone 15 Pro',
        price: 'Rs. 345,000',
        store: 'Daraz',
        rating: 4.9,
        reviewsCount: 120,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=400',
        badge: 'HOT',
        specs: '256GB • Titanium • Space Black',
        features: [
            { key: 'Display', value: '6.1" Super Retina XDR' },
            { key: 'Processor', value: 'A17 Pro chip' },
            { key: 'Camera', value: '48MP Main | Ultra Wide | Telephoto' },
            { key: 'Battery', value: 'Up to 23 hours video playback' },
        ],
        reviews: [
            { user: 'Ali Khan', rating: 5, comment: 'Best phone I\'ve ever used. The titanium finish is amazing and it\'s so light!' },
            { user: 'Sara Ahmed', rating: 4.5, comment: 'Great performance but battery life could be better. Camera is top notch though.' },
        ],
    },
    {
        id: '2',
        name: 'Samsung S24',
        price: 'Rs. 320,000',
        store: 'Telemart',
        rating: 4.8,
        reviewsCount: 95,
        image: 'https://images.unsplash.com/photo-1707248107510-09e23652697b?q=80&w=400',
        badge: 'BEST VALUE',
        specs: '256GB • 5G • Phantom Black',
        features: [
            { key: 'Display', value: '6.2" Dynamic AMOLED 2X' },
            { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
            { key: 'Camera', value: '50MP + 12MP + 10MP' },
            { key: 'Battery', value: '4000mAh with 25W charging' },
        ],
        reviews: [
            { user: 'Ahmed Hassan', rating: 5, comment: 'Amazing display and camera quality. AI features are really useful!' },
            { user: 'Fatima Malik', rating: 4.5, comment: 'Great phone overall. Battery lasts all day with moderate use.' },
        ],
    },
    {
        id: '3',
        name: 'AirPods Pro',
        price: 'Rs. 65,000',
        store: 'Daraz',
        rating: 4.7,
        reviewsCount: 200,
        image: 'https://images.unsplash.com/photo-1588423770574-91021163dfbb?q=80&w=400',
        specs: 'Active Noise Cancellation • Transparency Mode',
        features: [
            { key: 'Audio', value: 'Adaptive Audio & Active Noise Cancellation' },
            { key: 'Battery', value: 'Up to 6 hours listening time' },
            { key: 'Charging', value: 'MagSafe & Wireless charging case' },
            { key: 'Controls', value: 'Touch control & "Hey Siri"' },
        ],
        reviews: [
            { user: 'Usman Ali', rating: 5, comment: 'Sound quality is incredible. ANC works perfectly in noisy environments.' },
            { user: 'Ayesha Khan', rating: 4.5, comment: 'Very comfortable and great battery life. Worth the price!' },
        ],
    },
    {
        id: '4',
        name: 'MacBook Air',
        price: 'Rs. 285,000',
        store: 'Shophive',
        rating: 4.9,
        reviewsCount: 85,
        image: 'https://images.unsplash.com/photo-1517336714481-489a20fb3ca4?q=80&w=400',
        specs: 'M2 Chip • 8GB • 256GB',
        features: [
            { key: 'Display', value: '13.6" Liquid Retina' },
            { key: 'Processor', value: 'Apple M2 chip' },
            { key: 'Memory', value: '8GB unified memory' },
            { key: 'Battery', value: 'Up to 18 hours' },
        ],
        reviews: [
            { user: 'Hassan Raza', rating: 5, comment: 'Perfect for work and creative tasks. Silent and incredibly fast!' },
            { user: 'Zainab Shah', rating: 4.8, comment: 'Best laptop I\'ve owned. Battery life is phenomenal.' },
        ],
    },
];

export const RECENTLY_VIEWED = [
    {
        id: '5',
        name: 'iPad Pro 12.9"',
        price: 'Rs. 245,000',
        store: 'Daraz',
        rating: 4.8,
        reviewsCount: 110,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
        badge: 'NEW',
        specs: 'M2 Chip • 12.9-inch • Wi-Fi',
        features: [
            { key: 'Display', value: '12.9" Liquid Retina XDR' },
            { key: 'Processor', value: 'Apple M2 chip' },
            { key: 'Storage', value: '128GB' },
            { key: 'Camera', value: '12MP Wide + 10MP Ultra Wide' },
        ],
        reviews: [
            { user: 'Bilal Ahmed', rating: 5, comment: 'Perfect for drawing and note-taking. Display is stunning!' },
            { user: 'Hina Tariq', rating: 4.5, comment: 'Great for productivity and entertainment. Apple Pencil works flawlessly.' },
        ],
    },
    {
        id: '6',
        name: 'Sony XM5',
        price: 'Rs. 85,000',
        store: 'Telemart',
        rating: 4.6,
        reviewsCount: 75,
        image: 'https://images.unsplash.com/photo-1675662058309-8736e053d4f4?q=80&w=400',
        specs: 'Noise Cancelling • 30hr Battery',
        features: [
            { key: 'Audio', value: 'Industry-leading noise cancellation' },
            { key: 'Battery', value: 'Up to 30 hours' },
            { key: 'Charging', value: 'Quick charge: 3 min = 3 hours' },
            { key: 'Controls', value: 'Touch controls & voice assistant' },
        ],
        reviews: [
            { user: 'Kamran Malik', rating: 5, comment: 'Best headphones for travel. Noise cancellation is unmatched!' },
            { user: 'Sana Iqbal', rating: 4.5, comment: 'Comfortable for long listening sessions. Sound quality is excellent.' },
        ],
    },
];

export const ALL_PRODUCTS = [
    ...TRENDING_PRODUCTS,
    ...RECENTLY_VIEWED,
    {
        id: '7',
        name: 'iPad Mini',
        price: 'Rs. 145,000',
        store: 'Shophive',
        rating: 4.7,
        reviewsCount: 60,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
        specs: 'A15 Bionic • 8.3-inch',
        features: [
            { key: 'Display', value: '8.3" Liquid Retina' },
            { key: 'Processor', value: 'A15 Bionic chip' },
            { key: 'Storage', value: '64GB' },
            { key: 'Connectivity', value: 'Wi-Fi 6 & 5G' },
        ],
        reviews: [
            { user: 'Adnan Sheikh', rating: 5, comment: 'Perfect size for reading and browsing. Super portable!' },
            { user: 'Nida Khan', rating: 4.5, comment: 'Great for students. Fits in my bag easily and works with Apple Pencil.' },
        ],
    },
    {
        id: '8',
        name: 'Galaxy Buds',
        price: 'Rs. 35,000',
        store: 'Daraz',
        rating: 4.5,
        reviewsCount: 150,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400',
        specs: 'Active Noise Cancellation',
        features: [
            { key: 'Audio', value: 'ANC & Ambient mode' },
            { key: 'Battery', value: 'Up to 8 hours + 29 hours with case' },
            { key: 'Water Resistance', value: 'IPX7 rated' },
            { key: 'Controls', value: 'Touch controls' },
        ],
        reviews: [
            { user: 'Fahad Aziz', rating: 4.5, comment: 'Great sound for the price. Battery life is impressive!' },
            { user: 'Rabia Nasir', rating: 4, comment: 'Good buds for Android users. Fit is comfortable.' },
        ],
    },
    {
        id: '9',
        name: 'iPhone 14',
        price: 'Rs. 285,000',
        store: 'Telemart',
        rating: 4.8,
        reviewsCount: 180,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=400',
        specs: '128GB • 5G • Midnight',
        features: [
            { key: 'Display', value: '6.1" Super Retina XDR' },
            { key: 'Processor', value: 'A15 Bionic chip' },
            { key: 'Camera', value: '12MP Dual camera system' },
            { key: 'Battery', value: 'Up to 20 hours video playback' },
        ],
        reviews: [
            { user: 'Imran Butt', rating: 5, comment: 'Solid phone at a better price than the 15. Does everything I need!' },
            { user: 'Maryam Ali', rating: 4.5, comment: 'Great camera and performance. Happy with my purchase.' },
        ],
    },
];

export const SEARCH_RESULTS = ALL_PRODUCTS;
