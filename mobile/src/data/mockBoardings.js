export const NEAR_LOCATION_BOARDINGS = [
  {
    id: "n1",
    title: "Cozy Room in Colombo 03",
    location: "Kollupitiya, Colombo 03",
    price: 15000,
    pricePeriod: "month",
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    isSaved: true
  },
  {
    id: "n2",
    title: "Modern Annex in Nugegoda",
    location: "Nugegoda",
    price: 18500,
    pricePeriod: "month",
    imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    isSaved: false
  },
  {
    id: "n3",
    title: "Studio Room in Bambalapitiya",
    location: "Colombo 04",
    price: 24000,
    pricePeriod: "month",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    isSaved: false
  }
];

export const POPULAR_BOARDINGS = [
  {
    id: "p1",
    title: "Green Valley Boarding",
    location: "Moratuwa",
    price: 15000,
    pricePeriod: "month",
    rating: 4.8,
    reviewsCount: 24,
    genderPreference: "Girls Only",
    tags: ["Girls Only", "Meals Incl."],
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    amenities: ["Wi-Fi", "Attached Bath", "Study Desk", "3 Meals Daily"],
    description: "Peaceful environment for female students and workers in Moratuwa. 5 mins walk to bus stand.",
    ownerName: "Sunethra Silva",
    ownerPhone: "+94 77 123 4567"
  },
  {
    id: "p2",
    title: "Sunrise Apartments",
    location: "Dehiwala",
    price: 22000,
    pricePeriod: "month",
    rating: 4.5,
    reviewsCount: 18,
    genderPreference: "Any",
    tags: ["Attached Bath", "AC Available"],
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    amenities: ["AC Available", "Attached Bath", "Kitchenette", "Hot Water"],
    description: "Modern furnished studio apartments in Dehiwala close to Galle Road.",
    ownerName: "Kamal Fernando",
    ownerPhone: "+94 71 987 6543"
  },
  {
    id: "p3",
    title: "Royal Campus Haven",
    location: "Katubedda, Moratuwa",
    price: 18000,
    pricePeriod: "month",
    rating: 4.9,
    reviewsCount: 31,
    genderPreference: "Boys Only",
    tags: ["Boys Only", "Wi-Fi Incl."],
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    amenities: ["High-speed Wi-Fi", "Study Area", "Parking", "Water Filter"],
    description: "Ideal boarding place for University of Moratuwa undergraduates. 300m to main gate.",
    ownerName: "Nimal Perera",
    ownerPhone: "+94 75 444 3322"
  }
];

export const MOCK_BOARDINGS = [...POPULAR_BOARDINGS];
