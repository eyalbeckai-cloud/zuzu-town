// "Hidden surprises": light goals layered on top of free play.
// Each location has 8 discoveries; finding one awards a star sticker in the album.

export type DEv =
  | { t: 'place'; item: string; on: string; pose: string }
  | { t: 'feed'; who: string; food: string }
  | { t: 'wear'; who: string; item: string }
  | { t: 'hold'; who: string; item: string }
  | { t: 'brush'; who: string; item: string }
  | { t: 'heal'; who: string; item: string }
  | { t: 'tap'; def: string; on?: boolean }
  | { t: 'spawn'; from: string; item: string }
  | { t: 'cook'; to: string };

export interface Discovery {
  id: string;
  loc: string;
  icon: string;
  en: string;
  he: string;
  test: (e: DEv) => boolean;
}

const isChar = (w: string) => w.startsWith('char:');
const isBaby = (w: string) => w === 'char:baby' || w.endsWith(':baby');

const D = (loc: string, id: string, icon: string, en: string, he: string, test: (e: DEv) => boolean): Discovery =>
  ({ id: loc + '.' + id, loc, icon, en, he, test });

export const DISCOVERIES: Discovery[] = [
  // home
  D('home', 'tv', '📺', 'Watch TV', 'לראות טלוויזיה', (e) => e.t === 'tap' && e.def === 'tv' && !!e.on),
  D('home', 'dance', '💃', 'Dance party', 'מסיבת ריקודים', (e) => e.t === 'tap' && e.def === 'radio' && !!e.on),
  D('home', 'egg', '🍳', 'Fry an egg', 'לטגן ביצה', (e) => e.t === 'cook' && e.to === 'friedEgg'),
  D('home', 'pancake', '🥞', 'Make pancakes', 'להכין פנקייק', (e) => e.t === 'cook' && e.to === 'pancake'),
  D('home', 'baby', '🍼', 'Feed the baby', 'להאכיל את התינוק', (e) => e.t === 'feed' && isBaby(e.who)),
  D('home', 'cat', '🐱', 'Snack for the cat', 'חטיף לחתול', (e) => e.t === 'feed' && e.who === 'pet:cat'),
  D('home', 'night', '🌙', 'Lights out', 'לכבות את האור', (e) => e.t === 'tap' && e.def === 'lightswitch' && e.on === false),
  D('home', 'cookie', '🍪', 'Cookie jar', 'צנצנת העוגיות', (e) => e.t === 'spawn' && e.from === 'cookiejar'),
  // bedroom
  D('bedroom', 'sleep', '😴', 'Bedtime', 'לילה טוב', (e) => e.t === 'place' && e.pose === 'lie' && isChar(e.item)),
  D('bedroom', 'bath', '🛁', 'Bubble bath', 'אמבטיית קצף', (e) => e.t === 'place' && e.pose === 'bath' && isChar(e.item)),
  D('bedroom', 'duck', '🦆', 'Rubber duck', 'ברווז באמבטיה', (e) => e.t === 'place' && e.on === 'bathtub' && e.item === 'duck'),
  D('bedroom', 'flush', '🚽', 'Flush!', 'להוריד את המים', (e) => e.t === 'tap' && e.def === 'toilet'),
  D('bedroom', 'crown', '👑', 'Royal crown', 'כתר מלכותי', (e) => e.t === 'wear' && e.item === 'crown'),
  D('bedroom', 'teeth', '✨', 'Brush teeth', 'לצחצח שיניים', (e) => e.t === 'brush' && e.item === 'toothbrush' && isChar(e.who)),
  D('bedroom', 'toys', '🧸', 'Toy box', 'ארגז הצעצועים', (e) => e.t === 'spawn' && e.from === 'toybox'),
  D('bedroom', 'dog', '🐶', 'Doggy nap', 'הכלב הולך לישון', (e) => e.t === 'place' && e.pose === 'lie' && e.item === 'pet:dog'),
  // park
  D('park', 'swing', '🎠', 'Swing high', 'להתנדנד', (e) => e.t === 'place' && e.pose === 'swing'),
  D('park', 'slide', '🎢', 'Down the slide', 'לגלוש במגלשה', (e) => e.t === 'place' && e.pose === 'slide'),
  D('park', 'icecream', '🍦', 'Ice cream!', 'גלידה!', (e) => e.t === 'spawn' && e.from === 'icecart'),
  D('park', 'apple', '🍎', 'Shake the tree', 'לנער את העץ', (e) => e.t === 'spawn' && e.from === 'appletree'),
  D('park', 'sand', '🏖️', 'Sandbox fun', 'משחק בארגז החול', (e) => e.t === 'place' && e.on === 'sandbox'),
  D('park', 'fountain', '⛲', 'Fountain', 'מזרקה', (e) => e.t === 'tap' && e.def === 'fountain'),
  D('park', 'bunny', '🐰', 'Feed the bunny', 'להאכיל את הארנב', (e) => e.t === 'feed' && e.who === 'pet:bunny'),
  D('park', 'flower', '🌸', 'Give a flower', 'לתת פרח', (e) => e.t === 'hold' && e.item === 'flower'),
  // bakery
  D('bakery', 'bread', '🍞', 'Bake bread', 'לאפות לחם', (e) => e.t === 'cook' && e.to === 'bread'),
  D('bakery', 'cake', '🍰', 'Bake a cake', 'לאפות עוגה', (e) => e.t === 'cook' && e.to === 'cakeSlice'),
  D('bakery', 'mix', '🥣', 'Mix the dough', 'ללוש בצק', (e) => e.t === 'spawn' && e.from === 'worktable'),
  D('bakery', 'coffee', '☕', 'Coffee time', 'הפסקת קפה', (e) => e.t === 'spawn' && e.from === 'coffeemachine'),
  D('bakery', 'register', '💰', 'Ka-ching!', 'קופה רושמת', (e) => e.t === 'tap' && e.def === 'register'),
  D('bakery', 'croissant', '🥐', 'Fresh croissant', 'קרואסון טרי', (e) => e.t === 'feed' && e.food === 'croissant'),
  D('bakery', 'serve', '🍽️', 'Serve a table', 'להגיש לשולחן', (e) => e.t === 'place' && e.on === 'cafetable'),
  D('bakery', 'cat', '🐈', 'Treat for the cat', 'פינוק לחתול', (e) => e.t === 'feed' && e.who === 'pet:cat'),
  // vet
  D('vet', 'xray', '🦴', 'X-ray', 'צילום רנטגן', (e) => e.t === 'tap' && e.def === 'xray'),
  D('vet', 'scale', '⚖️', 'Weigh a pet', 'לשקול חיה', (e) => e.t === 'place' && e.on === 'petscale' && e.item.startsWith('pet:')),
  D('vet', 'petbath', '🧼', 'Pet bath', 'אמבטיה לחיה', (e) => e.t === 'place' && e.on === 'petbath' && e.item.startsWith('pet:')),
  D('vet', 'heal', '💊', 'Make a pet better', 'לרפא חיה', (e) => e.t === 'heal'),
  D('vet', 'bell', '🔔', 'Ring the bell', 'לצלצל בפעמון', (e) => e.t === 'tap' && e.def === 'bell'),
  D('vet', 'nap', '💤', 'Pet nap', 'תנומה לחיה', (e) => e.t === 'place' && e.on === 'petbed'),
  D('vet', 'exam', '🏥', 'Check-up', 'בדיקה אצל הווטרינרית', (e) => e.t === 'place' && e.on === 'examtable' && e.item.startsWith('pet:')),
  D('vet', 'hamster', '🐹', 'Feed the hamster', 'להאכיל את האוגר', (e) => e.t === 'feed' && e.who === 'pet:hamster'),
  // supermarket
  D('market', 'cart', '🛒', 'Fill the cart', 'למלא את העגלה', (e) => e.t === 'place' && e.on === 'cart' && !e.item.startsWith('char:') && !e.item.startsWith('pet:')),
  D('market', 'ride', '🚗', 'Cart ride', 'נסיעה בעגלה', (e) => e.t === 'place' && e.on === 'cart' && e.item.startsWith('char:')),
  D('market', 'pay', '💳', 'Pay at checkout', 'משלמים בקופה', (e) => e.t === 'tap' && e.def === 'register'),
  D('market', 'scan', '🔊', 'Beep! Scan it', 'ביפ! סורקים', (e) => e.t === 'tap' && e.def === 'checkout'),
  D('market', 'weigh', '⚖️', 'Weigh the fruit', 'לשקול פירות', (e) => e.t === 'place' && e.on === 'fruitscale'),
  D('market', 'freezer', '🧊', 'Freezer', 'המקפיא', (e) => e.t === 'tap' && e.def === 'freezer'),
  D('market', 'candy', '🍭', 'Candy machine', 'מכונת סוכריות', (e) => e.t === 'spawn' && e.from === 'candymachine'),
  D('market', 'icecream', '🍨', 'Ice cream treat', 'פינוק גלידה', (e) => e.t === 'feed' && e.food === 'icecream'),
];

export const discoveriesFor = (loc: string) => DISCOVERIES.filter((d) => d.loc === loc);

export const flagKey = (d: Discovery) => 'd:' + d.id;
