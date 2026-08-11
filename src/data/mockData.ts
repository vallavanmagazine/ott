export type Genre =
  | 'Environment'
  | 'Wildlife'
  | 'History'
  | 'Science'
  | 'Society'
  | 'Investigation'
  | 'Education'
  | 'Culture'
  | 'Motivation'
  | 'Success Stories'
  | 'Life Lessons'
  | 'Changemakers'
  | 'Youth Voices';

export const genreColors: Record<string, string> = {
  Environment: '#2E7D32',
  Wildlife: '#6D4C41',
  History: '#8D6E63',
  Science: '#1565C0',
  Society: '#6A1B9A',
  Investigation: '#C62828',
  Education: '#00838F',
  Culture: '#AD1457',
  Motivation: '#EF6C00',
  'Success Stories': '#F9A825',
  'Life Lessons': '#00897B',
  Changemakers: '#283593',
  'Youth Voices': '#E53935',
};

export interface Documentary {
  id: string;
  title: string;
  titleTa: string;
  genre: Genre;
  duration: string;
  durationSec: number;
  poster: string;
  backdrop: string;
  year: number;
  language: string;
  synopsis: string;
  synopsisTa: string;
  badge?: string;
  progress?: number;
  exclusive?: boolean;
  director?: string;
  cast?: string[];
}

export interface InspireItem {
  id: string;
  title: string;
  titleTa: string;
  category: string;
  duration: string;
  poster: string;
  quote?: string;
  attribution?: string;
  badge?: string;
}

export interface LiveSlot {
  id: string;
  time: string;
  time24: string;
  title: string;
  titleTa: string;
  duration: string;
  thumb: string;
  isLive?: boolean;
  description: string;
}

export interface AdContent {
  id: string;
  sponsor: string;
  sponsorLogo: string;
  headline: string;
  body: string;
  cta: string;
  bgImage: string;
  accent: string;
}

const px = (id: string, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const documentaries: Documentary[] = [
  {
    id: 'd1',
    title: 'The Last Mangroves',
    titleTa: 'கடைசி சதுப்பு நிலங்கள்',
    genre: 'Environment',
    duration: '24:18',
    durationSec: 1458,
    poster: px('30004134'),
    backdrop: px('30004134', 1280),
    year: 2024,
    language: 'Tamil',
    synopsis: 'A deep dive into the vanishing mangrove forests of the Tamil Nadu coast and the fisherfolk fighting to save them.',
    synopsisTa: 'தமிழக கடற்கரையில் அழிந்து வரும் சதுப்பு நிலங்கள் மற்றும் அவற்றைக் காப்பாற்ற போராடும் மீனவர்கள் பற்றிய ஆழமான பார்வை.',
    badge: 'FEATURED',
    director: 'Karthik Raman',
    cast: ['M. Selvan', 'Lakshmi Rao'],
  },
  {
    id: 'd2',
    title: 'Tigers of Anamalai',
    titleTa: 'ஆனைமலை புலிகள்',
    genre: 'Wildlife',
    duration: '32:45',
    durationSec: 1965,
    poster: px('17374833'),
    backdrop: px('17374833', 1280),
    year: 2024,
    language: 'Tamil',
    synopsis: 'Tracking the elusive Bengal tigers through the misty hills of the Anamalai Tiger Reserve.',
    synopsisTa: 'ஆனைமலை புலி காப்பகத்தின் மூடுபனி மலைகளில் மறைந்திருக்கும் பெங்கால் புலிகளைத் தேடி.',
    badge: 'NEW',
  },
  {
    id: 'd3',
    title: 'Pandya Kingdoms',
    titleTa: 'பாண்டிய பேரரசு',
    genre: 'History',
    duration: '41:02',
    durationSec: 2462,
    poster: px('31969428'),
    backdrop: px('31969428', 1280),
    year: 2023,
    language: 'Tamil',
    synopsis: 'The rise and fall of the Pandya dynasty — temples, trade, and the lost glory of Madurai.',
    synopsisTa: 'பாண்டிய அரசின் எழுச்சியும் வீழ்ச்சியும் — கோயில்கள், வர்த்தகம், மதுரையின் இழந்த பெருமை.',
    exclusive: true,
  },
  {
    id: 'd4',
    title: 'Signals From Space',
    titleTa: 'விண்வெளி சமிக்ஞைகள்',
    genre: 'Science',
    duration: '28:30',
    durationSec: 1710,
    poster: px('6325002'),
    backdrop: px('6325002', 1280),
    year: 2024,
    language: 'English',
    synopsis: 'How ISRO scientists in Tamil Nadu track deep-space signals from the Mangalyaan mission.',
    synopsisTa: 'இஸ்ரோ விஞ்ஞானிகள் மங்கல்யானில் இருந்து வரும் ஆழ்வெளி சமிக்ஞைகளை எப்படி கண்காணிக்கிறார்கள்.',
    badge: 'NEW',
  },
  {
    id: 'd5',
    title: 'The Rice Crisis',
    titleTa: 'நெல் நெருக்கடி',
    genre: 'Society',
    duration: '19:55',
    durationSec: 1195,
    poster: px('20212135'),
    backdrop: px('20212135', 1280),
    year: 2024,
    language: 'Tamil',
    synopsis: 'Farmers of the Cauvery delta battle climate change and debt in a changing agricultural landscape.',
    synopsisTa: 'காவிரி டெல்டா விவசாயிகள் காலநிலை மாற்றம் மற்றும் கடனுக்கு எதிராக போராடுதல்.',
    progress: 0.42,
  },
  {
    id: 'd6',
    title: 'Temple Architecture',
    titleTa: 'கோயில் கட்டிடக்கலை',
    genre: 'Culture',
    duration: '36:12',
    durationSec: 2172,
    poster: px('5103732'),
    backdrop: px('5103732', 1280),
    year: 2023,
    language: 'Tamil',
    synopsis: 'The engineering marvels behind Chola temple construction, decoded by modern architects.',
    synopsisTa: 'சோழர் கோயில் கட்டுமானத்தின் பொறியியல் அதிசயங்கள்.',
    exclusive: true,
  },
  {
    id: 'd7',
    title: 'Coastal Erosion',
    titleTa: 'கடல் அரிப்பு',
    genre: 'Investigation',
    duration: '22:40',
    durationSec: 1360,
    poster: px('13519711'),
    backdrop: px('13519711', 1280),
    year: 2024,
    language: 'Tamil',
    synopsis: "An investigative look at illegal sand mining and its devastating effect on Tamil Nadu's coastline.",
    synopsisTa: 'சட்டவிரோத மணல் அகழ்வு மற்றும் தமிழக கடற்கரையில் அதன் அழிவு விளைவுகள்.',
    badge: 'NEW',
  },
  {
    id: 'd8',
    title: 'Rivers That Disappeared',
    titleTa: 'மறைந்த ஆறுகள்',
    genre: 'Environment',
    duration: '26:15',
    durationSec: 1575,
    poster: px('34334928'),
    backdrop: px('34334928', 1280),
    year: 2023,
    language: 'Tamil',
    synopsis: 'Tracing the lost rivers of Tamil Nadu and efforts to revive them through community action.',
    synopsisTa: 'தமிழகத்தின் மறைந்த ஆறுகளைத் தேடி மற்றும் அவற்றை மீட்டெடுக்கும் முயற்சிகள்.',
  },
  {
    id: 'd9',
    title: 'The Math Whiz Kids',
    titleTa: 'கணித மேதைகள்',
    genre: 'Education',
    duration: '18:24',
    durationSec: 1104,
    poster: px('18189684'),
    backdrop: px('18189684', 1280),
    year: 2024,
    language: 'Tamil',
    synopsis: 'Rural Tamil Nadu students crack international math olympiads against all odds.',
    synopsisTa: 'கிராமப்புற மாணவர்கள் சர்வதேச கணித ஒலிம்பியாடில் வெற்றி.',
    badge: 'NEW',
  },
  {
    id: 'd10',
    title: 'Silk Weavers of Kanchi',
    titleTa: 'காஞ்சி பட்டு நெசவர்கள்',
    genre: 'Culture',
    duration: '30:08',
    durationSec: 1808,
    poster: px('12435837'),
    backdrop: px('12435837', 1280),
    year: 2023,
    language: 'Tamil',
    synopsis: 'The ancient art of Kanchipuram silk weaving and the families keeping it alive.',
    synopsisTa: 'காஞ்சிபுரம் பட்டு நெசவின் பழமையான கலை மற்றும் அதை பாதுகாக்கும் குடும்பங்கள்.',
  },
  {
    id: 'd11',
    title: 'Unseen Ocean Depths',
    titleTa: 'கடலின் ஆழங்கள்',
    genre: 'Wildlife',
    duration: '34:50',
    durationSec: 2090,
    poster: px('9004341'),
    backdrop: px('9004341', 1280),
    year: 2024,
    language: 'English',
    synopsis: 'Exploring the mysterious marine life off the Coromandel Coast.',
    synopsisTa: 'கோரமண்டல் கடற்கரையின் ரகசிய கடல் வாழ்க்கை.',
    exclusive: true,
  },
  {
    id: 'd12',
    title: 'Chola Bronzes',
    titleTa: 'சோழ வெண்கலவு',
    genre: 'History',
    duration: '27:33',
    durationSec: 1653,
    poster: px('10899308'),
    backdrop: px('10899308', 1280),
    year: 2023,
    language: 'Tamil',
    synopsis: "The lost-wax casting technique that produced the world's finest bronze sculptures.",
    synopsisTa: 'உலகின் சிறந்த வெண்கல சிலைகளை உருவாக்கிய மெழுகு வார்ப்பு நுட்பம்.',
  },
];

export const inspireItems: InspireItem[] = [
  {
    id: 'i1',
    title: 'The Man Who Planted a Forest',
    titleTa: 'காடு வளர்த்த மனிதன்',
    category: 'Changemakers',
    duration: '06:24',
    poster: px('16983197'),
    quote: 'One tree at a time, I healed the land that raised me.',
    attribution: 'Muthusamy, Farmer',
    badge: 'FEATURED',
  },
  {
    id: 'i2',
    title: 'From Tea Stall to Tech CEO',
    titleTa: 'டீ கடையில் இருந்து சிஇஓ',
    category: 'Success Stories',
    duration: '04:18',
    poster: px('19747906'),
    quote: 'Poverty taught me what no business school could.',
    attribution: 'Rajesh Kumar, CEO',
  },
  {
    id: 'i3',
    title: 'Never Give Up',
    titleTa: 'ஒருபோதும் விடாதே',
    category: 'Motivation',
    duration: '02:55',
    poster: px('673018'),
    quote: 'விழுந்தால் எழு. அதுதான் வாழ்க்கை.',
    attribution: 'Daily Dose',
  },
  {
    id: 'i4',
    title: 'The Girl Who Built a School',
    titleTa: 'பள்ளி கட்டிய பெண்',
    category: 'Changemakers',
    duration: '05:40',
    poster: px('35558791'),
    quote: 'Education is the only weapon that grows sharper with sharing.',
    attribution: 'Priya Subramaniam',
  },
  {
    id: 'i5',
    title: 'Fearless at Sixteen',
    titleTa: 'பதினாறில் துணிவு',
    category: 'Youth Voices',
    duration: '03:12',
    poster: px('14555586'),
    quote: 'Age is a number. Courage is a choice.',
    attribution: 'Karthika, Student',
  },
  {
    id: 'i6',
    title: 'Loss Taught Me to Live',
    titleTa: 'இழப்பு கற்ற பாடம்',
    category: 'Life Lessons',
    duration: '04:47',
    poster: px('6945'),
    quote: 'I lost everything at 40. That\'s when life truly began.',
    attribution: 'Anand Krishnan',
  },
  {
    id: 'i7',
    title: 'The Athlete Without Legs',
    titleTa: 'கால்கள் இல்லாத வீரர்',
    category: 'Success Stories',
    duration: '05:02',
    poster: px('673018'),
    quote: 'My legs are not my limits. My mind is.',
    attribution: 'Velmurugan, Para-athlete',
  },
  {
    id: 'i8',
    title: 'Voice of the Villages',
    titleTa: 'கிராமத்தின் குரல்',
    category: 'Youth Voices',
    duration: '03:38',
    poster: px('10464476'),
    quote: 'My microphone is my weapon against silence.',
    attribution: 'Deepika, Journalist',
  },
];

export const liveSchedule: LiveSlot[] = [
  {
    id: 'l1',
    time: '06:00 PM',
    time24: '18:00',
    title: 'Morning Ecology',
    titleTa: 'காலை சுற்றுச்சூழல்',
    duration: '30 min',
    thumb: px('30004134', 400),
    description: 'Daily bulletin on environmental news across Tamil Nadu.',
  },
  {
    id: 'l2',
    time: '06:30 PM',
    time24: '18:30',
    title: 'Wild Tamil Nadu',
    titleTa: 'வனத் தமிழகம்',
    duration: '45 min',
    thumb: px('17374833', 400),
    isLive: true,
    description: 'Live from Anamalai — tracking the tiger population in real time.',
  },
  {
    id: 'l3',
    time: '07:15 PM',
    time24: '19:15',
    title: 'History Uncovered',
    titleTa: 'வரலாற்று ரகசியம்',
    duration: '40 min',
    thumb: px('31969428', 400),
    description: 'New findings from the Pandya excavation site.',
  },
  {
    id: 'l4',
    time: '07:55 PM',
    time24: '19:55',
    title: 'Science Today',
    titleTa: 'இன்றைய அறிவியல்',
    duration: '25 min',
    thumb: px('6325002', 400),
    description: 'Latest breakthroughs from Tamil Nadu research labs.',
  },
  {
    id: 'l5',
    time: '08:20 PM',
    time24: '20:20',
    title: 'Delta Stories',
    titleTa: 'டெல்டா கதைகள்',
    duration: '35 min',
    thumb: px('20212135', 400),
    description: 'Ground report from the Cauvery delta farming community.',
  },
  {
    id: 'l6',
    time: '08:55 PM',
    time24: '20:55',
    title: 'Late Night Investigates',
    titleTa: 'இரவு விசாரணை',
    duration: '50 min',
    thumb: px('13519711', 400),
    description: 'In-depth investigation into coastal sand mining networks.',
  },
];

export const ads: AdContent[] = [
  {
    id: 'ad1',
    sponsor: 'Tamil Tea Co.',
    sponsorLogo: '',
    headline: 'Pure Nilgiri Tea, Delivered Fresh',
    body: 'Hand-picked from the Blue Mountains. 20% off your first order.',
    cta: 'Buy Now',
    bgImage: px('3714923', 800),
    accent: '#2E7D32',
  },
  {
    id: 'ad2',
    sponsor: 'Chennai Motors',
    sponsorLogo: '',
    headline: 'Drive the Future — Electric Scooters',
    body: 'Zero emissions. Zero noise. 100% Tamil Nadu made. Book a test ride today.',
    cta: 'Learn More',
    bgImage: px('9168370', 800),
    accent: '#1565C0',
  },
  {
    id: 'ad3',
    sponsor: 'A2B Foods',
    sponsorLogo: '',
    headline: 'Authentic Tamil Meals, Anywhere',
    body: 'Order traditional thali and get free delivery across Tamil Nadu.',
    cta: 'Order Now',
    bgImage: px('29148133', 800),
    accent: '#EF6C00',
  },
  {
    id: 'ad4',
    sponsor: 'Mylapore Silks',
    sponsorLogo: '',
    headline: 'Wedding Season Sale — Up to 40% Off',
    body: 'Premium Kanchipuram silk sarees. Shop the new collection.',
    cta: 'Shop Now',
    bgImage: px('13042447', 800),
    accent: '#AD1457',
  },
];

export const userProfile = {
  name: 'Guest Viewer',
  nameTa: 'விருந்தினர்',
  email: 'Not signed in',
  phone: '—',
  plan: 'FREE',
  memberSince: 'Today',
  avatar: px('34770131', 200),
};

export const notifications = [
  { id: 'n1', type: 'episode', title: 'New Episode Available', titleTa: 'புதிய அத்தியாயம்', body: 'The Last Mangroves — Episode 3 is now streaming', time: '2 min ago', unread: true },
  { id: 'n2', type: 'live', title: 'Live Now: Wild Tamil Nadu', titleTa: 'நேரடி: வனத் தமிழகம்', body: 'Tiger tracking special starting now on VALLAVAN TV', time: '12 min ago', unread: true },
  { id: 'n3', type: 'sponsor', title: 'Special Offer from Tamil Tea Co.', titleTa: 'தமிழ் டீ சிறப்பு சலுகை', body: '20% off Nilgiri tea — limited time only', time: '1 hour ago', unread: true },
  { id: 'n4', type: 'system', title: 'Welcome to Vallavan', titleTa: 'வல்லவனுக்கு வரவேற்கிறோம்', body: 'Free documentaries, supported by sponsors. Enjoy!', time: '5 hours ago', unread: false },
  { id: 'n5', type: 'episode', title: 'Watch Later Reminder', titleTa: 'பின்னர் பார்க்க நினைவூட்டல்', body: 'You saved "Pandya Kingdoms" 3 days ago. Ready to watch?', time: 'Yesterday', unread: false },
  { id: 'n6', type: 'live', title: 'Live Reminder', titleTa: 'நேரடி நினைவூட்டல்', body: 'History Uncovered starts in 15 minutes', time: 'Yesterday', unread: false },
  { id: 'n7', type: 'system', title: 'App Updated', titleTa: 'செயலி புதுப்பிக்கப்பட்டது', body: 'Version 2.1.0 — improved video player and new Inspire tab', time: '2 days ago', unread: false },
];

export type FeedContentType = 'News' | 'Teaser' | 'Short Story' | 'Other';

export interface FeedReel {
  id: string;
  title: string;
  titleTa: string;
  caption: string;
  captionTa: string;
  creator: string;
  creatorHandle: string;
  contentType: FeedContentType;
  genre: Genre;
  duration: string;
  durationSec: number;
  thumb: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  status: 'Published' | 'Draft' | 'Scheduled';
  uploaded: string;
  stripAdHost: boolean;
  bannerAfter: boolean;
  attachedCampaign?: string;
  order: number;
}

export const feedReels: FeedReel[] = [
  {
    id: 'r1',
    title: 'Cauvery Delta Crisis Update',
    titleTa: 'காவிரி டெல்டா நெருக்கடி',
    caption: 'Ground report from Thanjavur — farmers protest water release cuts.',
    captionTa: 'தஞ்சாவூர் நிலஅறிக்கை — விவசாயிகள் நீர் வெட்டுக்கு எதிர்ப்பு.',
    creator: 'Vallavan News',
    creatorHandle: '@vallavannews',
    contentType: 'News',
    genre: 'Society',
    duration: '0:45',
    durationSec: 45,
    thumb: px('20212135', 800),
    likes: 12400,
    comments: 340,
    shares: 890,
    views: 145000,
    status: 'Published',
    uploaded: 'Aug 10, 2024',
    stripAdHost: true,
    bannerAfter: false,
    order: 0,
  },
  {
    id: 'r2',
    title: 'Tiger Sighting at Anamalai',
    titleTa: 'ஆனைமலையில் புலி',
    caption: 'Rare footage of a Bengal tiger crossing a forest trail at dawn.',
    captionTa: 'விடியற்காலையில் வனப்பாதையில் புலி கடந்து செல்லும் அரிய காட்சி.',
    creator: 'Wild Tamil Nadu',
    creatorHandle: '@wildtn',
    contentType: 'Teaser',
    genre: 'Wildlife',
    duration: '0:32',
    durationSec: 32,
    thumb: px('17374833', 800),
    likes: 45200,
    comments: 1200,
    shares: 3400,
    views: 560000,
    status: 'Published',
    uploaded: 'Aug 09, 2024',
    stripAdHost: false,
    bannerAfter: false,
    order: 1,
  },
  {
    id: 'r3',
    title: 'The Man Who Planted 10,000 Trees',
    titleTa: 'பத்தாயிரம் மரம் வளர்த்த மனிதன்',
    caption: '60 seconds of inspiration — one man\'s mission to reforest his village.',
    captionTa: 'அறுபது வினாடி ஊக்கம் — ஒருவரின் கிராம காடு வளர்ப்பு பயணம்.',
    creator: 'Inspire Shorts',
    creatorHandle: '@inspireshorts',
    contentType: 'Short Story',
    genre: 'Changemakers',
    duration: '1:00',
    durationSec: 60,
    thumb: px('16983197', 800),
    likes: 89000,
    comments: 2100,
    shares: 12000,
    views: 1200000,
    status: 'Published',
    uploaded: 'Aug 08, 2024',
    stripAdHost: true,
    bannerAfter: true,
    attachedCampaign: 'Nilgiri Tea Summer Push',
    order: 2,
  },
  {
    id: 'r4',
    title: 'Chola Bronze Technique Revealed',
    titleTa: 'சோழ வெண்கல நுட்பம்',
    caption: 'Watch the ancient lost-wax casting process in 45 seconds.',
    captionTa: 'நாற்பத்தைந்து வினாடியில் பழமையான மெழுகு வார்ப்பு நுட்பம்.',
    creator: 'Heritage TV',
    creatorHandle: '@heritagetv',
    contentType: 'Teaser',
    genre: 'History',
    duration: '0:48',
    durationSec: 48,
    thumb: px('10899308', 800),
    likes: 23100,
    comments: 560,
    shares: 1800,
    views: 320000,
    status: 'Published',
    uploaded: 'Aug 07, 2024',
    stripAdHost: false,
    bannerAfter: false,
    order: 3,
  },
  {
    id: 'r5',
    title: 'ISRO Launch Tracking Live',
    titleTa: 'இஸ்ரோ ஏவுதல் நேரடி',
    caption: 'Quick update on the latest satellite launch from Sriharikota.',
    captionTa: 'ஸ்ரீஹரிகோட்டாவில் இருந்து செயற்கைக்கோள் ஏவுதல் செய்தி.',
    creator: 'Vallavan News',
    creatorHandle: '@vallavannews',
    contentType: 'News',
    genre: 'Science',
    duration: '0:38',
    durationSec: 38,
    thumb: px('6325002', 800),
    likes: 34200,
    comments: 890,
    shares: 2100,
    views: 480000,
    status: 'Published',
    uploaded: 'Aug 07, 2024',
    stripAdHost: true,
    bannerAfter: false,
    order: 4,
  },
  {
    id: 'r6',
    title: 'Kanchipuram Silk in 60 Seconds',
    titleTa: 'காஞ்சிபுரம் பட்டு அறுபது வினாடி',
    caption: 'The art of weaving a silk saree — from thread to masterpiece.',
    captionTa: 'பட்டுப்புடவை நெய்வதில் இருந்து தயாரிப்பு வரை — அறுபது வினாடி.',
    creator: 'Culture Capsule',
    creatorHandle: '@culturecapsule',
    contentType: 'Teaser',
    genre: 'Culture',
    duration: '1:00',
    durationSec: 60,
    thumb: px('12435837', 800),
    likes: 56700,
    comments: 1500,
    shares: 4500,
    views: 780000,
    status: 'Published',
    uploaded: 'Aug 06, 2024',
    stripAdHost: false,
    bannerAfter: false,
    order: 5,
  },
  {
    id: 'r7',
    title: 'From Tea Stall to Tech CEO',
    titleTa: 'டீ கடையில் இருந்து சிஇஓ',
    caption: 'Rajesh Kumar\'s journey from a roadside tea stall to a tech empire.',
    captionTa: 'ராஜேஷ் குமாரின் டீ கடையில் இருந்து தொழில்நுட்ப சாம்ராஜ்யம் வரை.',
    creator: 'Inspire Shorts',
    creatorHandle: '@inspireshorts',
    contentType: 'Short Story',
    genre: 'Success Stories',
    duration: '0:55',
    durationSec: 55,
    thumb: px('19747906', 800),
    likes: 102000,
    comments: 3400,
    shares: 18000,
    views: 2100000,
    status: 'Published',
    uploaded: 'Aug 05, 2024',
    stripAdHost: true,
    bannerAfter: false,
    order: 6,
  },
  {
    id: 'r8',
    title: 'Mangrove Loss: The Numbers',
    titleTa: 'சதுப்பு நில இழப்பு: எண்கள்',
    caption: 'Data visualization showing Tamil Nadu\'s mangrove decline over 20 years.',
    captionTa: 'இருபது ஆண்டுகளில் தமிழக சதுப்பு நில வீழ்ச்சி தரவு காட்சி.',
    creator: 'Vallavan News',
    creatorHandle: '@vallavannews',
    contentType: 'News',
    genre: 'Environment',
    duration: '0:42',
    durationSec: 42,
    thumb: px('30004134', 800),
    likes: 18900,
    comments: 430,
    shares: 980,
    views: 234000,
    status: 'Published',
    uploaded: 'Aug 04, 2024',
    stripAdHost: false,
    bannerAfter: false,
    order: 7,
  },
  {
    id: 'r9',
    title: 'Coastal Erosion Investigation Clip',
    titleTa: 'கடல் அரிப்பு விசாரணை',
    caption: 'Exclusive footage of illegal sand mining operations exposed.',
    captionTa: 'சட்டவிரோத மணல் அகழ்வு நடவடிக்கைகள் வெளிப்படுத்தப்பட்டது.',
    creator: 'Investigate TN',
    creatorHandle: '@investigatetn',
    contentType: 'Teaser',
    genre: 'Investigation',
    duration: '0:50',
    durationSec: 50,
    thumb: px('13519711', 800),
    likes: 67000,
    comments: 2800,
    shares: 8900,
    views: 950000,
    status: 'Published',
    uploaded: 'Aug 03, 2024',
    stripAdHost: true,
    bannerAfter: true,
    attachedCampaign: 'Chennai Motors EV Awareness',
    order: 8,
  },
  {
    id: 'r10',
    title: 'The Math Whiz Kids Story',
    titleTa: 'கணித மேதைகள் கதை',
    caption: 'Rural students beat the odds to win international math competitions.',
    captionTa: 'கிராமப்புற மாணவர்கள் சர்வதேச கணித போட்டியில் வெற்றி.',
    creator: 'Inspire Shorts',
    creatorHandle: '@inspireshorts',
    contentType: 'Short Story',
    genre: 'Education',
    duration: '1:15',
    durationSec: 75,
    thumb: px('18189684', 800),
    likes: 78000,
    comments: 1900,
    shares: 6500,
    views: 1100000,
    status: 'Published',
    uploaded: 'Aug 02, 2024',
    stripAdHost: false,
    bannerAfter: false,
    order: 9,
  },
];

export const trendingSearches = ['Tamil Wildlife', 'Climate Change', 'Pandya History', 'Cauvery River', 'Chola Temples', 'Tiger Reserve'];
export const recentSearches = ['Mangroves documentary', 'Tamil science', 'Coastal erosion'];

export const tamilNaduDistricts = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
  'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul', 'Thanjavur',
  'Ramanathapuram', 'Sivaganga', 'Karur', 'Kanchipuram', 'Tiruvallur', 'Nagapattinam',
  'Cuddalore', 'Viluppuram', 'Namakkal', 'Dharmapuri', 'Krishnagiri', 'Virudhunagar',
  'Theni', 'Nilgiris', 'Tiruvarur', 'Ariyalur', 'Perambalur', 'Pudukkottai',
  'Sivakasi', 'Kanyakumari', 'Tenkasi', 'Tirupathur', 'Chengalpattu', 'Kallakurichi',
];

export const campaigns = [
  { id: 'c1', name: 'Nilgiri Tea Summer Push', status: 'Active', impressions: 124500, clicks: 4230, spend: 18500, startDate: 'Jul 15, 2024' },
  { id: 'c2', name: 'Chennai Motors EV Awareness', status: 'Pending Approval', impressions: 0, clicks: 0, spend: 0, startDate: 'Aug 10, 2024' },
  { id: 'c3', name: 'A2B Festive Thali', status: 'Active', impressions: 89200, clicks: 3150, spend: 12200, startDate: 'Jul 28, 2024' },
  { id: 'c4', name: 'Mylapore Silk Wedding Sale', status: 'Ended', impressions: 210000, clicks: 8900, spend: 45000, startDate: 'Jun 01, 2024' },
];

export const genres: Genre[] = [
  'Environment', 'Wildlife', 'History', 'Science', 'Society', 'Investigation', 'Education', 'Culture',
];

export const inspireCategories = ['All', 'Motivation', 'Success Stories', 'Life Lessons', 'Changemakers', 'Youth Voices'];

export const pexelsUrl = (p: string, w = 800) =>
  p.startsWith('http') ? p : `https://images.pexels.com/photos/${p.replace(/^img\//, '')}?auto=compress&cs=tinysrgb&w=${w}`;

// --- Admin mock data ---

export const adminUsers = [
  { id: 'u1', name: 'Arjun Velu', email: 'arjun@gmail.com', role: 'Viewer', joined: 'Jan 2024', status: 'Active' },
  { id: 'u2', name: 'Priya Subramaniam', email: 'priya.s@gmail.com', role: 'Viewer', joined: 'Feb 2024', status: 'Active' },
  { id: 'u3', name: 'Tamil Tea Co.', email: 'ads@tamiltea.in', role: 'Sponsor', joined: 'Mar 2024', status: 'Active' },
  { id: 'u4', name: 'Chennai Motors', email: 'marketing@chennaimotors.in', role: 'Sponsor', joined: 'Apr 2024', status: 'Active' },
  { id: 'u5', name: 'Karthik Raman', email: 'karthik@docs.in', role: 'Creator', joined: 'Dec 2023', status: 'Active' },
  { id: 'u6', name: 'Lakshmi Rao', email: 'lakshmi.r@gmail.com', role: 'Viewer', joined: 'May 2024', status: 'Suspended' },
  { id: 'u7', name: 'A2B Foods', email: 'promo@a2b.in', role: 'Sponsor', joined: 'Jun 2024', status: 'Pending' },
];

export const adminDocumentaries = [
  { id: 'ad1', title: 'The Last Mangroves', genre: 'Environment', status: 'Published', views: 24500, uploaded: 'Jan 12, 2024' },
  { id: 'ad2', title: 'Tigers of Anamalai', genre: 'Wildlife', status: 'Published', views: 18900, uploaded: 'Feb 03, 2024' },
  { id: 'ad3', title: 'Pandya Kingdoms', genre: 'History', status: 'Published', views: 31200, uploaded: 'Dec 15, 2023' },
  { id: 'ad4', title: 'Signals From Space', genre: 'Science', status: 'Draft', views: 0, uploaded: '—' },
  { id: 'ad5', title: 'The Rice Crisis', genre: 'Society', status: 'Published', views: 15600, uploaded: 'Mar 20, 2024' },
  { id: 'ad6', title: 'Untitled Delta Project', genre: 'Society', status: 'Draft', views: 0, uploaded: '—' },
];

export const adminSponsors = [
  { id: 's1', name: 'Tamil Tea Co.', campaigns: 3, spend: 18500, status: 'Active', joined: 'Mar 2024' },
  { id: 's2', name: 'Chennai Motors', campaigns: 1, spend: 0, status: 'Pending', joined: 'Apr 2024' },
  { id: 's3', name: 'A2B Foods', campaigns: 2, spend: 12200, status: 'Active', joined: 'Jun 2024' },
  { id: 's4', name: 'Mylapore Silks', campaigns: 4, spend: 45000, status: 'Active', joined: 'Jan 2024' },
];

export const adminPendingCampaigns = [
  { id: 'pc1', sponsor: 'Chennai Motors', name: 'EV Awareness Campaign', budget: 25000, submitted: 'Aug 10, 2024' },
  { id: 'pc2', sponsor: 'A2B Foods', name: 'Diwali Sweet Special', budget: 18000, submitted: 'Aug 08, 2024' },
  { id: 'pc3', sponsor: 'New Sponsor Co.', name: 'Brand Launch Teaser', budget: 32000, submitted: 'Aug 05, 2024' },
];

export const adminAdPlacements = [
  { id: 'ap1', sponsor: 'Tamil Tea Co.', placement: 'Home Banner #1', impressions: 45000, status: 'Live' },
  { id: 'ap2', sponsor: 'Chennai Motors', placement: 'Explore Native Card', impressions: 28000, status: 'Live' },
  { id: 'ap3', sponsor: 'A2B Foods', placement: 'Home Banner #2', impressions: 39000, status: 'Live' },
  { id: 'ap4', sponsor: 'Mylapore Silks', placement: 'Live Schedule Banner', impressions: 22000, status: 'Live' },
  { id: 'ap5', sponsor: 'Tamil Tea Co.', placement: 'Video Pre-roll', impressions: 56000, status: 'Live' },
];

export const adminAuditLogs = [
  { id: 'al1', user: 'admin@vallavan', action: 'Approved campaign "Nilgiri Tea Summer Push"', time: 'Aug 05, 14:32' },
  { id: 'al2', user: 'admin@vallavan', action: 'Published "The Rice Crisis"', time: 'Aug 05, 11:15' },
  { id: 'al3', user: 'admin@vallavan', action: 'Suspended user lakshmi.r@gmail.com', time: 'Aug 04, 18:45' },
  { id: 'al4', user: 'admin@vallavan', action: 'Updated Live TV schedule', time: 'Aug 04, 10:20' },
  { id: 'al5', user: 'admin@vallavan', action: 'Rejected campaign "Spam Ads Inc."', time: 'Aug 03, 16:10' },
];
