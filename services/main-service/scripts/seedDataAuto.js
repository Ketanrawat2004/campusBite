'use strict';

const mongoose = require('mongoose');

const College = require('../src/models/College');
const Campus = require('../src/models/Campus');
const User = require('../src/models/User');
const Hostel = require('../src/models/Hostel');
const Canteen = require('../src/models/Canteen');
const MenuCategory = require('../src/models/MenuCategory');
const MenuItem = require('../src/models/MenuItem');
const DeliveryConfig = require('../src/models/DeliveryConfig');
const { restorePersistentUsers } = require('../src/utils/persistentUserStore');

module.exports = async function seedDataAuto() {
  // Clear existing
  await Promise.all([
    College.deleteMany({}),
    Campus.deleteMany({}),
    User.deleteMany({}),
    Hostel.deleteMany({}),
    Canteen.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    DeliveryConfig.deleteMany({}),
  ]);

  // College & Campus
  const college = await College.create({
    name: 'National Institute of Technology Jamshedpur',
    shortName: 'NITJSR',
    city: 'Jamshedpur',
    state: 'Jharkhand',
    country: 'India',
    isActive: true,
  });

  const campus = await Campus.create({
    collegeId: college._id,
    name: 'Main Campus',
    address: 'Adityapur, Jamshedpur, Jharkhand 831014',
    isActive: true,
  });

  // Comprehensive Hostels list as requested by user:
  // Hostel - I, Hostel - K, Hostel - J, Hostel - F to G, Hostel - A to D, Hostel A-D individual, Hostel F-G individual, Hostel I-K individual
  const hostels = await Promise.all([
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel - I', shortCode: 'HI', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 25 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel - K', shortCode: 'HK', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 25 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel - J', shortCode: 'HJ', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 25 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel - F to G', shortCode: 'HF-HG', type: 'BOYS', blocks: [{ blockName: 'F', floors: 3, roomsPerFloor: 20 }, { blockName: 'G', floors: 3, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel - A to D', shortCode: 'HA-HD', type: 'BOYS', blocks: [{ blockName: 'A', floors: 3, roomsPerFloor: 20 }, { blockName: 'B', floors: 3, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel A', shortCode: 'HA', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel B', shortCode: 'HB', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel C', shortCode: 'HC', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel D', shortCode: 'HD', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel F', shortCode: 'HF', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Hostel G', shortCode: 'HG', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'H1 Hostel', shortCode: 'H1', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'H2 Hostel', shortCode: 'H2', type: 'BOYS', blocks: [{ blockName: 'A', floors: 3, roomsPerFloor: 18 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'H3 Hostel', shortCode: 'H3', type: 'BOYS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'MB Hostel (Girls)', shortCode: 'MB', type: 'GIRLS', blocks: [{ blockName: 'A', floors: 3, roomsPerFloor: 16 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'Rani Laxmi Bai Hall (RLB)', shortCode: 'RLB', type: 'GIRLS', blocks: [{ blockName: 'A', floors: 4, roomsPerFloor: 20 }], isActive: true }),
    Hostel.create({ collegeId: college._id, campusId: campus._id, name: 'New Boys Hostel (NBH)', shortCode: 'NBH', type: 'BOYS', blocks: [{ blockName: 'A', floors: 5, roomsPerFloor: 24 }], isActive: true }),
  ]);

  // Users — pass plain passwords so User.js pre-save hook hashes them ONCE
  await User.create({
    collegeId: college._id,
    campusId: campus._id,
    name: 'CampusBite Admin',
    email: 'admin@campusbite.dev',
    passwordHash: 'Admin@123',
    phone: '9000000001',
    role: 'ADMIN',
    isVerified: true,
    isActive: true,
  });

  await User.create({
    collegeId: college._id,
    campusId: campus._id,
    name: 'Rahul Kumar',
    email: 'rahul@nitjsr.ac.in',
    passwordHash: 'Student@123',
    phone: '9876543210',
    role: 'STUDENT',
    isVerified: true,
    isActive: true,
    studentProfile: {
      rollNumber: '2021ME001',
      hostelId: hostels[0]._id,
      roomNumber: 'A-214',
      year: 3,
    },
  });

  const canteenStaffUser = await User.create({
    collegeId: college._id,
    campusId: campus._id,
    name: 'Main Canteen Manager',
    email: 'main.canteen@nitjsr.ac.in',
    passwordHash: 'Staff@123',
    phone: '9000000010',
    role: 'CANTEEN_STAFF',
    isVerified: true,
    isActive: true,
  });

  const ambaStaffUser = await User.create({
    collegeId: college._id,
    campusId: campus._id,
    name: 'Amba Canteen Manager',
    email: 'amba.canteen@nitjsr.ac.in',
    passwordHash: 'Staff@123',
    phone: '9000000011',
    role: 'CANTEEN_STAFF',
    isVerified: true,
    isActive: true,
  });

  // Restore custom registered users from disk backup
  await restorePersistentUsers(User);

  const defaultHours = [0,1,2,3,4,5,6].map((day) => ({
    dayOfWeek: day,
    openTime: '08:00',
    closeTime: '22:00',
    isOpen: true,
  }));

  // Canteens: Main Canteen, Amba Canteen, Hostel I Canteen, Hostel K Canteen, Hostel J Canteen, Hostel F-G Canteen, H1 Canteen, Library Café
  const canteens = await Promise.all([
    Canteen.create({
      collegeId: college._id,
      campusId: campus._id,
      name: 'Main Canteen',
      description: 'The main campus canteen serving North Indian, South Indian, and Chinese food.',
      imageUrl: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800',
      location: { name: 'Near Academic Courtyard' },
      operatingHours: defaultHours,
      contactPhone: '9100000001',
      avgPrepTimeMinutes: 15,
      isCurrentlyOpen: true,
      acceptingOrders: true,
      rating: { average: 4.3, count: 320 },
      tags: ['meals', 'snacks', 'beverages', 'thali'],
      staffIds: [canteenStaffUser._id],
    }),
    Canteen.create({
      collegeId: college._id,
      campusId: campus._id,
      name: 'Amba Canteen & Fast Food',
      description: 'Famous NITJSR spot for Special Thalis, Chole Bhature, Paneer Rolls, Samosa Chaat & Cold Drinks!',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      location: { name: 'Opposite Academic Complex' },
      operatingHours: defaultHours,
      contactPhone: '9100000004',
      avgPrepTimeMinutes: 12,
      isCurrentlyOpen: true,
      acceptingOrders: true,
      rating: { average: 4.6, count: 450 },
      tags: ['amba', 'thali', 'chole-bhature', 'rolls', 'bestseller'],
      staffIds: [ambaStaffUser._id],
    }),
    Canteen.create({
      collegeId: college._id,
      campusId: campus._id,
      name: 'Hostel I Canteen',
      description: 'Late-night hostel food joint — Parathas, Egg Maggi, Sandwiches & Energy Drinks.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      location: { name: 'Hostel I Ground Floor' },
      operatingHours: defaultHours,
      contactPhone: '9100000005',
      avgPrepTimeMinutes: 10,
      isCurrentlyOpen: true,
      acceptingOrders: true,
      rating: { average: 4.3, count: 189 },
      tags: ['hostel-i', 'late-night', 'paratha', 'maggi'],
    }),
    Canteen.create({
      collegeId: college._id,
      campusId: campus._id,
      name: 'Hostel K Canteen',
      description: 'Fast food & snacks hub inside Hostel K — Burgers, Fries, Fried Rice & Shakes.',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      location: { name: 'Hostel K Quadrangle' },
      operatingHours: defaultHours,
      contactPhone: '9100000006',
      avgPrepTimeMinutes: 10,
      isCurrentlyOpen: true,
      acceptingOrders: true,
      rating: { average: 4.4, count: 210 },
      tags: ['hostel-k', 'fast-food', 'burgers', 'fries'],
    }),
    Canteen.create({
      collegeId: college._id,
      campusId: campus._id,
      name: 'Hostel F-G Canteen',
      description: 'South Indian breakfast & Evening Tea hub near Hostel F and G.',
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
      location: { name: 'Hostel F & G Lawn' },
      operatingHours: defaultHours,
      contactPhone: '9100000007',
      avgPrepTimeMinutes: 10,
      isCurrentlyOpen: true,
      acceptingOrders: true,
      rating: { average: 4.2, count: 140 },
      tags: ['dosa', 'idli', 'chai', 'south-indian'],
    }),
    Canteen.create({
      collegeId: college._id,
      campusId: campus._id,
      name: 'H1 Hostel Canteen',
      description: 'Quick bites and beverages right inside H1 hostel ground floor.',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      location: { name: 'H1 Hostel Ground Floor' },
      operatingHours: defaultHours,
      contactPhone: '9100000002',
      avgPrepTimeMinutes: 10,
      isCurrentlyOpen: true,
      acceptingOrders: true,
      rating: { average: 4.0, count: 180 },
      tags: ['snacks', 'beverages', 'maggi', 'fast-food'],
    }),
    Canteen.create({
      collegeId: college._id,
      campusId: campus._id,
      name: 'Library Café',
      description: 'Coffee, sandwiches, and light snacks near the central library.',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      location: { name: 'Near Central Library' },
      operatingHours: defaultHours,
      contactPhone: '9100000003',
      avgPrepTimeMinutes: 8,
      isCurrentlyOpen: true,
      acceptingOrders: true,
      rating: { average: 4.5, count: 120 },
      tags: ['café', 'coffee', 'sandwiches', 'snacks'],
    }),
  ]);

  await User.findByIdAndUpdate(canteenStaffUser._id, { 'canteenProfile.canteenId': canteens[0]._id });
  await User.findByIdAndUpdate(ambaStaffUser._id, { 'canteenProfile.canteenId': canteens[1]._id });

  // 1. Main Canteen Categories & Items
  const cat1 = await MenuCategory.create({ canteenId: canteens[0]._id, collegeId: college._id, name: 'Breakfast', sortOrder: 1 });
  const cat2 = await MenuCategory.create({ canteenId: canteens[0]._id, collegeId: college._id, name: 'Meals & Thali', sortOrder: 2 });
  const cat3 = await MenuCategory.create({ canteenId: canteens[0]._id, collegeId: college._id, name: 'Snacks & Drinks', sortOrder: 3 });

  await Promise.all([
    MenuItem.create({ canteenId: canteens[0]._id, collegeId: college._id, categoryId: cat1._id, name: 'Poha', description: 'Flattened rice cooked with onions and peanuts', priceInPaise: 2500, isVeg: true, preparationTimeMinutes: 8, tags: ['bestseller'], imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80' }),
    MenuItem.create({ canteenId: canteens[0]._id, collegeId: college._id, categoryId: cat1._id, name: 'Masala Dosa', description: 'Crispy dosa with spiced potato filling & coconut chutney', priceInPaise: 5000, isVeg: true, preparationTimeMinutes: 10, tags: ['south-indian', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80' }),
    MenuItem.create({ canteenId: canteens[0]._id, collegeId: college._id, categoryId: cat2._id, name: 'Veg Thali', description: 'Dal fry, Paneer sabzi, 3 Rotis, Rice, and Papad', priceInPaise: 8000, isVeg: true, preparationTimeMinutes: 10, tags: ['bestseller', 'thali'], imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&q=80' }),
    MenuItem.create({ canteenId: canteens[0]._id, collegeId: college._id, categoryId: cat2._id, name: 'Chicken Thali', description: 'Chicken curry, Dal, 3 Rotis, Rice, and Salad', priceInPaise: 11000, isVeg: false, preparationTimeMinutes: 12, tags: ['non-veg'], imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80' }),
    MenuItem.create({ canteenId: canteens[0]._id, collegeId: college._id, categoryId: cat3._id, name: 'Veg Maggi', description: 'Butter masala instant noodles with veggies', priceInPaise: 3000, isVeg: true, preparationTimeMinutes: 7, tags: ['bestseller'], imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&q=80' }),
    MenuItem.create({ canteenId: canteens[0]._id, collegeId: college._id, categoryId: cat3._id, name: 'Masala Chai', description: 'Freshly brewed kulhad ginger tea', priceInPaise: 1500, isVeg: true, preparationTimeMinutes: 3, tags: ['bestseller'], imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80' }),
  ]);

  // 2. Amba Canteen Categories & Items
  const ambaCat1 = await MenuCategory.create({ canteenId: canteens[1]._id, collegeId: college._id, name: 'Amba Specials & Thalis', sortOrder: 1 });
  const ambaCat2 = await MenuCategory.create({ canteenId: canteens[1]._id, collegeId: college._id, name: 'Rolls & Fast Food', sortOrder: 2 });
  const ambaCat3 = await MenuCategory.create({ canteenId: canteens[1]._id, collegeId: college._id, name: 'Snacks & Beverages', sortOrder: 3 });

  await Promise.all([
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat1._id, name: 'Chole Bhature (2 pcs)', description: 'Crispy fluffy bhature served with spicy chole, pickle and fried chili', priceInPaise: 7000, isVeg: true, preparationTimeMinutes: 12, imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500', tags: ['bestseller', 'amba-special'] }),
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat1._id, name: 'Amba Special Paneer Thali', description: 'Paneer Butter Masala, Dal Makhani, 4 Butter Rotis, Jeera Rice, Gulab Jamun & Salad', priceInPaise: 12000, isVeg: true, preparationTimeMinutes: 15, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500', tags: ['thali', 'bestseller'] }),
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat1._id, name: 'Special Chicken Thali', description: 'Kadhai Chicken, Dal Fry, Rice, 3 Butter Tandoori Rotis, Raita & Sweet', priceInPaise: 14000, isVeg: false, preparationTimeMinutes: 15, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500', tags: ['non-veg', 'thali'] }),
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat2._id, name: 'Double Egg Chicken Roll', description: 'Crispy paratha wrap stuffed with spiced chicken tikka and double eggs', priceInPaise: 8500, isVeg: false, preparationTimeMinutes: 10, imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500', tags: ['roll', 'bestseller'] }),
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat2._id, name: 'Paneer Tikka Roll', description: 'Marinated paneer chunks with onions and mint chutney wrapped in paratha', priceInPaise: 7500, isVeg: true, preparationTimeMinutes: 10, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500', tags: ['roll'] }),
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat2._id, name: 'Veg Chowmein', description: 'Stir-fried Hakka noodles with vegetables, soy sauce, and chilli', priceInPaise: 6000, isVeg: true, preparationTimeMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500' }),
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat3._id, name: 'Amba Thick Mango Lassi', description: 'Chilled thick sweet curd blended with Alphonso mango pulp', priceInPaise: 4000, isVeg: true, preparationTimeMinutes: 5, imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&q=80', tags: ['beverage', 'bestseller'] }),
    MenuItem.create({ canteenId: canteens[1]._id, collegeId: college._id, categoryId: ambaCat3._id, name: 'Samosa Chaat', description: 'Crushed samosas topped with spicy chole, curd, sweet tamarind & green chutney', priceInPaise: 4500, isVeg: true, preparationTimeMinutes: 5, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500' }),
  ]);

  // 3. Hostel I Canteen Categories & Items (10 Items)
  const hiCat1 = await MenuCategory.create({ canteenId: canteens[2]._id, collegeId: college._id, name: 'Late Night Maggi & Parathas', sortOrder: 1 });
  const hiCat2 = await MenuCategory.create({ canteenId: canteens[2]._id, collegeId: college._id, name: 'Main Course & Rolls', sortOrder: 2 });

  await Promise.all([
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat1._id, name: 'Cheese Butter Maggi', description: 'Double cheese Maggi with extra butter & chilli flakes', priceInPaise: 4500, isVeg: true, preparationTimeMinutes: 7, tags: ['bestseller', 'maggi'], imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat1._id, name: 'Aloo Pyaaz Paratha (2 pcs)', description: 'Spiced potato flatbread served hot with fresh curd & butter', priceInPaise: 5000, isVeg: true, preparationTimeMinutes: 10, tags: ['paratha'], imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat1._id, name: 'Paneer Stuffed Paratha (2 pcs)', description: 'Grated cottage cheese spiced flatbread with green chutney', priceInPaise: 6500, isVeg: true, preparationTimeMinutes: 10, tags: ['paneer'], imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat1._id, name: 'Double Egg Bhurji & 4 Toasts', description: 'Scrambled spiced eggs with buttered toasted bread', priceInPaise: 6000, isVeg: false, preparationTimeMinutes: 8, tags: ['eggs'], imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat2._id, name: 'Chicken Kathi Roll', description: 'Tandoori chicken tikka rolled in flaky butter paratha', priceInPaise: 8000, isVeg: false, preparationTimeMinutes: 10, tags: ['roll', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat2._id, name: 'Paneer Cheese Grilled Sandwich', description: 'Jumbo sandwich loaded with cottage cheese & mozzarella', priceInPaise: 5500, isVeg: true, preparationTimeMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat2._id, name: 'Veg Hakka Fried Rice', description: 'Wok tossed fried rice with crunchy veggies & sauce', priceInPaise: 6500, isVeg: true, preparationTimeMinutes: 9, imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat2._id, name: 'Spicy Chilli Chicken Gravy', description: 'Boneless chicken cubes in thick Indo-Chinese sauce', priceInPaise: 11000, isVeg: false, preparationTimeMinutes: 12, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat1._id, name: 'Hot Samosa (2 pcs)', description: 'Crispy potato filled pastries with tamarind chutney', priceInPaise: 3000, isVeg: true, preparationTimeMinutes: 3, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500' }),
    MenuItem.create({ canteenId: canteens[2]._id, collegeId: college._id, categoryId: hiCat1._id, name: 'Kulhad Masala Chai', description: 'Fresh claypot ginger tea with spices', priceInPaise: 1500, isVeg: true, preparationTimeMinutes: 4, imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500' }),
  ]);

  // 4. Hostel K Canteen Categories & Items (10 Items)
  const hkCat1 = await MenuCategory.create({ canteenId: canteens[3]._id, collegeId: college._id, name: 'Burgers, Momos & Pizza', sortOrder: 1 });
  const hkCat2 = await MenuCategory.create({ canteenId: canteens[3]._id, collegeId: college._id, name: 'Fries & Shakes', sortOrder: 2 });

  await Promise.all([
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat1._id, name: 'Super Crispy Veg Burger', description: 'Crispy veg patty with molten cheese & fresh lettuce', priceInPaise: 5000, isVeg: true, preparationTimeMinutes: 8, tags: ['bestseller', 'burger'], imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat1._id, name: 'Double Cheese Chicken Burger', description: 'Grilled chicken patty with double cheddar slice & mayo', priceInPaise: 7500, isVeg: false, preparationTimeMinutes: 10, tags: ['burger', 'chicken'], imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat2._id, name: 'Peri Peri Loaded Fries', description: 'Crispy potato fries tossed in spicy peri peri seasoning', priceInPaise: 6000, isVeg: true, preparationTimeMinutes: 8, tags: ['fries'], imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat1._id, name: 'Steamed Paneer Momos (8 pcs)', description: 'Soft dumplings stuffed with spiced cottage cheese & spicy chutney', priceInPaise: 7000, isVeg: true, preparationTimeMinutes: 10, tags: ['momos'], imageUrl: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat1._id, name: 'Kurkure Chicken Momos (8 pcs)', description: 'Crispy fried chicken momos coated with crunch flour', priceInPaise: 9000, isVeg: false, preparationTimeMinutes: 12, tags: ['momos', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat1._id, name: 'Farmhouse Veg Pizza (8 inch)', description: 'Capsicum, corn, onion & mozzarella cheese on fresh crust', priceInPaise: 13000, isVeg: true, preparationTimeMinutes: 15, tags: ['pizza'], imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat2._id, name: 'White Sauce Italian Pasta', description: 'Penne pasta in rich garlic cream & mushroom sauce', priceInPaise: 9500, isVeg: true, preparationTimeMinutes: 12, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6288924?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat2._id, name: 'Oreo Thick Chocolate Shake', description: 'Blended Belgian chocolate ice cream with crunchy Oreos', priceInPaise: 6500, isVeg: true, preparationTimeMinutes: 5, tags: ['shake', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat2._id, name: 'Cold Coffee with Vanilla Scoop', description: 'Thick espresso blend topped with rich vanilla ice cream', priceInPaise: 6000, isVeg: true, preparationTimeMinutes: 5, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500' }),
    MenuItem.create({ canteenId: canteens[3]._id, collegeId: college._id, categoryId: hkCat2._id, name: 'Crispy Veg Spring Rolls (4 pcs)', description: 'Stuffed vegetable rolls served with sweet chilli dip', priceInPaise: 5500, isVeg: true, preparationTimeMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500' }),
  ]);

  // 5. Hostel F-G Canteen Categories & Items (10 Items)
  const hfgCat1 = await MenuCategory.create({ canteenId: canteens[4]._id, collegeId: college._id, name: 'South Indian Delights', sortOrder: 1 });
  const hfgCat2 = await MenuCategory.create({ canteenId: canteens[4]._id, collegeId: college._id, name: 'Snacks & Beverages', sortOrder: 2 });

  await Promise.all([
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat1._id, name: 'Mysuru Masala Dosa', description: 'Crispy dosa with spicy red garlic chutney filling & sambar', priceInPaise: 6000, isVeg: true, preparationTimeMinutes: 10, tags: ['dosa', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat1._id, name: 'Onion Rava Dosa', description: 'Semolina crisp crepe with roasted onions & green chillies', priceInPaise: 6500, isVeg: true, preparationTimeMinutes: 10, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat1._id, name: 'Steamed Rice Idli (4 pcs)', description: 'Fluffy steamed rice cakes served with fresh coconut chutney', priceInPaise: 4000, isVeg: true, preparationTimeMinutes: 6, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat1._id, name: 'Crispy Medu Vada (2 pcs)', description: 'Lentil fritters served hot with spicy dal sambar', priceInPaise: 4500, isVeg: true, preparationTimeMinutes: 6, imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat2._id, name: 'South Indian Filter Coffee', description: 'Authentic decoction coffee served in brass tumbler', priceInPaise: 2500, isVeg: true, preparationTimeMinutes: 4, tags: ['coffee', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat1._id, name: 'Tangy Lemon Rice', description: 'Tempered basmati rice with mustard, peanuts & curry leaves', priceInPaise: 5000, isVeg: true, preparationTimeMinutes: 7, imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat1._id, name: 'Rava Upma with Chutney', description: 'Roasted semolina cooked with veggies & ghee', priceInPaise: 3500, isVeg: true, preparationTimeMinutes: 6, imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat2._id, name: 'Paneer Butter Paratha', description: 'Tawa paratha stuffed with cottage cheese & butter', priceInPaise: 6000, isVeg: true, preparationTimeMinutes: 10, imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat2._id, name: 'Sweet Almond Badam Milk', description: 'Chilled milk flavoured with saffron & crushed almonds', priceInPaise: 3500, isVeg: true, preparationTimeMinutes: 4, imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500' }),
    MenuItem.create({ canteenId: canteens[4]._id, collegeId: college._id, categoryId: hfgCat2._id, name: 'Crispy Veg Cutlet (2 pcs)', description: 'Deep fried spiced potato & corn patties', priceInPaise: 4000, isVeg: true, preparationTimeMinutes: 6, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500' }),
  ]);

  // 6. Library Café Categories & Items (10 Items)
  const libCat1 = await MenuCategory.create({ canteenId: canteens[6]._id, collegeId: college._id, name: 'Coffee & Artisanal Drinks', sortOrder: 1 });
  const libCat2 = await MenuCategory.create({ canteenId: canteens[6]._id, collegeId: college._id, name: 'Sandwiches & Desserts', sortOrder: 2 });

  await Promise.all([
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat1._id, name: 'Classic Espresso Shot', description: 'Dark roasted Arabica single shot espresso', priceInPaise: 4000, isVeg: true, preparationTimeMinutes: 4, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat1._id, name: 'Hazelnut Cappuccino', description: 'Steamed milk espresso infused with hazelnut syrup', priceInPaise: 6500, isVeg: true, preparationTimeMinutes: 5, tags: ['coffee', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat1._id, name: 'Caramel Iced Macchiato', description: 'Chilled espresso over ice with vanilla & caramel drizzle', priceInPaise: 7500, isVeg: true, preparationTimeMinutes: 5, tags: ['iced-coffee'], imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat2._id, name: 'Cheese Garlic Bread Toast', description: 'Oven baked French bread with herbs & mozzarella cheese', priceInPaise: 5500, isVeg: true, preparationTimeMinutes: 8, tags: ['bestseller'], imageUrl: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat2._id, name: 'Triple Layer Club Sandwich', description: 'Toasted bread filled with veggies, cheese & mayo', priceInPaise: 7000, isVeg: true, preparationTimeMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat2._id, name: 'Sizzling Chocolate Brownie', description: 'Warm fudgy brownie topped with hot fudge syrup', priceInPaise: 6000, isVeg: true, preparationTimeMinutes: 5, tags: ['dessert'], imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat2._id, name: 'Dark Chocolate Glazed Donut', description: 'Freshly baked soft donut dipped in Belgian dark chocolate', priceInPaise: 4500, isVeg: true, preparationTimeMinutes: 3, imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat2._id, name: 'Red Sauce Penne Arrabbiata', description: 'Italian penne pasta in spicy garlic tomato sauce', priceInPaise: 9000, isVeg: true, preparationTimeMinutes: 10, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6288924?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat1._id, name: 'Honey Lemon Green Tea', description: 'Brewed Darjeeling green tea with organic honey & lemon', priceInPaise: 3000, isVeg: true, preparationTimeMinutes: 3, imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500' }),
    MenuItem.create({ canteenId: canteens[6]._id, collegeId: college._id, categoryId: libCat2._id, name: 'Flaky Butter Croissant', description: 'French butter croissant warmed to golden perfection', priceInPaise: 5000, isVeg: true, preparationTimeMinutes: 4, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500' }),
  ]);

  // 7. H1 Hostel Canteen Categories & Items (12 Items)
  const h1Cat1 = await MenuCategory.create({ canteenId: canteens[5]._id, collegeId: college._id, name: 'Hostel Specials & Fast Food', sortOrder: 1 });
  const h1Cat2 = await MenuCategory.create({ canteenId: canteens[5]._id, collegeId: college._id, name: 'Parathas, Maggi & Beverages', sortOrder: 2 });

  await Promise.all([
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat2._id, name: 'H1 Special Cheese Maggi', description: 'Classic 2-minute noodles cooked with cheese & butter', priceInPaise: 4000, isVeg: true, preparationTimeMinutes: 6, tags: ['maggi', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat2._id, name: 'Double Cheese Veg Grill Sandwich', description: 'Crispy grilled white bread filled with potato masala & cheese', priceInPaise: 5000, isVeg: true, preparationTimeMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat2._id, name: 'Aloo Paratha with Butter & Curd (2 pcs)', description: 'Stuffed potato parathas served with green chili pickle', priceInPaise: 5500, isVeg: true, preparationTimeMinutes: 10, tags: ['paratha', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat1._id, name: 'Paneer Butter Masala Roll', description: 'Smoky paneer tikka stuffed inside butter paratha roll', priceInPaise: 7500, isVeg: true, preparationTimeMinutes: 9, tags: ['roll'], imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat1._id, name: 'Chicken Egg Kathi Roll', description: 'Juicy chicken tikka wrapped inside double egg paratha', priceInPaise: 8500, isVeg: false, preparationTimeMinutes: 10, tags: ['roll', 'chicken'], imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat1._id, name: 'Veg Hakka Noodles', description: 'Stir-fried noodles with crunchy cabbage, bell peppers & sauce', priceInPaise: 6000, isVeg: true, preparationTimeMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat1._id, name: 'Chicken Fried Rice', description: 'Chinese fried rice with egg drops & tender chicken bites', priceInPaise: 8500, isVeg: false, preparationTimeMinutes: 10, imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat1._id, name: 'Crispy Samosa (2 pcs)', description: 'Classic spiced potato samosas with tamarind chutney', priceInPaise: 3000, isVeg: true, preparationTimeMinutes: 3, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat2._id, name: 'Kolkata Bread Omlette', description: 'Double egg omlette folded inside toasted white bread', priceInPaise: 4500, isVeg: false, preparationTimeMinutes: 6, imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat2._id, name: 'Chilled Cold Coffee with Ice Cream', description: 'Thick creamy cold coffee topped with vanilla scoop', priceInPaise: 5500, isVeg: true, preparationTimeMinutes: 5, tags: ['coffee', 'bestseller'], imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat2._id, name: 'Kulhad Ginger Tea', description: 'Hot piping ginger tea served in traditional clay cup', priceInPaise: 1500, isVeg: true, preparationTimeMinutes: 4, imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500' }),
    MenuItem.create({ canteenId: canteens[5]._id, collegeId: college._id, categoryId: h1Cat2._id, name: 'Fresh Lime Soda (Sweet & Salt)', description: 'Chilled sparkling soda with fresh lemon juice & mint', priceInPaise: 3500, isVeg: true, preparationTimeMinutes: 4, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500' }),
  ]);

  // Delivery Config
  await DeliveryConfig.create({
    collegeId: college._id,
    tiers: [
      { minOrders: 1, maxOrders: 1, feeInPaise: 2000, label: 'SOLO' },
      { minOrders: 2, maxOrders: 3, feeInPaise: 1500, label: 'SMALL' },
      { minOrders: 4, maxOrders: 99, feeInPaise: 1000, label: 'LARGE' },
    ],
    maxBatchSize: 8,
    groupingWindowMinutes: 15,
    maxWaitMinutes: 20,
  });
};
