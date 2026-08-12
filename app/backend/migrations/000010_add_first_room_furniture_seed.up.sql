INSERT INTO listings (
    id, owner_id, category_code, title, description, price_kopecks, status, is_demo, published_at, created_at, updated_at
) VALUES
    ('10000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'FURNITURE', 'Кресло для чтения', 'Удобное кресло для чтения и отдыха, устойчивое основание и мягкая обивка.', 420000, 'PUBLISHED', TRUE, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'FURNITURE', 'Стеллаж для книг', 'Высокий стеллаж для книг и небольших предметов интерьера, собран и готов к использованию.', 315000, 'PUBLISHED', TRUE, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'FURNITURE', 'Тумба для прихожей', 'Компактная тумба для прихожей с полкой и ящиком, подходит для аккуратного хранения вещей.', 189000, 'PUBLISHED', TRUE, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO listing_photos (listing_id, url, sort_order) VALUES
    ('10000000-0000-0000-0000-000000000005', 'https://images.example.test/demo/chair-1.jpg', 0),
    ('10000000-0000-0000-0000-000000000006', 'https://images.example.test/demo/bookshelf-1.jpg', 0),
    ('10000000-0000-0000-0000-000000000007', 'https://images.example.test/demo/cabinet-1.jpg', 0)
ON CONFLICT (listing_id, sort_order) DO NOTHING;
