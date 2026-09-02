import {
  Apple, Banknote, Bike, BookOpen, BriefcaseBusiness, Building2, Bus, Cake, Camera, Car, Baby,
  Circle, Coffee, CreditCard, Droplets, Dumbbell, Factory, Film, Fish, Fuel, Gamepad2,
  Gift, GraduationCap, Hammer, HandCoins, HeartPulse, Hospital, House, KeyRound, Laptop, Lightbulb,
  Martini, Megaphone, Monitor, Music, Package, PawPrint, Pizza, Plane, Receipt, Rocket,
  Scissors, Send, ShieldCheck, ShoppingBag, ShoppingCart, Shirt, Smartphone, Stethoscope,
  Store, Train, TreePine, Tv, Utensils, Wallet, Wifi, Wine, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  circle: Circle, briefcase: BriefcaseBusiness, wallet: Wallet, gift: Gift, utensils: Utensils, baby: Baby,
  house: House, car: Car, wine: Wine, banknote: Banknote, coffee: Coffee, shopping: ShoppingBag,
  health: HeartPulse, sport: Dumbbell, travel: Plane, phone: Smartphone, entertainment: Tv,
  music: Music, education: GraduationCap, clothing: Shirt, pets: PawPrint, bus: Bus, fuel: Fuel,
  games: Gamepad2, tools: Wrench, apple: Apple, bike: Bike, books: BookOpen, building: Building2,
  cake: Cake, camera: Camera, card: CreditCard, water: Droplets, factory: Factory, film: Film,
  fish: Fish, hammer: Hammer, coins: HandCoins, hospital: Hospital, key: KeyRound, laptop: Laptop,
  electricity: Zap, announcement: Megaphone, monitor: Monitor, cocktail: Martini, package: Package,
  pizza: Pizza, receipt: Receipt, rocket: Rocket, scissors: Scissors, send: Send, security: ShieldCheck,
  cart: ShoppingCart, doctor: Stethoscope, store: Store, train: Train, nature: TreePine, wifi: Wifi,
  light: Lightbulb,
};

export function CategoryIcon({ name, color, size = 18 }: { name?: string; color?: string; size?: number }) {
  const Icon = (name && iconMap[name]) || Circle;
  return <Icon size={size} strokeWidth={2.2} style={{ color: color || '#64748b' }} />;
}
