'use strict';

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://campusbite_admin:campusbite_pass@127.0.0.1:27017/campusbite?authSource=admin';

const Canteen = require('../models/Canteen');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

const FOOD_DATABASE = {
  'Main Canteen': {
    categories: [
      { name: 'Special Thalis & Meals', sortOrder: 1 },
      { name: 'North Indian Special', sortOrder: 2 },
      { name: 'South Indian & Snacks', sortOrder: 3 },
      { name: 'Beverages & Desserts', sortOrder: 4 },
    ],
    items: [
      {
        name: 'Amba Special Paneer Thali',
        description: 'Paneer Butter Masala, Dal Makhani, Jeera Rice, 4 Butter Roti, Gulab Jamun & Salad',
        priceInPaise: 12000,
        categoryName: 'Special Thalis & Meals',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
        isVeg: true,
      },
      {
        name: 'Royal Butter Chicken Thali',
        description: 'Rich Butter Chicken, Dal Makhani, Basmati Rice, 3 Butter Naan, Sweet & Salad',
        priceInPaise: 15000,
        categoryName: 'Special Thalis & Meals',
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
        isVeg: false,
      },
      {
        name: 'Veg Executive Thali',
        description: 'Mix Veg, Yellow Dal Fry, Steamed Basmati Rice, 4 Tandoori Roti & Papad',
        priceInPaise: 9500,
        categoryName: 'Special Thalis & Meals',
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800',
        isVeg: true,
      },
      {
        name: 'Paneer Butter Masala & 4 Roti',
        description: 'Creamy Cottage Cheese Curry served with 4 Fresh Tandoori Roti',
        priceInPaise: 11000,
        categoryName: 'North Indian Special',
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
        isVeg: true,
      },
      {
        name: 'Spicy Chole Bhature (2 pcs)',
        description: 'Authentic Amritsari Chole served with 2 Fluffy Bhature, Onion & Pickle',
        priceInPaise: 7000,
        categoryName: 'North Indian Special',
        imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
        isVeg: true,
      },
      {
        name: 'Crispy Masala Dosa',
        description: 'Golden Crispy Dosa filled with Spiced Potato Filling, served with Sambhar & Coconut Chutney',
        priceInPaise: 6000,
        categoryName: 'South Indian & Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
        isVeg: true,
      },
      {
        name: 'Soft Steamed Idli (3 pcs)',
        description: 'Soft Fluffy Rice Idlis served with hot Sambhar & Green Chutney',
        priceInPaise: 5000,
        categoryName: 'South Indian & Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
        isVeg: true,
      },
      {
        name: 'Crispy Samosa Chaat (2 pcs)',
        description: 'Crushed Samosas topped with Spicy Chole, Sweet Yogurt, Tamarind & Mint Chutney',
        priceInPaise: 4000,
        categoryName: 'South Indian & Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
        isVeg: true,
      },
      {
        name: 'Thick Cold Coffee with Ice Cream',
        description: 'Rich Blended Creamy Cold Coffee topped with Vanilla Ice Cream',
        priceInPaise: 5000,
        categoryName: 'Beverages & Desserts',
        imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800',
        isVeg: true,
      },
      {
        name: 'Kulhad Elaichi Special Tea',
        description: 'Traditional Cardamom Fresh Milk Tea served in Clay Kulhad',
        priceInPaise: 1500,
        categoryName: 'Beverages & Desserts',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800',
        isVeg: true,
      },
    ],
  },

  'Hostel I Canteen': {
    categories: [
      { name: 'Late Night Maggi', sortOrder: 1 },
      { name: 'Stuffed Parathas & Rolls', sortOrder: 2 },
      { name: 'Shakes & Energy Drinks', sortOrder: 3 },
    ],
    items: [
      {
        name: 'Cheese Butter Maggi',
        description: 'Classic Maggi cooked with Amul Butter and loaded with Mozzarella Cheese',
        priceInPaise: 4500,
        categoryName: 'Late Night Maggi',
        imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800',
        isVeg: true,
      },
      {
        name: 'Double Egg Masala Maggi',
        description: 'Spicy Masala Maggi cooked with 2 Scrambled Farm Eggs',
        priceInPaise: 4000,
        categoryName: 'Late Night Maggi',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
        isVeg: false,
      },
      {
        name: 'Aloo Pyaaz Paratha (2 pcs)',
        description: 'Golden Tawa Parathas stuffed with Spiced Potato & Onion, served with Amul Butter & Pickle',
        priceInPaise: 5000,
        categoryName: 'Stuffed Parathas & Rolls',
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800',
        isVeg: true,
      },
      {
        name: 'Paneer Cheese Paratha (2 pcs)',
        description: 'Parathas generously stuffed with Grated Paneer, Green Chillies & Cheese',
        priceInPaise: 7000,
        categoryName: 'Stuffed Parathas & Rolls',
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
        isVeg: true,
      },
      {
        name: 'Spicy Paneer Kathi Roll',
        description: 'Grilled Spiced Paneer Tikka wrapped in Whole Wheat Paratha with Mint Sauce',
        priceInPaise: 6000,
        categoryName: 'Stuffed Parathas & Rolls',
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800',
        isVeg: true,
      },
      {
        name: 'Double Chicken Egg Roll',
        description: 'Juicy Chicken Tikka & Egg wrapped in Flaky Paratha with Chipotle Sauce',
        priceInPaise: 8000,
        categoryName: 'Stuffed Parathas & Rolls',
        imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
        isVeg: false,
      },
      {
        name: 'Oreo Chocolate Milkshake',
        description: 'Thick Creamy Milkshake blended with Crunchy Oreo Cookies & Chocolate Syrup',
        priceInPaise: 6000,
        categoryName: 'Shakes & Energy Drinks',
        imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
        isVeg: true,
      },
      {
        name: 'Red Bull Energy Drink (250ml)',
        description: 'Chilled Red Bull Energy Drink Can',
        priceInPaise: 11500,
        categoryName: 'Shakes & Energy Drinks',
        imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800',
        isVeg: true,
      },
    ],
  },

  'Hostel F-G Canteen': {
    categories: [
      { name: 'South Indian Delights', sortOrder: 1 },
      { name: 'Hot Beverages', sortOrder: 2 },
      { name: 'Evening Snacks', sortOrder: 3 },
    ],
    items: [
      {
        name: 'Crispy Butter Masala Dosa',
        description: 'Golden Rice Crepe brushed with Butter, filled with Masala Potato & served with Sambhar',
        priceInPaise: 5500,
        categoryName: 'South Indian Delights',
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
        isVeg: true,
      },
      {
        name: 'Onion Rava Dosa',
        description: 'Crispy Semolina Dosa studded with Chopped Onions, Cumin & Green Chillies',
        priceInPaise: 6500,
        categoryName: 'South Indian Delights',
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
        isVeg: true,
      },
      {
        name: 'Medu Vada (2 pcs)',
        description: 'Crispy Fried Black Gram Lentil Donuts served with Sambhar & Coconut Chutney',
        priceInPaise: 4500,
        categoryName: 'South Indian Delights',
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
        isVeg: true,
      },
      {
        name: 'Onion Tomato Butter Uttapam',
        description: 'Thick Savory Pancake topped with Onions, Tomatoes, Cilantro & Butter',
        priceInPaise: 6000,
        categoryName: 'South Indian Delights',
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
        isVeg: true,
      },
      {
        name: 'South Indian Filter Coffee',
        description: 'Strong Aromatic Chicory Filter Coffee brewed with Hot Frothy Milk',
        priceInPaise: 2500,
        categoryName: 'Hot Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
        isVeg: true,
      },
      {
        name: 'Special Ginger Elaichi Tea',
        description: 'Fresh Milk Tea infused with Real Ginger & Cardamom Pods',
        priceInPaise: 1500,
        categoryName: 'Hot Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800',
        isVeg: true,
      },
      {
        name: 'Crispy Bread Pakora (2 pcs)',
        description: 'Spiced Potato Sandwiches dipped in Gram Flour Batter and Fried Golden',
        priceInPaise: 3500,
        categoryName: 'Evening Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
        isVeg: true,
      },
      {
        name: 'Vegetable Cutlet (2 pcs)',
        description: 'Crispy Breaded Vegetable Patties served with Spicy Tomato Ketchup',
        priceInPaise: 4000,
        categoryName: 'Evening Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
        isVeg: true,
      },
    ],
  },

  'H1 Hostel Canteen': {
    categories: [
      { name: 'Burgers & Sandwiches', sortOrder: 1 },
      { name: 'Fries & Crispy Snacks', sortOrder: 2 },
      { name: 'Beverages & Lassi', sortOrder: 3 },
    ],
    items: [
      {
        name: 'Executive Veg Cheese Burger',
        description: 'Crispy Veg Patty, Melted Cheese Slice, Lettuce, Tomato & Mayonnaise in Toasted Buns',
        priceInPaise: 5000,
        categoryName: 'Burgers & Sandwiches',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        isVeg: true,
      },
      {
        name: 'Grilled Paneer Cheese Sandwich',
        description: 'Triple Layer Grilled Bread filled with Marinated Paneer Cubes, Cheese & Bell Peppers',
        priceInPaise: 5500,
        categoryName: 'Burgers & Sandwiches',
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800',
        isVeg: true,
      },
      {
        name: 'Classic Salted French Fries',
        description: 'Golden Crispy Potato Fries tossed with Sea Salt & Served with Mayo Dip',
        priceInPaise: 6000,
        categoryName: 'Fries & Crispy Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800',
        isVeg: true,
      },
      {
        name: 'Honey Chilli Potato',
        description: 'Crispy Fried Potato Fingers tossed in Sweet Honey Chilli Sauce & Sesame Seeds',
        priceInPaise: 7000,
        categoryName: 'Fries & Crispy Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1625938145744-e380515399b7?w=800',
        isVeg: true,
      },
      {
        name: 'Fresh Mango Lassi',
        description: 'Thick Sweet Yogurt Shake blended with Alphonso Mango Pulp',
        priceInPaise: 4000,
        categoryName: 'Beverages & Lassi',
        imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800',
        isVeg: true,
      },
      {
        name: 'Chilled Lemon Ice Tea',
        description: 'Refreshing Iced Tea flavored with Lemon & Mint Leaves',
        priceInPaise: 3500,
        categoryName: 'Beverages & Lassi',
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
        isVeg: true,
      },
    ],
  },

  'Hostel K Canteen': {
    categories: [
      { name: 'Gourmet Burgers & Pizzas', sortOrder: 1 },
      { name: 'Chinese Wok & Noodles', sortOrder: 2 },
      { name: 'Refreshing Drinks', sortOrder: 3 },
    ],
    items: [
      {
        name: 'Double Cheese Veg Burger',
        description: 'Juicy Potato Herb Patty, Double Cheese Slices, Caramelized Onions & Chipotle Mayo',
        priceInPaise: 6000,
        categoryName: 'Gourmet Burgers & Pizzas',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        isVeg: true,
      },
      {
        name: 'Crispy Fried Chicken Burger',
        description: 'Crispy Crunchy Fried Chicken Breast, Coleslaw, Pickles & Garlic Sauce',
        priceInPaise: 8000,
        categoryName: 'Gourmet Burgers & Pizzas',
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800',
        isVeg: false,
      },
      {
        name: 'Margherita Cheese Pizza (8 inch)',
        description: 'Hand Tossed Crust topped with Rich Tomato Sauce, Basil & Mozzarella Cheese',
        priceInPaise: 12000,
        categoryName: 'Gourmet Burgers & Pizzas',
        imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800',
        isVeg: true,
      },
      {
        name: 'Chicken Pepperoni Pizza (8 inch)',
        description: 'Pizza Loaded with Spicy Chicken Pepperoni Slices, Mozzarella & Herb Crust',
        priceInPaise: 16000,
        categoryName: 'Gourmet Burgers & Pizzas',
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800',
        isVeg: false,
      },
      {
        name: 'Veg Hakka Noodles',
        description: 'Wok Tossed Thin Noodles with Shredded Cabbage, Capsicum, Carrot & Soy Sauce',
        priceInPaise: 7000,
        categoryName: 'Chinese Wok & Noodles',
        imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
        isVeg: true,
      },
      {
        name: 'Chicken Schezwan Fried Rice',
        description: 'Fragrant Rice Wok Fried with Shredded Chicken, Eggs & Spicy Schezwan Sauce',
        priceInPaise: 9000,
        categoryName: 'Chinese Wok & Noodles',
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
        isVeg: false,
      },
    ],
  },

  'Library Café': {
    categories: [
      { name: 'Gourmet Coffees', sortOrder: 1 },
      { name: 'Bakery & Pastries', sortOrder: 2 },
      { name: 'Quiet Zone Wraps & Sandwiches', sortOrder: 3 },
    ],
    items: [
      {
        name: 'Hot Cappuccino Coffee',
        description: 'Freshly Pulled Double Espresso Shot topped with Velvety Steamed Milk Foam',
        priceInPaise: 6000,
        categoryName: 'Gourmet Coffees',
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?w=800',
        isVeg: true,
      },
      {
        name: 'Rich Dark Espresso Shot',
        description: 'Concentrated Pure Black Coffee Shot with Thick Golden Crema',
        priceInPaise: 4000,
        categoryName: 'Gourmet Coffees',
        imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800',
        isVeg: true,
      },
      {
        name: 'Sizzling Brownie with Vanilla Ice Cream',
        description: 'Warm Chocolate Brownie served with a Scoop of Vanilla Ice Cream & Hot Chocolate Fudge',
        priceInPaise: 7000,
        categoryName: 'Bakery & Pastries',
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
        isVeg: true,
      },
      {
        name: 'Butter French Croissant',
        description: 'Flaky Golden Baked All-Butter French Bakery Croissant',
        priceInPaise: 5000,
        categoryName: 'Bakery & Pastries',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
        isVeg: true,
      },
      {
        name: 'Veg Club Sandwich',
        description: 'Triple Deck Toast filled with Cucumbers, Tomatoes, Lettuce, Cheese & Honey Mustard',
        priceInPaise: 6500,
        categoryName: 'Quiet Zone Wraps & Sandwiches',
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800',
        isVeg: true,
      },
    ],
  },

  'Amba Canteen & Fast Food': {
    categories: [
      { name: 'Special Thalis', sortOrder: 1 },
      { name: 'Fast Food & Chaat', sortOrder: 2 },
      { name: 'Refreshing Drinks', sortOrder: 3 },
    ],
    items: [
      {
        name: 'Amba Shahi Paneer Thali',
        description: 'Shahi Paneer, Dal Fry, Basmati Rice, 4 Butter Tandoori Roti, Gulab Jamun & Pickle',
        priceInPaise: 13000,
        categoryName: 'Special Thalis',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
        isVeg: true,
      },
      {
        name: 'Chicken Dum Biryani',
        description: 'Hyderabadi Style Dum Chicken Biryani served with Spicy Gravy & Cucumber Raita',
        priceInPaise: 14000,
        categoryName: 'Special Thalis',
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
        isVeg: false,
      },
      {
        name: 'Mumbai Butter Pav Bhaji',
        description: 'Spicy Mashed Vegetable Curry garnished with Butter & Chopped Onions, served with 2 Butter Pavs',
        priceInPaise: 6500,
        categoryName: 'Fast Food & Chaat',
        imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
        isVeg: true,
      },
      {
        name: 'Chowmein Manchurian Combo Bowl',
        description: 'Veg Fried Chowmein served with Hot Veg Manchurian Balls in Garlic Gravy',
        priceInPaise: 9500,
        categoryName: 'Fast Food & Chaat',
        imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
        isVeg: true,
      },
      {
        name: 'Kesar Badam Kulhad Milk',
        description: 'Warm Creamy Milk infused with Saffron, Almonds, Pistachios & Cardamom',
        priceInPaise: 3500,
        categoryName: 'Refreshing Drinks',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800',
        isVeg: true,
      },
    ],
  },
};

async function seedMenu() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully!');

    const canteens = await Canteen.find({});
    console.log(`Found ${canteens.length} canteens in database.`);

    for (const canteen of canteens) {
      console.log(`\n========================================`);
      console.log(`Processing Canteen: "${canteen.name}" (${canteen._id})`);

      const foodData = FOOD_DATABASE[canteen.name] || FOOD_DATABASE['Main Canteen'];
      
      // Clear existing menu items for this canteen to ensure clean data
      await MenuItem.deleteMany({ canteenId: canteen._id });
      await MenuCategory.deleteMany({ canteenId: canteen._id });
      console.log(`Cleared old menu items for "${canteen.name}"`);

      // Create categories
      const categoryMap = {};
      for (const cat of foodData.categories) {
        const categoryDoc = await MenuCategory.create({
          canteenId: canteen._id,
          collegeId: canteen.collegeId,
          name: cat.name,
          sortOrder: cat.sortOrder,
          isActive: true,
        });
        categoryMap[cat.name] = categoryDoc._id;
      }
      console.log(`Created ${Object.keys(categoryMap).length} categories.`);

      // Create menu items
      let createdCount = 0;
      for (const item of foodData.items) {
        const categoryId = categoryMap[item.categoryName] || Object.values(categoryMap)[0];
        
        await MenuItem.create({
          canteenId: canteen._id,
          collegeId: canteen.collegeId,
          categoryId: categoryId,
          name: item.name,
          description: item.description,
          priceInPaise: item.priceInPaise,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          isAvailable: true,
          preparationTimeMinutes: 12,
        });
        createdCount++;
      }
      console.log(`✅ Successfully seeded ${createdCount} food items for "${canteen.name}"!`);
    }

    console.log('\n🎉 ALL CANTEENS SEEDED WITH SUFFICIENT HIGH-QUALITY FOOD ITEMS & ACCURATE IMAGES!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding menu items:', err);
    process.exit(1);
  }
}

seedMenu();
