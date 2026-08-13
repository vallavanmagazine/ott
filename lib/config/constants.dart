/// Static reference data mirrored from the web app.
class K {
  static const genres = [
    'Environment', 'Wildlife', 'History', 'Science',
    'Society', 'Investigation', 'Education', 'Culture',
  ];

  static const inspireCategories = [
    'All', 'Motivation', 'Success Stories', 'Life Lessons', 'Changemakers', 'Youth Voices',
  ];

  static const feedCategories = [
    'All', 'News', 'Teaser', 'Short Story', 'Entertainment', 'Sports',
  ];

  static const tamilNaduDistricts = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
    'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul', 'Thanjavur',
    'Ramanathapuram', 'Sivaganga', 'Karur', 'Kanchipuram', 'Tiruvallur', 'Nagapattinam',
    'Cuddalore', 'Viluppuram', 'Namakkal', 'Dharmapuri', 'Krishnagiri', 'Virudhunagar',
    'Theni', 'Nilgiris', 'Tiruvarur', 'Ariyalur', 'Perambalur', 'Pudukkottai',
    'Sivakasi', 'Kanyakumari', 'Tenkasi', 'Tirupathur', 'Chengalpattu', 'Kallakurichi',
  ];

  static const midrollMinSec = 300; // mid-roll only for videos longer than 5 min
}

/// Turn a Pexels id or full URL into an image URL (mirrors web pexelsUrl()).
String pexelsUrl(String p, {int w = 800}) {
  if (p.startsWith('http')) return p;
  final id = p.replaceFirst(RegExp(r'^img/'), '');
  return 'https://images.pexels.com/photos/$id/pexels-photo-$id.jpeg?auto=compress&cs=tinysrgb&w=$w';
}
