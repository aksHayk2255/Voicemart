import json
from sqlalchemy.orm import Session
from backend.app.models.user import User
from backend.app.models.category import Category
from backend.app.models.product import Product
from backend.app.services.auth import hash_password

CATEGORIES_DATA = [
    {
        "name": "Smartphones",
        "slug": "smartphones",
        "description": "Latest flagship and budget smartphones with AI capabilities, high-res cameras, and fast processors.",
        "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Laptops",
        "slug": "laptops",
        "description": "High-performance laptops for students, developers, creators, and business professionals.",
        "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Headphones",
        "slug": "headphones",
        "description": "Wireless noise-cancelling headphones, studio monitors, and true wireless earbuds.",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Smartwatches",
        "slug": "smartwatches",
        "description": "Smart fitness trackers, AMOLED health monitors, and luxury connected wristwear.",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Accessories",
        "slug": "accessories",
        "description": "Fast chargers, ergonomic keyboards, mechanical mice, phone cases, and high-speed hubs.",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80"
    },
    {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Smart home devices, 4K monitors, wireless soundbars, and digital cameras.",
        "image_url": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80"
    }
]

PRODUCTS_DATA = [
    # --- SMARTPHONES ---
    {
        "name": "Apple iPhone 15 Pro",
        "brand": "Apple",
        "category_slug": "smartphones",
        "price": 124999.0,
        "original_price": 134900.0,
        "description": "Titanium design with A17 Pro chip, 48MP main camera, Action button, USB-C, and all-day battery life.",
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
        "rating": 4.8,
        "rating_count": 340,
        "stock": 25,
        "is_featured": True,
        "specifications": {
            "Display": "6.1-inch Super Retina XDR OLED 120Hz",
            "Processor": "Apple A17 Pro (3nm)",
            "RAM": "8GB",
            "Storage": "128GB",
            "Battery": "3274 mAh with 20W Fast Charging",
            "Camera": "48MP + 12MP + 12MP Triple Lens",
            "OS": "iOS 17"
        }
    },
    {
        "name": "Samsung Galaxy S24 Ultra",
        "brand": "Samsung",
        "category_slug": "smartphones",
        "price": 119999.0,
        "original_price": 129999.0,
        "description": "Galaxy AI phone with Titanium frame, 200MP camera, built-in S-Pen, and Snapdragon 8 Gen 3 for Galaxy.",
        "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80",
        "rating": 4.9,
        "rating_count": 412,
        "stock": 30,
        "is_featured": True,
        "specifications": {
            "Display": "6.8-inch Dynamic LTPO AMOLED 2X 120Hz",
            "Processor": "Snapdragon 8 Gen 3",
            "RAM": "12GB",
            "Storage": "256GB",
            "Battery": "5000 mAh with 45W Fast Charging",
            "Camera": "200MP Quad Camera with 100x Space Zoom",
            "OS": "One UI 6.1, Android 14"
        }
    },
    {
        "name": "Samsung Galaxy A54 5G",
        "brand": "Samsung",
        "category_slug": "smartphones",
        "price": 34999.0,
        "original_price": 38999.0,
        "description": "Premium glass finish smartphone with 50MP No Shake Cam, Nightography, and IP67 water resistance.",
        "image_url": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80",
        "rating": 4.4,
        "rating_count": 189,
        "stock": 45,
        "is_featured": False,
        "specifications": {
            "Display": "6.4-inch FHD+ Super AMOLED 120Hz",
            "Processor": "Exynos 1380 Octa-Core",
            "RAM": "8GB",
            "Storage": "128GB",
            "Battery": "5000 mAh",
            "Camera": "50MP OIS + 12MP Ultra-Wide + 5MP Macro",
            "OS": "Android 13, upgradable"
        }
    },
    {
        "name": "OnePlus 12R",
        "brand": "OnePlus",
        "category_slug": "smartphones",
        "price": 39999.0,
        "original_price": 42999.0,
        "description": "Smooth Beyond Belief flagship killer powered by Snapdragon 8 Gen 2 with 100W SUPERVOOC charging.",
        "image_url": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80",
        "rating": 4.6,
        "rating_count": 275,
        "stock": 40,
        "is_featured": True,
        "specifications": {
            "Display": "6.78-inch 1.5K ProXDR LTPO4 AMOLED 120Hz",
            "Processor": "Qualcomm Snapdragon 8 Gen 2",
            "RAM": "16GB",
            "Storage": "256GB",
            "Battery": "5500 mAh with 100W SUPERVOOC",
            "Camera": "50MP Sony IMX890 OIS",
            "OS": "OxygenOS 14"
        }
    },
    {
        "name": "Redmi Note 13 Pro+ 5G",
        "brand": "Xiaomi",
        "category_slug": "smartphones",
        "price": 28999.0,
        "original_price": 32999.0,
        "description": "Curved AMOLED display phone with 200MP OIS camera, IP68 water resistance, and 120W HyperCharge.",
        "image_url": "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=600&q=80",
        "rating": 4.3,
        "rating_count": 160,
        "stock": 50,
        "is_featured": False,
        "specifications": {
            "Display": "6.67-inch 3D Curved 1.5K CrystalRes AMOLED",
            "Processor": "MediaTek Dimensity 7200-Ultra",
            "RAM": "8GB",
            "Storage": "256GB",
            "Battery": "5000 mAh with 120W fast charging",
            "Camera": "200MP Samsung ISOCELL HP3",
            "OS": "MIUI 14 based on Android 13"
        }
    },
    {
        "name": "Google Pixel 8a",
        "brand": "Google",
        "category_slug": "smartphones",
        "price": 49999.0,
        "original_price": 52999.0,
        "description": "AI-first smartphone engineered by Google featuring Tensor G3, Best Take, Magic Audio Eraser, and 7 years of OS updates.",
        "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff0259d?auto=format&fit=crop&w=600&q=80",
        "rating": 4.7,
        "rating_count": 210,
        "stock": 20,
        "is_featured": False,
        "specifications": {
            "Display": "6.1-inch Actua display 120Hz OLED",
            "Processor": "Google Tensor G3",
            "RAM": "8GB LPDDR5x",
            "Storage": "128GB",
            "Battery": "4492 mAh",
            "Camera": "64MP Quad PD + 13MP Ultra-Wide",
            "OS": "Pure Android 14"
        }
    },

    # --- LAPTOPS ---
    {
        "name": "Apple MacBook Air M2",
        "brand": "Apple",
        "category_slug": "laptops",
        "price": 89999.0,
        "original_price": 99900.0,
        "description": "Incredibly thin and fast laptop with 13.6-inch Liquid Retina display, MagSafe charging, and up to 18 hours of battery.",
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
        "rating": 4.9,
        "rating_count": 520,
        "stock": 35,
        "is_featured": True,
        "specifications": {
            "Display": "13.6-inch Liquid Retina Display (2560x1664)",
            "Processor": "Apple M2 8-core CPU, 8-core GPU",
            "RAM": "8GB Unified Memory",
            "Storage": "256GB SSD",
            "Battery": "Up to 18 hours",
            "Weight": "1.24 kg",
            "OS": "macOS Sonoma"
        }
    },
    {
        "name": "Dell XPS 13 Plus",
        "brand": "Dell",
        "category_slug": "laptops",
        "price": 145999.0,
        "original_price": 159999.0,
        "description": "Minimalist ultra-premium laptop with zero-lattice keyboard, seamless glass haptic touchpad, and 3.5K OLED touch.",
        "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
        "rating": 4.6,
        "rating_count": 130,
        "stock": 15,
        "is_featured": False,
        "specifications": {
            "Display": "13.4-inch 3.5K (3456x2160) OLED Touch",
            "Processor": "Intel Core i7-1360P 12-Core",
            "RAM": "16GB LPDDR5",
            "Storage": "512GB PCIe 4.0 NVMe SSD",
            "Battery": "55 Whr",
            "Weight": "1.26 kg",
            "OS": "Windows 11 Pro"
        }
    },
    {
        "name": "ASUS ROG Zephyrus G14",
        "brand": "ASUS",
        "category_slug": "laptops",
        "price": 134999.0,
        "original_price": 149999.0,
        "description": "Compact gaming powerhouse with AMD Ryzen 9, NVIDIA RTX 4060 graphics, and stunning 3K 120Hz OLED display.",
        "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
        "rating": 4.8,
        "rating_count": 215,
        "stock": 18,
        "is_featured": True,
        "specifications": {
            "Display": "14-inch ROG Nebula OLED 3K 120Hz",
            "Processor": "AMD Ryzen 9 8945HS (8 Cores, 16 Threads)",
            "Graphics": "NVIDIA GeForce RTX 4060 8GB GDDR6",
            "RAM": "16GB LPDDR5X",
            "Storage": "1TB PCIe Gen4 SSD",
            "Weight": "1.5 kg",
            "OS": "Windows 11 Home"
        }
    },
    {
        "name": "HP Pavilion 15",
        "brand": "HP",
        "category_slug": "laptops",
        "price": 48999.0,
        "original_price": 54999.0,
        "description": "Reliable everyday laptop with 12th Gen Intel Core i5, FHD micro-edge display, and fast charging.",
        "image_url": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80",
        "rating": 4.3,
        "rating_count": 310,
        "stock": 60,
        "is_featured": False,
        "specifications": {
            "Display": "15.6-inch FHD IPS Anti-Glare (1920x1080)",
            "Processor": "Intel Core i5-1235U (10 Cores)",
            "RAM": "16GB DDR4",
            "Storage": "512GB NVMe M.2 SSD",
            "Battery": "41 Whr with fast charge (50% in 45 min)",
            "Weight": "1.75 kg",
            "OS": "Windows 11 Home"
        }
    },
    {
        "name": "Lenovo IdeaPad Slim 3",
        "brand": "Lenovo",
        "category_slug": "laptops",
        "price": 38999.0,
        "original_price": 44999.0,
        "description": "Thin and lightweight budget laptop designed for study, browsing, and remote productivity.",
        "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
        "rating": 4.2,
        "rating_count": 195,
        "stock": 55,
        "is_featured": False,
        "specifications": {
            "Display": "15.6-inch FHD (1920x1080)",
            "Processor": "Intel Core i3-1215U",
            "RAM": "8GB DDR4 (expandable)",
            "Storage": "512GB SSD",
            "Battery": "Up to 7 hours",
            "Weight": "1.63 kg",
            "OS": "Windows 11 Home"
        }
    },
    {
        "name": "Acer Swift Go 14 AI",
        "brand": "Acer",
        "category_slug": "laptops",
        "price": 64999.0,
        "original_price": 72999.0,
        "description": "Intel Core Ultra 5 AI-boosted laptop with 2.8K OLED display, dual fan cooling, and multi-core NPU.",
        "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
        "rating": 4.5,
        "rating_count": 140,
        "stock": 25,
        "is_featured": False,
        "specifications": {
            "Display": "14-inch 2.8K OLED 90Hz 100% DCI-P3",
            "Processor": "Intel Core Ultra 5 125H with AI Boost NPU",
            "RAM": "16GB LPDDR5X",
            "Storage": "512GB Gen4 SSD",
            "Battery": "65 Whr",
            "Weight": "1.32 kg",
            "OS": "Windows 11 Home"
        }
    },

    # --- HEADPHONES ---
    {
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "brand": "Sony",
        "category_slug": "headphones",
        "price": 26999.0,
        "original_price": 29990.0,
        "description": "Industry-leading active noise canceling headphones with 8 microphones, Auto NC Optimizer, and 30 hours battery.",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "rating": 4.8,
        "rating_count": 640,
        "stock": 40,
        "is_featured": True,
        "specifications": {
            "Type": "Over-Ear Wireless",
            "Noise Cancellation": "Dual Processor QN1 + V1",
            "Battery": "30 Hours (ANC On)",
            "Driver": "30mm Carbon Fiber",
            "Connectivity": "Bluetooth 5.2, LDAC, Multipoint",
            "Weight": "250g"
        }
    },
    {
        "name": "Apple AirPods Pro (2nd Generation)",
        "brand": "Apple",
        "category_slug": "headphones",
        "price": 21999.0,
        "original_price": 24900.0,
        "description": "Next-level active noise cancellation, Adaptive Audio, Personalized Spatial Audio, and USB-C MagSafe case.",
        "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80",
        "rating": 4.9,
        "rating_count": 820,
        "stock": 50,
        "is_featured": True,
        "specifications": {
            "Type": "True Wireless In-Ear",
            "Chip": "Apple H2 Headphone Chip",
            "Battery": "6 Hours (30 Hours with case)",
            "Features": "Adaptive Transparency, Lossless Audio ready",
            "Resistance": "IP54 Dust & Sweat Resistant"
        }
    },
    {
        "name": "boAt Rockerz 450",
        "brand": "boAt",
        "category_slug": "headphones",
        "price": 1499.0,
        "original_price": 3990.0,
        "description": "Affordable on-ear wireless headphones with punchy bass, 40mm drivers, and up to 15 hours playback.",
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
        "rating": 4.1,
        "rating_count": 1250,
        "stock": 100,
        "is_featured": False,
        "specifications": {
            "Type": "On-Ear Wireless",
            "Battery": "15 Hours Playback",
            "Driver": "40mm Dynamic",
            "Connectivity": "Bluetooth v5.0 and AUX mode",
            "Cushion": "Adaptive Soft Ear Cups"
        }
    },
    {
        "name": "boAt Airdopes 141",
        "brand": "boAt",
        "category_slug": "headphones",
        "price": 1199.0,
        "original_price": 4490.0,
        "description": "True wireless earbuds with 42 hours total playback, ENx noise cancellation for calls, and low latency beast mode.",
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
        "rating": 4.0,
        "rating_count": 980,
        "stock": 120,
        "is_featured": False,
        "specifications": {
            "Type": "TWS In-Ear",
            "Battery": "42 Hours total (6 Hours per charge)",
            "Driver": "8mm drivers",
            "Water Resistance": "IPX4",
            "Latency": "80ms Beast Mode for gaming"
        }
    },
    {
        "name": "Bose QuietComfort 45",
        "brand": "Bose",
        "category_slug": "headphones",
        "price": 24999.0,
        "original_price": 29900.0,
        "description": "Iconic acoustic noise cancelling headphones delivering deep, clear sound with TriPort acoustic architecture.",
        "image_url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80",
        "rating": 4.7,
        "rating_count": 390,
        "stock": 25,
        "is_featured": False,
        "specifications": {
            "Type": "Over-Ear Wireless",
            "Battery": "22 Hours",
            "Noise Cancellation": "Quiet and Aware Modes",
            "Charging": "USB-C fast charge (15 mins = 3 hours)",
            "Weight": "240g"
        }
    },
    {
        "name": "Sennheiser HD 450BT",
        "brand": "Sennheiser",
        "category_slug": "headphones",
        "price": 7999.0,
        "original_price": 14990.0,
        "description": "Great wireless sound with deep dynamic bass, active noise cancellation, and high-quality codec support (AAC, aptX).",
        "image_url": "https://images.unsplash.com/photo-1578319439584-104c94d37305?auto=format&fit=crop&w=600&q=80",
        "rating": 4.4,
        "rating_count": 280,
        "stock": 35,
        "is_featured": False,
        "specifications": {
            "Type": "Over-Ear Wireless",
            "Battery": "30 Hours",
            "Codecs": "AAC, aptX, aptX Low Latency",
            "App": "Sennheiser Smart Control EQ",
            "Foldable": "Yes, compact fold"
        }
    },

    # --- SMARTWATCHES ---
    {
        "name": "Apple Watch Series 9",
        "brand": "Apple",
        "category_slug": "smartwatches",
        "price": 38999.0,
        "original_price": 41900.0,
        "description": "Smarter, brighter, and mightier watch with S9 SiP chip, Double Tap gesture, Blood Oxygen, and ECG tracking.",
        "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
        "rating": 4.8,
        "rating_count": 410,
        "stock": 30,
        "is_featured": True,
        "specifications": {
            "Display": "Always-On Retina OLED up to 2000 nits",
            "Chip": "S9 SiP 64-bit dual core",
            "Sensors": "ECG, Blood Oxygen, Temperature sensing, Heart Rate",
            "Battery": "18 Hours (36 Hours in Low Power Mode)",
            "Water Resistance": "50m swimproof",
            "Compatibility": "iOS only"
        }
    },
    {
        "name": "Samsung Galaxy Watch 6",
        "brand": "Samsung",
        "category_slug": "smartwatches",
        "price": 24999.0,
        "original_price": 29999.0,
        "description": "Comprehensive personalized sleep coaching, Body Composition BIA sensor, sapphire crystal glass, and Wear OS 4.",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
        "rating": 4.6,
        "rating_count": 270,
        "stock": 35,
        "is_featured": True,
        "specifications": {
            "Display": "1.5-inch Super AMOLED Sapphire Crystal",
            "OS": "Wear OS Powered by Samsung",
            "Sensors": "BioActive Sensor (Heart Rate + ECG + BIA)",
            "Battery": "425 mAh with WPC wireless fast charge",
            "Water Resistance": "5ATM + IP68 / MIL-STD-810H"
        }
    },
    {
        "name": "Noise ColorFit Pro 5",
        "brand": "Noise",
        "category_slug": "smartwatches",
        "price": 3499.0,
        "original_price": 7999.0,
        "description": "Feature-packed smartwatch with 1.85-inch AMOLED display, BT calling, SOS emergency calling, and 100+ sports modes.",
        "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80",
        "rating": 4.2,
        "rating_count": 520,
        "stock": 80,
        "is_featured": False,
        "specifications": {
            "Display": "1.85-inch AMOLED (390x450)",
            "Calling": "TruSync Bluetooth Calling with mic/speaker",
            "Battery": "Up to 7 days battery life",
            "Water Resistance": "IP68 water & dust proof",
            "Health": "24x7 Heart rate, SpO2, Sleep monitor"
        }
    },
    {
        "name": "Fire-Boltt Phoenix Pro",
        "brand": "Fire-Boltt",
        "category_slug": "smartwatches",
        "price": 1499.0,
        "original_price": 9999.0,
        "description": "Round dial luxury metallic design smartwatch with Bluetooth calling, AI voice assistant, and 120+ workout modes.",
        "image_url": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80",
        "rating": 4.0,
        "rating_count": 890,
        "stock": 110,
        "is_featured": False,
        "specifications": {
            "Display": "1.39-inch HD TFT Full Touch Round screen",
            "Body": "Metal casing with silicone/mesh strap",
            "Battery": "7 days normal use, 4 days with calling",
            "Health Tracking": "SpO2, Heart rate, Breathe mode"
        }
    },
    {
        "name": "Garmin Forerunner 265",
        "brand": "Garmin",
        "category_slug": "smartwatches",
        "price": 46999.0,
        "original_price": 50490.0,
        "description": "Premium GPS running smartwatch with brilliant AMOLED touchscreen, training readiness, and morning health reports.",
        "image_url": "https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=600&q=80",
        "rating": 4.8,
        "rating_count": 140,
        "stock": 15,
        "is_featured": False,
        "specifications": {
            "Display": "1.3-inch Colorful AMOLED Display",
            "GPS": "Multi-band GNSS with SatIQ technology",
            "Battery": "Up to 13 days in smartwatch mode",
            "Metrics": "VO2 Max, HRV status, Training Load",
            "Water Rating": "5 ATM"
        }
    },
    {
        "name": "Amazfit GTR 4",
        "brand": "Amazfit",
        "category_slug": "smartwatches",
        "price": 16999.0,
        "original_price": 23999.0,
        "description": "Vintage round look with dual-band circularly-polarized GPS antenna, 14-day ultra-long battery, and Zepp OS 2.0.",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
        "rating": 4.5,
        "rating_count": 230,
        "stock": 30,
        "is_featured": False,
        "specifications": {
            "Display": "1.43-inch HD AMOLED with anti-glare glass",
            "Battery": "14 Days Typical Usage",
            "GPS": "6 Satellite Positioning Systems",
            "Sensors": "BioTracker 4.0 PPG biometric sensor"
        }
    },

    # --- ACCESSORIES ---
    {
        "name": "Logitech MX Master 3S Wireless Mouse",
        "brand": "Logitech",
        "category_slug": "accessories",
        "price": 8999.0,
        "original_price": 10995.0,
        "description": "Ergonomic performance mouse with 8K DPI track-on-glass sensor, quiet clicks, and MagSpeed electromagnetic scroll.",
        "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
        "rating": 4.9,
        "rating_count": 780,
        "stock": 50,
        "is_featured": True,
        "specifications": {
            "Sensor": "Darkfield 8000 DPI (Works on glass)",
            "Buttons": "7 customizable buttons + thumb wheel",
            "Battery": "Up to 70 days on full charge",
            "Connectivity": "Bluetooth Low Energy & Logi Bolt USB",
            "Weight": "141g"
        }
    },
    {
        "name": "Keychron K2 Pro Mechanical Keyboard",
        "brand": "Keychron",
        "category_slug": "accessories",
        "price": 8499.0,
        "original_price": 9999.0,
        "description": "Wireless custom mechanical keyboard with QMK/VIA support, hot-swappable switches, and Mac/Windows layout.",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
        "rating": 4.7,
        "rating_count": 310,
        "stock": 30,
        "is_featured": False,
        "specifications": {
            "Layout": "75% Compact (84 keys)",
            "Switches": "Hot-swappable Keychron K Pro Mechanical",
            "Keycaps": "OSA profile double-shot PBT",
            "Connectivity": "Bluetooth 5.1 & Type-C wired",
            "Battery": "4000 mAh rechargeable"
        }
    },
    {
        "name": "Anker 737 Power Bank (PowerCore 24K)",
        "brand": "Anker",
        "category_slug": "accessories",
        "price": 9999.0,
        "original_price": 12999.0,
        "description": "24,000mAh 3-port portable charger with ultra-powerful 140W bi-directional output and smart digital display.",
        "image_url": "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=600&q=80",
        "rating": 4.8,
        "rating_count": 410,
        "stock": 45,
        "is_featured": False,
        "specifications": {
            "Capacity": "24,000 mAh",
            "Output": "140W Max Two-Way Fast Charge",
            "Ports": "2x USB-C + 1x USB-A",
            "Display": "Smart digital screen with real-time stats"
        }
    },
    {
        "name": "Apple 20W USB-C Power Adapter",
        "brand": "Apple",
        "category_slug": "accessories",
        "price": 1899.0,
        "original_price": 1900.0,
        "description": "Fast and efficient charging at home, in the office, or on the go for iPhone, iPad, and Apple Watch.",
        "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80",
        "rating": 4.6,
        "rating_count": 920,
        "stock": 150,
        "is_featured": False,
        "specifications": {
            "Power": "20W Power Delivery",
            "Port": "Single USB-C",
            "Compatibility": "Universal USB-PD compatible"
        }
    },
    {
        "name": "SanDisk Extreme 1TB Portable SSD",
        "brand": "SanDisk",
        "category_slug": "accessories",
        "price": 8999.0,
        "original_price": 13999.0,
        "description": "Tough NVMe solid state drive with up to 1050MB/s read speeds, IP55 water and dust resistance.",
        "image_url": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
        "rating": 4.7,
        "rating_count": 650,
        "stock": 60,
        "is_featured": False,
        "specifications": {
            "Capacity": "1TB",
            "Speed": "Up to 1050 MB/s Read, 1000 MB/s Write",
            "Durability": "IP55 water/dust resistance, 2-meter drop protection",
            "Interface": "USB 3.2 Gen 2 Type-C"
        }
    },
    {
        "name": "Baseus 8-in-1 USB-C Hub Adapter",
        "brand": "Baseus",
        "category_slug": "accessories",
        "price": 2799.0,
        "original_price": 4999.0,
        "description": "Multiport adapter featuring 4K 60Hz HDMI, 100W Power Delivery, Gigabit Ethernet, SD card reader, and 3 USB 3.0 ports.",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        "rating": 4.4,
        "rating_count": 290,
        "stock": 70,
        "is_featured": False,
        "specifications": {
            "Ports": "HDMI 4K@60Hz, 3x USB 3.0, 100W PD, RJ45 1000Mbps, SD/TF",
            "Material": "Aluminum Alloy Enclosure",
            "Cable Length": "15 cm"
        }
    },

    # --- ELECTRONICS ---
    {
        "name": "LG UltraFine 27-inch 4K UHD Monitor",
        "brand": "LG",
        "category_slug": "electronics",
        "price": 27999.0,
        "original_price": 35000.0,
        "description": "IPS display with HDR10, sRGB 98% color gamut, AMD FreeSync, and virtually borderless 3-side design.",
        "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
        "rating": 4.7,
        "rating_count": 340,
        "stock": 20,
        "is_featured": True,
        "specifications": {
            "Screen Size": "27-inch 4K UHD (3840 x 2160)",
            "Panel": "IPS with HDR10",
            "Refresh Rate": "60Hz with AMD FreeSync",
            "Ports": "2x HDMI 2.0, DisplayPort 1.4, Headphone out"
        }
    },
    {
        "name": "Sony HT-S20R 5.1ch Soundbar",
        "brand": "Sony",
        "category_slug": "electronics",
        "price": 17999.0,
        "original_price": 23990.0,
        "description": "Real 5.1 channel surround sound with wired rear speakers, external subwoofer, and 400W total output.",
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80",
        "rating": 4.5,
        "rating_count": 480,
        "stock": 25,
        "is_featured": False,
        "specifications": {
            "Channels": "5.1 Ch Dolby Digital",
            "Output": "400W Total Power",
            "Connectivity": "Bluetooth, HDMI ARC, Optical, USB",
            "Included": "Soundbar + Subwoofer + 2 Rear Speakers"
        }
    },
    {
        "name": "Amazon Echo Dot (5th Gen) with Alexa",
        "brand": "Amazon",
        "category_slug": "electronics",
        "price": 4499.0,
        "original_price": 5499.0,
        "description": "Best sounding Echo Dot yet with deeper bass, clearer vocals, motion detection, and temperature sensor.",
        "image_url": "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=600&q=80",
        "rating": 4.6,
        "rating_count": 1150,
        "stock": 85,
        "is_featured": False,
        "specifications": {
            "Speaker": "1.73-inch front-firing speaker",
            "Voice Assistant": "Amazon Alexa built-in",
            "Smart Home": "Matter, Wi-Fi, Bluetooth, Motion Sensor",
            "Audio Quality": "High Definition Lossless Audio"
        }
    },
    {
        "name": "Sony Alpha 7 IV Full-Frame Camera",
        "brand": "Sony",
        "category_slug": "electronics",
        "price": 209999.0,
        "original_price": 224990.0,
        "description": "33MP full-frame Exmor R CMOS sensor, 4K 60p video recording, next-gen real-time AF for humans, animals, and birds.",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
        "rating": 4.9,
        "rating_count": 160,
        "stock": 10,
        "is_featured": True,
        "specifications": {
            "Sensor": "33.0 Megapixel Full-Frame Exmor R",
            "Video": "4K 60p 10-bit 4:2:2 recording",
            "Autofocus": "759 Phase-detection points",
            "Stabilization": "5-axis in-body image stabilization (5.5 stops)"
        }
    },
    {
        "name": "TP-Link Archer AX72 WiFi 6 Router",
        "brand": "TP-Link",
        "category_slug": "electronics",
        "price": 6999.0,
        "original_price": 9999.0,
        "description": "Gigabit Dual Band AX5400 WiFi 6 router with 6 high-gain antennas, OneMesh support, and HomeShield security.",
        "image_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
        "rating": 4.5,
        "rating_count": 290,
        "stock": 40,
        "is_featured": False,
        "specifications": {
            "Speed": "5400 Mbps (4804 Mbps on 5GHz + 574 Mbps on 2.4GHz)",
            "Antennas": "6 High-gain Antennas with Beamforming",
            "Processor": "1 GHz Dual-Core CPU",
            "Ports": "1x Gigabit WAN, 4x Gigabit LAN, 1x USB 3.0"
        }
    },
    {
        "name": "Crucial X9 Pro 2TB Portable SSD",
        "brand": "Crucial",
        "category_slug": "electronics",
        "price": 14999.0,
        "original_price": 19999.0,
        "description": "Ultra-compact SSD with up to 1050MB/s speeds, IP55 water and dust resistance, and 256-bit AES encryption.",
        "image_url": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=600&q=80",
        "rating": 4.6,
        "rating_count": 180,
        "stock": 35,
        "is_featured": False,
        "specifications": {
            "Capacity": "2TB",
            "Speed": "1050 MB/s Read and Write",
            "Size": "65 x 50 mm (Extremely compact)",
            "Interface": "USB-C 3.2 Gen 2"
        }
    }
]

def seed_database(db: Session):
    # Check if categories already exist
    existing_cat = db.query(Category).first()
    category_map = {}
    if not existing_cat:
        for cat_data in CATEGORIES_DATA:
            category = Category(**cat_data)
            db.add(category)
        db.commit()
    
    # Reload categories map
    categories = db.query(Category).all()
    for cat in categories:
        category_map[cat.slug] = cat.id

    # Check products
    existing_product = db.query(Product).first()
    if not existing_product:
        for p_data in PRODUCTS_DATA:
            cat_id = category_map.get(p_data["category_slug"])
            product = Product(
                name=p_data["name"],
                brand=p_data["brand"],
                category_id=cat_id,
                price=p_data["price"],
                original_price=p_data.get("original_price"),
                description=p_data["description"],
                image_url=p_data["image_url"],
                rating=p_data.get("rating", 4.5),
                rating_count=p_data.get("rating_count", 100),
                stock=p_data.get("stock", 20),
                is_featured=p_data.get("is_featured", False),
                specifications=json.dumps(p_data.get("specifications", {}))
            )
            db.add(product)
        db.commit()

    # Seed Admin & Demo User
    admin_user = db.query(User).filter(User.email == "admin@voicemart.com").first()
    if not admin_user:
        admin = User(
            email="admin@voicemart.com",
            username="admin",
            full_name="VoiceMart Administrator",
            hashed_password=hash_password("Admin@123"),
            role="admin"
        )
        db.add(admin)

    demo_user = db.query(User).filter(User.email == "john@example.com").first()
    if not demo_user:
        user = User(
            email="john@example.com",
            username="johndoe",
            full_name="John Doe",
            hashed_password=hash_password("User@123"),
            role="user"
        )
        db.add(user)

    db.commit()

